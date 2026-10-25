import { ChatMessage, ConversationThread } from "./types";
import { logActivity } from "@/lib/logger";

const INITIAL_CONVERSATIONS_DATA: ConversationThread[] = [
  {
    id: "conv-002",
    prospectId: "p-002",
    companyName: "PT Padma Widya Setiajaya",
    contactName: "Ibu Rina Wulandari (Direktur)",
    whatsappNumber: "6281298765432",
    unreadCount: 1,
    lastMessageSnippet: "Apakah bisa dapat potongan harga jika kami ambil kontrak maintenance tahunan sekalian?",
    lastMessageAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    researchNotes:
      "Perusahaan kontraktor regional. Membutuhkan company profile profesional untuk portofolio tender B2B pemerintah & swasta.",
    messages: [
      {
        id: "msg-001",
        conversationId: "conv-002",
        sender: "SALES",
        text: "Selamat siang Ibu Rina, perkenalkan saya Budi dari Fynux Digital Solutions. Kami melihat PT Padma Widya Setiajaya memiliki rekam jejak konstruksi yang luar biasa, namun website resmi perusahaan sepertinya belum aktif. Apakah saat ini ada rencana publikasi portofolio online untuk tender?",
        isDraft: false,
        timestamp: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
      },
      {
        id: "msg-002",
        conversationId: "conv-002",
        sender: "PROSPECT",
        text: "Siang Mas Budi. Iya betul sekali, kami memang sedang disyaratkan melampirkan link website company profile untuk tender LPSE bulan depan. Paket apa saja yang tersedia di Fynux?",
        isDraft: false,
        timestamp: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      },
      {
        id: "msg-003",
        conversationId: "conv-002",
        sender: "SALES",
        text: "Untuk kebutuhan tender, kami merekomendasikan Business Website seharga Rp 3.500.000 dengan CMS kustom agar tim Ibu bisa memperbarui galeri proyek kapan saja, lengkap dengan domain, hosting, dan SSL.",
        isDraft: false,
        timestamp: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
      },
      {
        id: "msg-004",
        conversationId: "conv-002",
        sender: "PROSPECT",
        text: "Apakah bisa dapat potongan harga menjadi sekitar 3.15 juta jika kami langsung ambil kontrak maintenance tahunan sekalian?",
        isDraft: false,
        timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
      },
    ],
  },
  {
    id: "conv-003",
    prospectId: "p-003",
    companyName: "Kopi Nusantara Roastery",
    contactName: "Aditya Pratama (Founder)",
    whatsappNumber: "6285712345678",
    unreadCount: 0,
    lastMessageSnippet: "Reach now via WhatsApp Web terkirim.",
    lastMessageAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    researchNotes:
      "Roastery kopi berkembang pesat di IG. Admin kewalahan membalas chat pesanan biji kopi kiloan. Butuh website katalog beans + direct WA order.",
    messages: [
      {
        id: "msg-010",
        conversationId: "conv-003",
        sender: "SALES",
        text: "Halo Mas Aditya, salam kenal dari Fynux Digital Solutions. Kami sempat memantau roastery Kopi Nusantara yang ramai sekali pemesanannya di Instagram. Apakah Mas Adit tertarik membuat website katalog beans otomatis agar pelanggan grosir bisa langsung order rapi?",
        isDraft: false,
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
    ],
  },
  {
    id: "conv-001",
    prospectId: "p-001",
    companyName: "SMAN 2 Ngaglik",
    contactName: "Bambang Sudarsono (Wakasek Kurikulum)",
    whatsappNumber: "62895324069850",
    unreadCount: 0,
    lastMessageSnippet: "Invoice pelunasan presensi digital telah terbit.",
    lastMessageAt: "2026-02-12T10:00:00Z",
    researchNotes: "Sekolah negeri 900+ siswa. Membutuhkan sistem web presensi digital multi-device.",
    messages: [
      {
        id: "msg-020",
        conversationId: "conv-001",
        sender: "SALES",
        text: "Selamat pagi Pak Bambang, berikut kami lampirkan nota pelunasan dan invoice proyek SIM-Presensi berbasis web v1.0.",
        isDraft: false,
        timestamp: "2026-02-12T09:30:00Z",
      },
      {
        id: "msg-021",
        conversationId: "conv-001",
        sender: "PROSPECT",
        text: "Terima kasih banyak Mas Faiz dan tim Fynux, sistem presensi sudah kami uji dan berjalan lancar di kiosk lobi sekolah.",
        isDraft: false,
        timestamp: "2026-02-12T10:00:00Z",
      },
    ],
  },
];

interface InboxGlobalStore {
  conversationsData?: ConversationThread[];
}

const inboxGlobal = globalThis as unknown as InboxGlobalStore;
if (!inboxGlobal.conversationsData || inboxGlobal.conversationsData.length === 0) {
  inboxGlobal.conversationsData = [...INITIAL_CONVERSATIONS_DATA];
}

export const conversationsData = inboxGlobal.conversationsData;

export async function getAllConversations(): Promise<ConversationThread[]> {
  return [...conversationsData];
}

export async function getConversationById(id: string): Promise<ConversationThread | null> {
  const conv = conversationsData.find((c) => c.id === id);
  return conv ? { ...conv } : null;
}

export async function getConversationByPhone(phone: string): Promise<ConversationThread | null> {
  const cleanPhone = phone.replace(/\D/g, "");
  const conv = conversationsData.find(
    (c) => c.whatsappNumber.replace(/\D/g, "") === cleanPhone
  );
  return conv ? { ...conv } : null;
}

export async function getOrCreateConversationByProspect(prospect: {
  id: string;
  companyName: string;
  contactName: string;
  whatsappNumber: string;
  researchNotes?: string;
  remoteJid?: string;
}): Promise<ConversationThread> {
  const existing = await getConversationByPhone(prospect.whatsappNumber);
  if (existing) {
    if (prospect.remoteJid && !existing.remoteJid) {
      existing.remoteJid = prospect.remoteJid;
    }
    return existing;
  }

  const newThread: ConversationThread = {
    id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    prospectId: prospect.id,
    companyName: prospect.companyName,
    contactName: prospect.contactName,
    whatsappNumber: prospect.whatsappNumber,
    remoteJid: prospect.remoteJid,
    unreadCount: 0,
    lastMessageSnippet: "Percakapan baru dimulai",
    lastMessageAt: new Date().toISOString(),
    researchNotes: prospect.researchNotes || "Belum ada catatan riset",
    messages: [],
  };

  conversationsData.unshift(newThread);
  return newThread;
}

export async function appendIncomingMessage(
  conversationId: string,
  text: string
): Promise<{ success: boolean; message?: ChatMessage }> {
  const idx = conversationsData.findIndex((c) => c.id === conversationId);
  if (idx === -1) return { success: false };

  const newMsg: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    conversationId,
    sender: "PROSPECT",
    text,
    isDraft: false,
    timestamp: new Date().toISOString(),
  };

  conversationsData[idx].messages.push(newMsg);
  conversationsData[idx].lastMessageSnippet = text.slice(0, 80);
  conversationsData[idx].lastMessageAt = newMsg.timestamp;
  conversationsData[idx].unreadCount += 1;

  logActivity({
    category: "CRM",
    action: "INCOMING_CHAT_RECORDED",
    actorId: "SYSTEM_INBOX",
    targetId: conversationId,
    metadata: { snippet: text.slice(0, 100) },
  });

  return { success: true, message: newMsg };
}

export async function appendOutgoingMessage(
  conversationId: string,
  text: string,
  sender: "SALES" | "AI" = "SALES"
): Promise<{ success: boolean; message?: ChatMessage }> {
  const idx = conversationsData.findIndex((c) => c.id === conversationId);
  if (idx === -1) return { success: false };

  const newMsg: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    conversationId,
    sender,
    text,
    isDraft: false,
    timestamp: new Date().toISOString(),
  };

  conversationsData[idx].messages.push(newMsg);
  conversationsData[idx].lastMessageSnippet = text.slice(0, 80);
  conversationsData[idx].lastMessageAt = newMsg.timestamp;

  logActivity({
    category: "CRM",
    action: "OUTGOING_CHAT_SENT",
    actorId: "SALES_OPERATOR",
    targetId: conversationId,
    metadata: { snippet: text.slice(0, 100) },
  });

  return { success: true, message: newMsg };
}

export async function appendDraftReply(
  conversationId: string,
  draftText: string
): Promise<{ success: boolean; message?: ChatMessage }> {
  const idx = conversationsData.findIndex((c) => c.id === conversationId);
  if (idx === -1) return { success: false };

  const newMsg: ChatMessage = {
    id: `msg-${Date.now()}`,
    conversationId,
    sender: "AI",
    text: draftText,
    isDraft: true,
    timestamp: new Date().toISOString(),
  };

  conversationsData[idx].messages.push(newMsg);
  return { success: true, message: newMsg };
}
