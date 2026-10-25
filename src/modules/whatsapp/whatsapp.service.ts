import QRCode from "qrcode";
import fs from "node:fs";
import path from "node:path";
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  WASocket,
} from "@whiskeysockets/baileys";
import pino from "pino";
import {
  WhatsAppSessionInfo,
  WhatsAppSendMessageInput,
  WhatsAppMessageResult,
} from "./types";
import {
  conversationsData,
  appendIncomingMessage,
  appendOutgoingMessage,
  getOrCreateConversationByProspect,
} from "@/modules/inbox/inbox.service";
import {
  prospectsData,
  confirmOutreachSent,
  recordClientReply,
} from "@/modules/crm/crm.service";
import { normalizeWhatsAppNumber } from "@/modules/crm/types";
import { logActivity } from "@/lib/logger";

interface WhatsAppGlobalStore {
  waSession?: WhatsAppSessionInfo;
  waSocket?: WASocket | null;
  isInitializing?: boolean;
  initStartTime?: number;
}

const waGlobal = globalThis as unknown as WhatsAppGlobalStore;

if (!waGlobal.waSession) {
  waGlobal.waSession = {
    status: "DISCONNECTED",
    qrCodeDataUrl: null,
    phoneNumber: null,
    pushName: null,
    platform: "WhatsApp Multi-Device (Fynux Engine)",
    connectedAt: null,
    lastActiveAt: null,
    error: null,
  };
}

const AUTH_DIR = path.join(process.cwd(), ".whatsapp-auth");

function ensureAuthDir() {
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }
}

export async function getWhatsAppSession(): Promise<WhatsAppSessionInfo> {
  return { ...waGlobal.waSession! };
}

/**
 * Memulai sesi Baileys WhatsApp Multi-Device resmi.
 * Menghubungkan WebSocket ke wss://web.whatsapp.com/ws/chat dan menerima QR code kriptografis asli dari WhatsApp.
 */
export async function startWhatsAppPairing(
  forceRestart = false
): Promise<WhatsAppSessionInfo> {
  // 1. Jika sudah terhubung, langsung kembalikan status aktif
  if (!forceRestart && waGlobal.waSession?.status === "CONNECTED" && waGlobal.waSocket) {
    return { ...waGlobal.waSession };
  }

  // 2. Jika QR code sudah ada dan masih aktif (tidak force restart), kembalikan langsung
  if (!forceRestart && waGlobal.waSession?.status === "SCANNING_QR" && waGlobal.waSession.qrCodeDataUrl) {
    return { ...waGlobal.waSession };
  }

  // 3. Jika force restart atau socket lama perlu dibersihkan
  if (forceRestart && waGlobal.waSocket) {
    try {
      waGlobal.waSocket.end(undefined);
    } catch {}
    waGlobal.waSocket = null;
    waGlobal.waSession!.qrCodeDataUrl = null;
    waGlobal.waSession!.status = "DISCONNECTED";
  }

  // 4. Cegah double-init yang macet (timeout 10 detik)
  if (waGlobal.isInitializing) {
    const elapsed = Date.now() - (waGlobal.initStartTime || 0);
    if (elapsed < 10000) {
      return { ...waGlobal.waSession! };
    }
  }

  waGlobal.isInitializing = true;
  waGlobal.initStartTime = Date.now();
  ensureAuthDir();

  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    const sock = makeWASocket({
      auth: state,
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      browser: ["Fynux OS", "Chrome", "120.0.0"],
      connectTimeoutMs: 30000,
      defaultQueryTimeoutMs: 30000,
      keepAliveIntervalMs: 15000,
    });

    waGlobal.waSocket = sock;

    // Simpan credentials saat terupdate
    sock.ev.on("creds.update", saveCreds);

    // Promise untuk menunggu emisi QR pertama dari server WhatsApp (maks 10 detik)
    const qrPromise = new Promise<string | null>((resolve) => {
      const timeout = setTimeout(() => {
        resolve(waGlobal.waSession?.qrCodeDataUrl || null);
      }, 10000);

      const connHandler = async (update: any) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          clearTimeout(timeout);
          try {
            const dataUrl = await QRCode.toDataURL(qr, {
              width: 280,
              margin: 2,
              color: {
                dark: "#128C7E", // WhatsApp Teal
                light: "#FFFFFF",
              },
            });
            waGlobal.waSession!.status = "SCANNING_QR";
            waGlobal.waSession!.qrCodeDataUrl = dataUrl;
            waGlobal.waSession!.lastActiveAt = new Date().toISOString();
            resolve(dataUrl);
          } catch (e) {
            resolve(null);
          }
        }

        if (connection === "open") {
          clearTimeout(timeout);
          const rawId = sock.user?.id || "";
          const phone = rawId.split("@")[0].split(":")[0];
          const pushName = sock.user?.name || "Akun Bisnis Fynux";

          waGlobal.waSession = {
            status: "CONNECTED",
            qrCodeDataUrl: null,
            phoneNumber: phone,
            pushName: pushName,
            platform: "WhatsApp Multi-Device (WhatsApp Web)",
            connectedAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
            error: null,
          };

          logActivity({
            category: "CRM",
            action: "WHATSAPP_CONNECTED",
            actorId: "SYSTEM_WHATSAPP",
            targetId: phone,
            metadata: { pushName, platform: "WhatsApp Web Multi-Device" },
          });

          resolve(null);
        }

        if (connection === "close") {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;

          if (statusCode === DisconnectReason.loggedOut) {
            waGlobal.waSession = {
              status: "DISCONNECTED",
              qrCodeDataUrl: null,
              phoneNumber: null,
              pushName: null,
              platform: null,
              connectedAt: null,
              lastActiveAt: new Date().toISOString(),
              error: "Sesi telah logout dari WhatsApp ponsel.",
            };
            try {
              fs.rmSync(AUTH_DIR, { recursive: true, force: true });
            } catch {}
            waGlobal.waSocket = null;
          }
        }
      };

      sock.ev.on("connection.update", connHandler);
    });

    // Dengarkan pesan masuk secara real-time dari WhatsApp
    sock.ev.on("messages.upsert", async ({ messages }) => {
      for (const msg of messages) {
        // Abaikan pesan yang dikirim oleh akun kita sendiri
        if (msg.key.fromMe) continue;

        const rawJid = msg.key.remoteJid || "";
        // Abaikan pesan broadcast atau status WhatsApp
        if (!rawJid || rawJid.includes("@broadcast") || rawJid.includes("status@broadcast")) continue;

        // Normalisasi nomor telepon pengirim dari JID WhatsApp
        const rawPhone = rawJid.split("@")[0].split(":")[0];
        const participantPhone = msg.key.participant?.split("@")[0].split(":")[0];
        const phone = /^\d+$/.test(rawPhone) ? rawPhone : (participantPhone || rawPhone);

        // Ekstraksi teks dari seluruh variasi format pesan WhatsApp (teks biasa, pesan sementara/ephemeral, media caption, dsb)
        const content = msg.message;
        let text = "";

        if (content) {
          text =
            content.conversation ||
            content.extendedTextMessage?.text ||
            content.ephemeralMessage?.message?.conversation ||
            content.ephemeralMessage?.message?.extendedTextMessage?.text ||
            content.viewOnceMessage?.message?.conversation ||
            content.viewOnceMessage?.message?.extendedTextMessage?.text ||
            content.viewOnceMessageV2?.message?.conversation ||
            content.viewOnceMessageV2?.message?.extendedTextMessage?.text ||
            content.documentWithCaptionMessage?.message?.documentMessage?.caption ||
            content.imageMessage?.caption ||
            content.videoMessage?.caption ||
            "";
        }

        if (text && text.trim()) {
          console.log(`[WA_INCOMING] Pesan diterima dari +${phone}: "${text.trim().slice(0, 50)}"`);
          await handleIncomingWhatsAppMessage(phone, text.trim());
        }
      }
    });

    await qrPromise;
    waGlobal.isInitializing = false;

    return { ...waGlobal.waSession! };
  } catch (err: unknown) {
    waGlobal.isInitializing = false;
    const msg = err instanceof Error ? err.message : "Gagal memulai koneksi WhatsApp";
    waGlobal.waSession!.status = "ERROR";
    waGlobal.waSession!.error = msg;
    return { ...waGlobal.waSession! };
  }
}

/**
 * Konfirmasi pairing instan (digunakan untuk testing developer jika tidak ada HP sekunder)
 */
export async function confirmWhatsAppPairing(
  phoneNumber: string = "62895324069850",
  pushName: string = "Fynux Official Account"
): Promise<WhatsAppSessionInfo> {
  const { formatted, isValid } = normalizeWhatsAppNumber(phoneNumber);
  const validPhone = isValid ? formatted : "62895324069850";

  waGlobal.waSession = {
    status: "CONNECTED",
    qrCodeDataUrl: null,
    phoneNumber: validPhone,
    pushName: pushName,
    platform: "WhatsApp Web (Chrome / macOS)",
    connectedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    error: null,
  };

  logActivity({
    category: "CRM",
    action: "WHATSAPP_CONNECTED",
    actorId: "SYSTEM_WHATSAPP",
    targetId: validPhone,
    metadata: { pushName, platform: "WhatsApp Web" },
  });

  return { ...waGlobal.waSession };
}

/**
 * Memutuskan sesi WhatsApp Web
 */
export async function disconnectWhatsApp(): Promise<WhatsAppSessionInfo> {
  const previousPhone = waGlobal.waSession?.phoneNumber;

  if (waGlobal.waSocket) {
    try {
      await waGlobal.waSocket.logout();
    } catch {}
    try {
      waGlobal.waSocket.end(undefined);
    } catch {}
    waGlobal.waSocket = null;
  }

  try {
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
  } catch {}

  waGlobal.waSession = {
    status: "DISCONNECTED",
    qrCodeDataUrl: null,
    phoneNumber: null,
    pushName: null,
    platform: null,
    connectedAt: null,
    lastActiveAt: new Date().toISOString(),
    error: null,
  };

  logActivity({
    category: "CRM",
    action: "WHATSAPP_DISCONNECTED",
    actorId: "USER",
    targetId: previousPhone || "unknown",
  });

  return { ...waGlobal.waSession };
}

/**
 * Mengirim pesan keluar dari dashboard WhatsApp Web
 * Jika Baileys tersambung, mengirim langsung lewat WhatsApp Socket
 * Secara otomatis memicu sinkronisasi status prospek CRM ke 'CONTACTED'
 */
export async function sendWhatsAppMessage(
  input: WhatsAppSendMessageInput
): Promise<WhatsAppMessageResult> {
  if (!input.text || !input.text.trim()) {
    return { success: false, error: "Pesan tidak boleh kosong." };
  }

  const { formatted: waFormatted, isValid } = normalizeWhatsAppNumber(
    input.whatsappNumber
  );

  if (!isValid) {
    return { success: false, error: "Nomor WhatsApp tujuan tidak valid." };
  }

  // 1. Cari atau buat thread percakapan di Inbox
  let matchedThread = conversationsData.find(
    (c) => c.whatsappNumber.replace(/\D/g, "") === waFormatted
  );

  const matchedProspect = prospectsData.find(
    (p) => p.whatsappNumber === waFormatted && !p.isArchived
  );

  if (!matchedThread) {
    if (matchedProspect) {
      matchedThread = await getOrCreateConversationByProspect(matchedProspect);
    } else {
      matchedThread = await getOrCreateConversationByProspect({
        id: `p-direct-${Date.now()}`,
        companyName: `Kontak WA +${waFormatted}`,
        contactName: `Pengguna +${waFormatted}`,
        whatsappNumber: waFormatted,
        researchNotes: "Kontak langsung dari WhatsApp Web Inbox",
      });
    }
  }

  // 2. Tambahkan pesan keluar ke thread Inbox Fynux
  const appendRes = await appendOutgoingMessage(
    matchedThread.id,
    input.text.trim(),
    "SALES"
  );

  // 3. Jika socket Baileys aktif terhubung ke WhatsApp asli, kirim secara nyata!
  if (
    waGlobal.waSocket &&
    waGlobal.waSession?.status === "CONNECTED" &&
    waGlobal.waSocket.user
  ) {
    try {
      const jid = `${waFormatted}@s.whatsapp.net`;
      await waGlobal.waSocket.sendMessage(jid, { text: input.text.trim() });
    } catch (sendErr) {
      console.error("Gagal mengirim via socket Baileys:", sendErr);
    }
  }

  // 4. Update logika status CRM secara otomatis
  let updatedStage = matchedProspect?.stage;

  if (matchedProspect) {
    const actorId = input.actorUserId || "current-sales-id";
    const actorName = input.actorUserName || "Budi Santoso (Sales)";

    // Jika prospek masih baru (NEW), pindahkan ke CONTACTED dan jadwalkan follow-up
    if (matchedProspect.stage === "NEW") {
      const confirmRes = await confirmOutreachSent(
        matchedProspect.id,
        actorId,
        actorName,
        `Outreach pertama dikirim via Native WhatsApp Web Engine.`
      );
      if (confirmRes.success) {
        updatedStage = "CONTACTED";
      }
    } else {
      matchedProspect.lastReachAt = new Date().toISOString();
      matchedProspect.updatedAt = new Date().toISOString();
    }
  }

  if (waGlobal.waSession) {
    waGlobal.waSession.lastActiveAt = new Date().toISOString();
  }

  return {
    success: true,
    messageId: appendRes.message?.id || `msg-${Date.now()}`,
    timestamp: new Date().toISOString(),
    updatedStage,
  };
}

/**
 * Menangani pesan masuk dari klien / prospek (melalui Socket Baileys, Webhook, atau Simulasi)
 * Secara otomatis memicu transisi status CRM menjadi 'RESPONDED'
 */
export async function handleIncomingWhatsAppMessage(
  rawPhone: string,
  text: string
): Promise<{ success: boolean; conversationId?: string; prospectId?: string }> {
  if (!text || !text.trim()) return { success: false };

  const { formatted: waFormatted, isValid } = normalizeWhatsAppNumber(rawPhone);
  const cleanPhone = isValid ? waFormatted : rawPhone.replace(/\D/g, "");

  // 1. Cari atau buat thread di Inbox
  let matchedThread = conversationsData.find(
    (c) => c.whatsappNumber.replace(/\D/g, "") === cleanPhone
  );

  const matchedProspect = prospectsData.find(
    (p) => p.whatsappNumber === cleanPhone && !p.isArchived
  );

  if (!matchedThread) {
    if (matchedProspect) {
      matchedThread = await getOrCreateConversationByProspect(matchedProspect);
    } else {
      matchedThread = await getOrCreateConversationByProspect({
        id: `p-incoming-${Date.now()}`,
        companyName: `Bisnis (+${cleanPhone})`,
        contactName: `Klien (+${cleanPhone})`,
        whatsappNumber: cleanPhone,
        researchNotes: "Kontak baru menghubungi via WhatsApp Web",
      });
    }
  }

  // 2. Tambahkan pesan masuk ke thread
  await appendIncomingMessage(matchedThread.id, text.trim());

  // 3. Logika CRM Otomatis: Pindahkan ke RESPONDED dan hentikan spam follow-up
  if (matchedProspect) {
    await recordClientReply(matchedProspect.id, text.trim(), "SYSTEM_WHATSAPP");
  }

  if (waGlobal.waSession) {
    waGlobal.waSession.lastActiveAt = new Date().toISOString();
  }

  logActivity({
    category: "CRM",
    action: "PROSPECT_RESPONDED_VIA_WHATSAPP",
    actorId: "SYSTEM_WHATSAPP",
    targetId: matchedProspect ? matchedProspect.id : cleanPhone,
    metadata: {
      phone: cleanPhone,
      textSnippet: text.slice(0, 80),
      prospectUpdated: !!matchedProspect,
    },
  });

  return {
    success: true,
    conversationId: matchedThread.id,
    prospectId: matchedProspect?.id,
  };
}
