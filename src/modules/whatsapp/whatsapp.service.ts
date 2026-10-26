import QRCode from "qrcode";
import fs from "node:fs";
import path from "node:path";
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  WASocket,
  proto,
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
  persistConversations,
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

const isTestEnv =
  process.env.NODE_ENV === "test" ||
  process.env.npm_lifecycle_event === "test" ||
  process.argv.some((a) => a.includes("test"));

const AUTH_DIR = isTestEnv
  ? path.join(process.cwd(), ".whatsapp-auth-test")
  : path.join(process.cwd(), ".whatsapp-auth");

function ensureAuthDir() {
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }
}

// ============================================================================
// WHATSAPP MULTI-DEVICE LID & RETRY PROTOCOL HANDLERS
// ============================================================================

const sentMessagesCache = new Map<string, proto.IMessage>();
const DATA_DIR = path.join(process.cwd(), "data");
const LID_MAP_FILE = path.join(DATA_DIR, "whatsapp-lid-map.json");

function loadLidMap(): Map<string, string> {
  const map = new Map<string, string>();
  // Pre-seed known user test LID mapping
  map.set("51372120633567", "62895324069850");

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(LID_MAP_FILE)) {
      const data = JSON.parse(fs.readFileSync(LID_MAP_FILE, "utf-8"));
      for (const [k, v] of Object.entries(data)) {
        map.set(k, v as string);
      }
    }
  } catch (err) {
    console.error("[WA_LID] Gagal membaca LID map:", err);
  }
  return map;
}

function saveLidMap(map: Map<string, string>): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const obj: Record<string, string> = {};
    map.forEach((v, k) => {
      obj[k] = v;
    });
    fs.writeFileSync(LID_MAP_FILE, JSON.stringify(obj, null, 2), "utf-8");
  } catch (err) {
    console.error("[WA_LID] Gagal menyimpan LID map:", err);
  }
}

const lidToPhoneMap = loadLidMap();

/**
 * Daftarkan asosiasi nomor telepon asli (e.g. 62895324069850)
 * dengan identitas LID WhatsApp Multi-Device (e.g. 51372120633567@lid)
 */
export function registerLidMapping(lid: string, phone: string) {
  const cleanLid = lid.replace("@lid", "").split(":")[0];
  const cleanPhone = phone.replace("@s.whatsapp.net", "").replace(/\D/g, "");
  if (!cleanLid || !cleanPhone || cleanLid === cleanPhone) return;

  lidToPhoneMap.set(cleanLid, cleanPhone);
  saveLidMap(lidToPhoneMap);

  // Pasang remoteJid ke percakapan nomor telepon terkait jika belum ada
  const thread = conversationsData.find(
    (c) => c.whatsappNumber.replace(/\D/g, "") === cleanPhone
  );
  if (thread && !thread.remoteJid) {
    thread.remoteJid = `${cleanLid}@lid`;
    persistConversations();
  }
}

/**
 * Otomatis menggabungkan percakapan orphan yang terbuat dari LID (misal +51372120633567)
 * ke percakapan prospek CRM resmi (e.g. PT RUDAL AJAIB 62895324069850).
 */
export function cleanupAndMergeLidConversations(): void {
  lidToPhoneMap.forEach((realPhone, lidNum) => {
    const orphanIndex = conversationsData.findIndex(
      (c) =>
        (c.whatsappNumber === lidNum ||
          c.whatsappNumber.replace(/\D/g, "") === lidNum ||
          (c.remoteJid === `${lidNum}@lid` && c.whatsappNumber !== realPhone)) &&
        c.companyName.includes(lidNum)
    );

    if (orphanIndex === -1) return;
    const orphan = conversationsData[orphanIndex];

    const realThread = conversationsData.find(
      (c) => c.whatsappNumber.replace(/\D/g, "") === realPhone
    );

    if (realThread && orphan.id !== realThread.id) {
      console.log(
        `[WA_LID] Menggabungkan pesan dari thread LID "${orphan.companyName}" (${orphan.id}) ke prospek CRM "${realThread.companyName}" (${realThread.id})`
      );

      // Pindahkan seluruh pesan dari orphan ke realThread
      for (const m of orphan.messages) {
        const alreadyExists = realThread.messages.some(
          (rm) => rm.text === m.text && Math.abs(new Date(rm.timestamp).getTime() - new Date(m.timestamp).getTime()) < 2000
        );
        if (!alreadyExists) {
          realThread.messages.push({
            ...m,
            conversationId: realThread.id,
          });
        }
      }

      realThread.remoteJid = `${lidNum}@lid`;

      // Urutkan pesan berdasarkan waktu
      realThread.messages.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      const latestMsg = realThread.messages[realThread.messages.length - 1];
      if (latestMsg) {
        realThread.lastMessageSnippet = latestMsg.text.slice(0, 80);
        realThread.lastMessageAt = latestMsg.timestamp;
      }

      // Hapus thread orphan
      conversationsData.splice(orphanIndex, 1);
      persistConversations();

      // Sinkronkan stage prospek CRM ke RESPONDED jika ada balasan masuk dari klien
      const prospect = prospectsData.find(
        (p) => p.whatsappNumber.replace(/\D/g, "") === realPhone
      );
      if (prospect && realThread.messages.some((m) => m.sender === "PROSPECT")) {
        recordClientReply(
          prospect.id,
          latestMsg?.text || "Balasan klien via WhatsApp",
          "SYSTEM_WHATSAPP"
        ).catch(console.error);
      }
    }
  });
}

// Jalankan pembersihan saat inisialisasi modul
cleanupAndMergeLidConversations();

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
      getMessage: async (key) => {
        if (key.id && sentMessagesCache.has(key.id)) {
          return sentMessagesCache.get(key.id);
        }
        for (const conv of conversationsData) {
          const found = conv.messages.find((m) => m.id === key.id);
          if (found) {
            return { conversation: found.text };
          }
        }
        return undefined;
      },
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
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

          if (shouldReconnect) {
            console.log(
              `[WA_SOCKET] Koneksi terputus sementara (code ${statusCode}). Menyambung ulang dalam 3 detik...`
            );
            setTimeout(() => {
              if (waGlobal.waSession?.status !== "DISCONNECTED") {
                startWhatsAppPairing(false).catch(console.error);
              }
            }, 3000);
          } else {
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

    // Dengarkan pemetaan LID ke nomor telepon resmi dari WhatsApp
    sock.ev.on("chats.phoneNumberShare", ({ lid, jid }) => {
      console.log(`[WA_LID] chats.phoneNumberShare diterima: ${lid} -> ${jid}`);
      registerLidMapping(lid, jid);
      cleanupAndMergeLidConversations();
    });

    sock.ev.on("contacts.upsert", (contacts) => {
      for (const c of contacts) {
        const phoneJid = (c as any).jid || c.id;
        if (c.lid && phoneJid) {
          registerLidMapping(c.lid, phoneJid);
        }
      }
      cleanupAndMergeLidConversations();
    });

    sock.ev.on("contacts.update", (updates) => {
      for (const c of updates) {
        const phoneJid = (c as any).jid || c.id;
        if (c.lid && phoneJid) {
          registerLidMapping(c.lid, phoneJid);
        }
      }
      cleanupAndMergeLidConversations();
    });

    // Dengarkan pesan masuk secara real-time dari WhatsApp
    sock.ev.on("messages.upsert", async ({ messages }) => {
      for (const msg of messages) {
        // Abaikan pesan yang dikirim oleh akun kita sendiri
        if (msg.key.fromMe) continue;

        const rawJid = msg.key.remoteJid || "";
        // Abaikan pesan broadcast atau status WhatsApp
        if (!rawJid || rawJid.includes("@broadcast") || rawJid.includes("status@broadcast")) continue;

        // Ekstraksi identitas pengirim (baik Phone Number @s.whatsapp.net maupun LID @lid)
        const rawId = rawJid.split("@")[0].split(":")[0];
        const senderPn = (msg.key as any).senderPn || (msg.key as any).participantPn;
        let phone = "";

        if (senderPn) {
          phone = senderPn.split("@")[0].split(":")[0];
          if (rawJid.endsWith("@lid")) {
            registerLidMapping(rawJid, senderPn);
          }
        }

        if (!phone) {
          if (rawJid.endsWith("@lid")) {
            // Cari dari peta LID
            const mapped = lidToPhoneMap.get(rawId);
            if (mapped) {
              phone = mapped;
            } else {
              const matchedByJid = conversationsData.find((c) => c.remoteJid === rawJid);
              if (matchedByJid) {
                phone = matchedByJid.whatsappNumber;
              } else {
                phone = rawId;
              }
            }
          } else {
            phone = /^\d+$/.test(rawId)
              ? rawId
              : (msg.key.participant?.split("@")[0].split(":")[0] || rawId);
          }
        }

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
          console.log(`[WA_INCOMING] Pesan diterima dari +${phone} (JID: ${rawJid}): "${text.trim().slice(0, 50)}"`);
          await handleIncomingWhatsAppMessage(phone, text.trim(), rawJid);
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
        assignedSalesId: input.actorUserId,
        assignedSalesName: input.actorUserName,
      });
    }
  }

  // 2. Tambahkan pesan keluar ke thread Inbox Fynux
  const appendRes = await appendOutgoingMessage(
    matchedThread.id,
    input.text.trim(),
    "SALES",
    input.actorUserId,
    input.actorUserName
  );

  // 3. Jika socket Baileys aktif terhubung ke WhatsApp asli, kirim secara nyata!
  let deliveredViaSocket = false;
  let socketError: string | undefined;

  if (
    waGlobal.waSocket &&
    waGlobal.waSession?.status === "CONNECTED" &&
    waGlobal.waSocket.user
  ) {
    try {
      // Tentukan JID tujuan WhatsApp (gunakan remoteJid jika ada, atau format @lid / @s.whatsapp.net)
      let targetJid = matchedThread.remoteJid;

      // Cek apakah nomor ini memiliki pemetaan LID yang sudah tersimpan
      if (!targetJid) {
        lidToPhoneMap.forEach((pn, lid) => {
          if (!targetJid && pn === waFormatted) {
            targetJid = `${lid}@lid`;
            matchedThread.remoteJid = targetJid;
            persistConversations();
          }
        });
      }

      // Jika belum ada remoteJid, cari via query onWhatsApp ke server WhatsApp
      if (!targetJid) {
        try {
          const onWaList = await waGlobal.waSocket.onWhatsApp(waFormatted);
          const onWa = onWaList?.[0] as any;
          if (onWa) {
            if (typeof onWa.lid === "string" && onWa.lid) {
              registerLidMapping(onWa.lid, waFormatted);
              targetJid = onWa.lid;
              matchedThread.remoteJid = onWa.lid;
              persistConversations();
            } else if (onWa.jid) {
              targetJid = onWa.jid;
            }
          }
        } catch (onWaErr) {
          console.warn("[WA_SEND] Gagal onWhatsApp lookup:", onWaErr);
        }
      }

      if (!targetJid) {
        if (input.whatsappNumber.includes("@")) {
          targetJid = input.whatsappNumber;
        } else if (waFormatted.length >= 14 && /^(10|51)/.test(waFormatted)) {
          targetJid = `${waFormatted}@lid`;
        } else {
          targetJid = `${waFormatted}@s.whatsapp.net`;
        }
      }

      console.log(`[WA_SEND] Mengirim pesan ke JID "${targetJid}": "${input.text.trim().slice(0, 50)}"`);
      const sent = await waGlobal.waSocket.sendMessage(targetJid, { text: input.text.trim() });
      if (sent?.key?.id && sent?.message) {
        sentMessagesCache.set(sent.key.id, sent.message);
      }
      console.log(`[WA_SEND] Pesan berhasil meluncur ke "${targetJid}"!`);
      deliveredViaSocket = true;
    } catch (sendErr) {
      socketError = sendErr instanceof Error ? sendErr.message : "Gagal mengirim via WhatsApp socket";
      console.error("Gagal mengirim via socket Baileys:", sendErr);
    }
  } else {
    console.log("[WA_SEND] Peringatan: Socket Baileys belum dalam status CONNECTED.");
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

  const warning = !deliveredViaSocket
    ? waGlobal.waSession?.status !== "CONNECTED"
      ? "Sesi WhatsApp belum terhubung ke HP. Pesan tersimpan di sistem namun belum terkirim ke WhatsApp ponsel. Silakan klik tombol 'Tautkan WA' dan scan QR code terlebih dahulu."
      : `Pesan tersimpan di dashboard namun gagal dikirim ke WhatsApp: ${socketError || "Gagal menghubungi socket"}`
    : undefined;

  return {
    success: true,
    deliveredViaSocket,
    messageId: appendRes.message?.id || `msg-${Date.now()}`,
    timestamp: new Date().toISOString(),
    updatedStage,
    warning,
  };
}

/**
 * Menangani pesan masuk dari klien / prospek (melalui Socket Baileys, Webhook, atau Simulasi)
 * Secara otomatis memicu transisi status CRM menjadi 'RESPONDED'
 */
export async function handleIncomingWhatsAppMessage(
  rawPhone: string,
  text: string,
  rawJid?: string
): Promise<{ success: boolean; conversationId?: string; prospectId?: string }> {
  if (!text || !text.trim()) return { success: false };

  // Resolusi nomor telepon jika pengirim berupa LID WhatsApp (@lid)
  let effectivePhone = rawPhone.replace(/\D/g, "");
  if (rawJid?.endsWith("@lid") || /^(10|51)/.test(effectivePhone)) {
    const rawLid = rawJid ? rawJid.replace("@lid", "").split(":")[0] : effectivePhone;
    const mapped = lidToPhoneMap.get(rawLid) || lidToPhoneMap.get(effectivePhone);
    if (mapped) {
      effectivePhone = mapped;
    }
  }

  const { formatted: waFormatted, isValid } = normalizeWhatsAppNumber(effectivePhone);
  const cleanPhone = isValid ? waFormatted : effectivePhone;

  // 1. Cari atau buat thread di Inbox
  let matchedThread = conversationsData.find(
    (c) =>
      c.whatsappNumber.replace(/\D/g, "") === cleanPhone ||
      (rawJid && c.remoteJid === rawJid)
  );

  const matchedProspect = prospectsData.find(
    (p) => p.whatsappNumber === cleanPhone && !p.isArchived
  );

  if (!matchedThread) {
    if (matchedProspect) {
      matchedThread = await getOrCreateConversationByProspect({
        ...matchedProspect,
        remoteJid: rawJid,
      });
    } else {
      matchedThread = await getOrCreateConversationByProspect({
        id: `p-incoming-${Date.now()}`,
        companyName: `Bisnis (+${cleanPhone})`,
        contactName: `Klien (+${cleanPhone})`,
        whatsappNumber: cleanPhone,
        remoteJid: rawJid,
        researchNotes: "Kontak baru menghubungi via WhatsApp Web",
      });
    }
  } else {
    if (rawJid && !matchedThread.remoteJid) {
      matchedThread.remoteJid = rawJid;
    }
    if (matchedProspect && !matchedThread.assignedSalesId) {
      matchedThread.assignedSalesId = matchedProspect.assignedSalesId;
      matchedThread.assignedSalesName = matchedProspect.assignedSalesName;
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
