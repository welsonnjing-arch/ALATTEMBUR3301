import QRCode from "qrcode";
import fs from "node:fs";
import path from "node:path";
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  WASocket,
  proto,
  downloadMediaMessage,
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
  updateMessageStatus,
  updateMessageExternalId,
  markConversationAsRead,
  markThreadOutgoingMessagesAsRead,
} from "@/modules/inbox/inbox.service";
import { ChatAttachment, MessageStatus } from "@/modules/inbox/types";
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

const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads", "whatsapp");

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
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

        // Ekstraksi pesan yang mungkin terbungkus viewOnce, ephemeral, atau documentWithCaption
        let innerMessage = msg.message;
        if (innerMessage?.ephemeralMessage?.message) {
          innerMessage = innerMessage.ephemeralMessage.message;
        }
        if (innerMessage?.viewOnceMessage?.message) {
          innerMessage = innerMessage.viewOnceMessage.message;
        }
        if (innerMessage?.viewOnceMessageV2?.message) {
          innerMessage = innerMessage.viewOnceMessageV2.message;
        }
        if (innerMessage?.documentWithCaptionMessage?.message) {
          innerMessage = innerMessage.documentWithCaptionMessage.message;
        }

        let text =
          innerMessage?.conversation ||
          innerMessage?.extendedTextMessage?.text ||
          innerMessage?.documentMessage?.caption ||
          innerMessage?.imageMessage?.caption ||
          innerMessage?.videoMessage?.caption ||
          "";

        // Deteksi apakah pesan menyertakan file atau gambar
        let attachment: ChatAttachment | undefined = undefined;
        const mediaMsg =
          innerMessage?.imageMessage ||
          innerMessage?.documentMessage ||
          innerMessage?.videoMessage ||
          innerMessage?.audioMessage;

        if (mediaMsg) {
          try {
            ensureUploadsDir();
            const isImage = !!innerMessage?.imageMessage;
            const isDoc = !!innerMessage?.documentMessage;
            const isVideo = !!innerMessage?.videoMessage;
            const isAudio = !!innerMessage?.audioMessage;

            const mime =
              mediaMsg.mimetype ||
              (isImage
                ? "image/jpeg"
                : isDoc
                ? "application/pdf"
                : isVideo
                ? "video/mp4"
                : isAudio
                ? "audio/ogg"
                : "application/octet-stream");

            let ext = ".bin";
            if (mime.includes("jpeg") || mime.includes("jpg")) ext = ".jpg";
            else if (mime.includes("png")) ext = ".png";
            else if (mime.includes("webp")) ext = ".webp";
            else if (mime.includes("pdf")) ext = ".pdf";
            else if (mime.includes("sheet") || mime.includes("excel")) ext = ".xlsx";
            else if (mime.includes("word") || mime.includes("document")) ext = ".docx";
            else if (mime.includes("zip")) ext = ".zip";
            else if (isImage) ext = ".jpg";
            else if (isVideo) ext = ".mp4";
            else if (isAudio) ext = ".mp3";

            const origName =
              (mediaMsg as any).fileName ||
              (isImage ? `foto_${Date.now()}${ext}` : `dokumen_${Date.now()}${ext}`);

            const safeFilename = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}${path.extname(origName) || ext}`;
            const diskPath = path.join(UPLOADS_DIR, safeFilename);

            // Download media via Baileys
            const buffer = (await downloadMediaMessage(
              msg,
              "buffer",
              {},
              {
                logger: pino({ level: "silent" }) as any,
                reuploadRequest: sock.updateMediaMessage,
              }
            )) as Buffer;

            if (buffer && Buffer.isBuffer(buffer)) {
              fs.writeFileSync(diskPath, buffer);
              const sizeStr =
                buffer.length > 1024 * 1024
                  ? `${(buffer.length / (1024 * 1024)).toFixed(1)} MB`
                  : `${(buffer.length / 1024).toFixed(1)} KB`;

              attachment = {
                fileName: origName,
                fileSize: sizeStr,
                mimeType: mime,
                url: `/api/whatsapp/media/${safeFilename}`,
              };

              if (!text || !text.trim()) {
                text = isImage ? "📷 Foto" : `📄 ${origName}`;
              }
            }
          } catch (dlErr) {
            console.warn("[WA_MEDIA] Gagal mengunduh media pesan masuk:", dlErr);
            if (!text || !text.trim()) {
              text = "📎 Lampiran Media";
            }
          }
        }

        if ((text && text.trim()) || attachment) {
          console.log(
            `[WA_INCOMING] Pesan diterima dari +${phone} (JID: ${rawJid}): "${(text || "").trim().slice(0, 50)}"` +
              (attachment ? ` [Attachment: ${attachment.fileName}]` : "")
          );
          await handleIncomingWhatsAppMessage(phone, (text || "").trim(), rawJid, attachment);

          // Latar belakang: ambil foto profil dan bio asli dari WhatsApp jika belum ada
          fetchContactWhatsAppProfile(rawJid)
            .then(({ avatarUrl, bio }) => {
              if (avatarUrl || bio) {
                const thread = conversationsData.find(
                  (c) =>
                    c.whatsappNumber.replace(/\D/g, "") === phone.replace(/\D/g, "") ||
                    c.remoteJid === rawJid
                );
                if (thread) {
                  if (avatarUrl) thread.avatarUrl = avatarUrl;
                  if (bio) thread.bio = bio;
                  persistConversations();
                }
              }
            })
            .catch(() => {});
        }
      }
    });

    // Dengarkan status centang pesan dari WhatsApp (SERVER_ACK, DELIVERY_ACK, READ)
    sock.ev.on("messages.update", async (updates) => {
      for (const { key, update } of updates) {
        if (key.id && update.status !== undefined) {
          // 2: SERVER_ACK (SENT - Centang 1 abu-abu)
          // 3: DELIVERY_ACK (DELIVERED - Centang 2 abu-abu)
          // 4: READ (READ - Centang 2 biru)
          // 5: PLAYED (READ - Centang 2 biru)
          let newStatus: MessageStatus | null = null;
          if (update.status === 2) newStatus = "SENT";
          else if (update.status === 3) newStatus = "DELIVERED";
          else if (update.status === 4 || update.status === 5) newStatus = "READ";

          if (newStatus) {
            console.log(`[WA_STATUS] Status pesan ${key.id} terupdate ke ${newStatus}`);
            updateMessageStatus(key.id, newStatus);
          }
        }
      }
    });

    // Dengarkan read receipt resmi dari WhatsApp penerima
    sock.ev.on("message-receipt.update", async (receipts) => {
      for (const { key, receipt } of receipts) {
        if (key.id) {
          if (receipt.readTimestamp) {
            console.log(`[WA_STATUS] Pesan ${key.id} telah dibaca oleh penerima (READ - Centang Biru)`);
            updateMessageStatus(key.id, "READ");
          } else if (receipt.receiptTimestamp) {
            console.log(`[WA_STATUS] Pesan ${key.id} sampai di HP penerima (DELIVERED - Centang 2 Abu)`);
            updateMessageStatus(key.id, "DELIVERED");
          }
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
  if ((!input.text || !input.text.trim()) && !input.attachment) {
    return { success: false, error: "Pesan atau file lampiran tidak boleh kosong." };
  }

  const { formatted: waFormatted, isValid } = normalizeWhatsAppNumber(
    input.whatsappNumber
  );

  if (!isValid) {
    return { success: false, error: "Nomor WhatsApp tujuan tidak valid." };
  }

  // 1. Simpan lampiran (jika ada) ke penyimpanan lokal server
  let attachmentObj: ChatAttachment | undefined = undefined;
  let attachmentBuffer: Buffer | undefined = undefined;

  if (input.attachment && input.attachment.base64Data) {
    try {
      ensureUploadsDir();
      const base64Clean = input.attachment.base64Data.replace(/^data:.*?;base64,/, "");
      attachmentBuffer = Buffer.from(base64Clean, "base64");
      const ext =
        path.extname(input.attachment.fileName) ||
        (input.attachment.mimeType.startsWith("image/") ? ".jpg" : ".bin");
      const safeFilename = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}${ext}`;
      const filePath = path.join(UPLOADS_DIR, safeFilename);
      fs.writeFileSync(filePath, attachmentBuffer);

      attachmentObj = {
        fileName: input.attachment.fileName,
        fileSize:
          input.attachment.fileSize ||
          (attachmentBuffer.length > 1024 * 1024
            ? `${(attachmentBuffer.length / (1024 * 1024)).toFixed(1)} MB`
            : `${(attachmentBuffer.length / 1024).toFixed(1)} KB`),
        mimeType: input.attachment.mimeType,
        url: `/api/whatsapp/media/${safeFilename}`,
      };
    } catch (saveErr) {
      console.error("[WA_SEND] Gagal menyimpan lampiran pengiriman:", saveErr);
    }
  }

  // 2. Cari atau buat thread percakapan di Inbox
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

  // 3. Tambahkan pesan keluar ke thread Inbox Fynux
  const appendRes = await appendOutgoingMessage(
    matchedThread.id,
    input.text.trim(),
    "SALES",
    input.actorUserId,
    input.actorUserName,
    attachmentObj
  );

  // 4. Jika socket Baileys aktif terhubung ke WhatsApp asli, kirim secara nyata!
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

      let sent: any;
      if (attachmentObj && attachmentBuffer) {
        if (attachmentObj.mimeType.startsWith("image/")) {
          console.log(`[WA_SEND] Mengirim gambar (${attachmentObj.fileName}) ke "${targetJid}"`);
          sent = await waGlobal.waSocket.sendMessage(targetJid, {
            image: attachmentBuffer,
            caption: input.text.trim() || undefined,
            mimetype: attachmentObj.mimeType,
          });
        } else {
          console.log(`[WA_SEND] Mengirim dokumen (${attachmentObj.fileName}) ke "${targetJid}"`);
          sent = await waGlobal.waSocket.sendMessage(targetJid, {
            document: attachmentBuffer,
            mimetype: attachmentObj.mimeType,
            fileName: attachmentObj.fileName,
            caption: input.text.trim() || undefined,
          });
        }
      } else {
        console.log(`[WA_SEND] Mengirim pesan teks ke JID "${targetJid}": "${input.text.trim().slice(0, 50)}"`);
        sent = await waGlobal.waSocket.sendMessage(targetJid, { text: input.text.trim() });
      }

      if (sent?.key?.id) {
        if (sent?.message) {
          sentMessagesCache.set(sent.key.id, sent.message);
        }
        if (appendRes.message) {
          updateMessageExternalId(appendRes.message.id, sent.key.id);
        }
      }
      console.log(`[WA_SEND] Pesan berhasil meluncur ke "${targetJid}"! (ID: ${sent?.key?.id || "N/A"})`);
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
  rawJid?: string,
  attachment?: ChatAttachment
): Promise<{ success: boolean; conversationId?: string; prospectId?: string }> {
  if (!text?.trim() && !attachment) return { success: false };

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
  await appendIncomingMessage(matchedThread.id, text.trim(), attachment);

  // 3. Logika CRM Otomatis: Pindahkan ke RESPONDED dan hentikan spam follow-up
  if (matchedProspect) {
    const replySnippet = text.trim() || (attachment ? `📎 ${attachment.fileName}` : "Balasan masuk");
    await recordClientReply(matchedProspect.id, replySnippet, "SYSTEM_WHATSAPP");
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

/**
 * Tandai percakapan sebagai telah dibaca dan kirim read receipt ke WhatsApp jika socket aktif
 */
export async function markConversationMessagesAsRead(
  conversationId: string
): Promise<{ success: boolean }> {
  const conv = conversationsData.find((c) => c.id === conversationId);
  if (!conv) return { success: false };

  markConversationAsRead(conversationId);

  // Jika socket Baileys aktif dan remoteJid tersedia, kirim tanda centang biru ke nomor lawan
  if (waGlobal.waSocket && waGlobal.waSession?.status === "CONNECTED" && conv.remoteJid) {
    try {
      const incomingUnread = conv.messages.filter((m) => m.sender === "PROSPECT");
      const keys = incomingUnread.map((m) => ({
        remoteJid: conv.remoteJid!,
        id: m.externalMessageId || m.id,
        fromMe: false,
      }));
      if (keys.length > 0) {
        await waGlobal.waSocket.readMessages(keys);
      }
    } catch (readErr) {
      console.warn("[WA_READ] Gagal mengirim status read ke Baileys:", readErr);
    }
  }

  return { success: true };
}

/**
 * Simulasikan penerima membuka dan membaca pesan (Centang 2 Biru / READ)
 */
export async function simulateRecipientReadMessages(
  conversationId: string
): Promise<{ success: boolean; updatedCount: number }> {
  const conv = conversationsData.find((c) => c.id === conversationId);
  if (!conv) return { success: false, updatedCount: 0 };

  let count = 0;
  for (const m of conv.messages) {
    if ((m.sender === "SALES" || m.sender === "AI") && m.status !== "READ") {
      m.status = "READ";
      m.statusUpdatedAt = new Date().toISOString();
      count++;
    }
  }

  if (count > 0) {
    persistConversations();
  }

  return { success: true, updatedCount: count };
}

/**
 * Mengambil foto profil asli dan bio/status dari WhatsApp untuk nomor atau JID tertentu.
 * Mengunduh foto secara lokal ke data/uploads/whatsapp agar tidak kadaluarsa.
 */
export async function fetchContactWhatsAppProfile(
  phoneOrJid: string
): Promise<{ avatarUrl?: string; bio?: string }> {
  const sock = waGlobal.waSocket;
  if (!sock) {
    return {};
  }

  const cleanPhone = phoneOrJid.replace("@s.whatsapp.net", "").replace("@lid", "").replace(/\D/g, "");
  // Prioritaskan JID jika sudah berformat @s.whatsapp.net atau @lid
  const jid = phoneOrJid.includes("@") ? phoneOrJid : `${cleanPhone}@s.whatsapp.net`;

  let avatarUrl: string | undefined;
  let bio: string | undefined;

  // 1. Ambil Foto Profil dari WhatsApp
  try {
    const rawPicUrl = await sock.profilePictureUrl(jid, "image");
    if (rawPicUrl) {
      try {
        ensureUploadsDir();
        const res = await fetch(rawPicUrl);
        if (res.ok) {
          const buffer = Buffer.from(await res.arrayBuffer());
          const filename = `avatar-${cleanPhone}.jpg`;
          const filePath = path.join(UPLOADS_DIR, filename);
          fs.writeFileSync(filePath, buffer);
          avatarUrl = `/api/whatsapp/media/${filename}?t=${Date.now()}`;
        } else {
          avatarUrl = rawPicUrl;
        }
      } catch {
        avatarUrl = rawPicUrl;
      }
    }
  } catch (err) {
    // 404 / privasi terbatas / tidak ada foto profil
  }

  // 2. Ambil Bio / Status Pribadi
  try {
    const statusRes = await sock.fetchStatus(jid);
    if (statusRes && statusRes.length > 0) {
      const first = statusRes[0];
      if (typeof first.status === "string" && first.status.trim()) {
        bio = first.status.trim();
      } else if (typeof (first.status as any)?.status === "string") {
        bio = (first.status as any).status.trim();
      }
    }
  } catch (err) {
    // Tidak ada status / privasi terbatas
  }

  // 3. Jika bio kosong, cek apakah akun WhatsApp Business (description)
  if (!bio) {
    try {
      const bizProfile = await sock.getBusinessProfile(jid);
      if (bizProfile && bizProfile.description && bizProfile.description.trim()) {
        bio = bizProfile.description.trim();
      }
    } catch (err) {
      // Bukan akun bisnis atau tidak ada deskripsi
    }
  }

  return { avatarUrl, bio };
}

/**
 * Sinkronkan profil kontak WhatsApp (Avatar dan Bio) ke Percakapan Inbox dan Prospek CRM
 */
export async function syncConversationWhatsAppProfile(
  conversationId: string
): Promise<{ success: boolean; avatarUrl?: string; bio?: string }> {
  const conv = conversationsData.find((c) => c.id === conversationId);
  if (!conv) {
    return { success: false };
  }

  const targetJid = conv.remoteJid || `${conv.whatsappNumber.replace(/\D/g, "")}@s.whatsapp.net`;
  const { avatarUrl, bio } = await fetchContactWhatsAppProfile(targetJid);

  let updated = false;
  if (avatarUrl && conv.avatarUrl !== avatarUrl) {
    conv.avatarUrl = avatarUrl;
    updated = true;
  }
  if (bio && conv.bio !== bio) {
    conv.bio = bio;
    updated = true;
  }

  // Sinkronkan ke data Prospek CRM jika ada
  const cleanPhone = conv.whatsappNumber.replace(/\D/g, "");
  const prospect = prospectsData.find(
    (p) =>
      (conv.prospectId && p.id === conv.prospectId) ||
      p.whatsappNumber.replace(/\D/g, "") === cleanPhone
  );
  if (prospect) {
    if (avatarUrl) prospect.avatarUrl = avatarUrl;
    if (bio) prospect.bio = bio;
  }

  if (updated) {
    persistConversations();
  }

  return { success: true, avatarUrl: conv.avatarUrl, bio: conv.bio };
}
