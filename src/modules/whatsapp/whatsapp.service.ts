import QRCode from "qrcode";
import {
  WhatsAppConnectionStatus,
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
}

const waGlobal = globalThis as unknown as WhatsAppGlobalStore;

if (!waGlobal.waSession) {
  // Sesi default inisial (dapat diaktifkan langsung atau melalui scan QR)
  waGlobal.waSession = {
    status: "DISCONNECTED",
    qrCodeDataUrl: null,
    phoneNumber: null,
    pushName: null,
    platform: "Fynux Native Engine (Multi-Device)",
    connectedAt: null,
    lastActiveAt: null,
    error: null,
  };
}

export async function getWhatsAppSession(): Promise<WhatsAppSessionInfo> {
  return { ...waGlobal.waSession! };
}

/**
 * Memulai proses pairing (menghasilkan QR Code dinamis untuk scan WhatsApp Web)
 */
export async function startWhatsAppPairing(): Promise<WhatsAppSessionInfo> {
  const pairingPayload = `2@fynux_os_wa_${Date.now()}_${Math.random().toString(36).substring(2, 10)},s4t91P,${Date.now()}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(pairingPayload, {
      width: 280,
      margin: 2,
      color: {
        dark: "#128C7E", // WhatsApp Teal
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    });

    waGlobal.waSession = {
      status: "SCANNING_QR",
      qrCodeDataUrl: qrDataUrl,
      phoneNumber: null,
      pushName: null,
      platform: "Fynux Native Engine (Multi-Device)",
      connectedAt: null,
      lastActiveAt: new Date().toISOString(),
      error: null,
    };

    logActivity({
      category: "CRM",
      action: "WHATSAPP_PAIRING_INITIATED",
      actorId: "SYSTEM_WHATSAPP",
      targetId: "session-active",
      metadata: { status: "SCANNING_QR" },
    });

    return { ...waGlobal.waSession };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal membuat QR Code";
    waGlobal.waSession!.status = "ERROR";
    waGlobal.waSession!.error = errorMsg;
    return { ...waGlobal.waSession! };
  }
}

/**
 * Mengonfirmasi pairing (saat QR di-scan oleh aplikasi WhatsApp ponsel)
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

  // Cari prospek yang sesuai di database CRM
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

  // 2. Tambahkan pesan keluar ke thread
  const appendRes = await appendOutgoingMessage(
    matchedThread.id,
    input.text.trim(),
    "SALES"
  );

  // 3. Update logika status CRM secara otomatis
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
      // Jika sudah contacted, perbarui timestamp terakhir outreach
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
 * Menangani pesan masuk dari klien / prospek (melalui Webhook atau Simulasi)
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
