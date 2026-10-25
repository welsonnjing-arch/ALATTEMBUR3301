import { CreateProspectInput, FollowUpLogItem, normalizeWhatsAppNumber, Prospect } from "./types";
import { FailedReason, NextAction, PipelineStage } from "@/types/enums";
import { calculateNextFollowUp } from "../follow-up/follow-up.service";
import { logActivity } from "@/lib/logger";

// In-Memory Database Store (Dipertahankan di memory server Next.js untuk operasional cepat)
let prospectsData: Prospect[] = [
  {
    id: "p-001",
    companyName: "SMAN 2 Ngaglik",
    contactName: "Bambang Sudarsono (Wakasek Kurikulum)",
    whatsappNumber: "62895324069850",
    email: "info@sman2ngaglik.sch.id",
    website: "sman2ngaglik.sch.id",
    industry: "Pendidikan & Sekolah",
    location: "Sleman, D.I. Yogyakarta",
    source: "Riset Direktori Sekolah",
    researchNotes:
      "Sekolah negeri dengan 900+ siswa. Presensi harian masih mengandalkan kertas dan fingerprint fisik yang sering antre. Membutuhkan sistem web presensi digital multi-device + kiosk mode dengan rekapitulasi excel otomatis.",
    painPoints: "Antrean absensi pagi hari dan rekap data manual butuh 3 hari tiap akhir bulan.",
    potentialServices: "Web App Development - Presensi Digital Basic",
    assignedSalesId: "22222222-2222-2222-2222-222222222222",
    assignedSalesName: "Budi Santoso (Sales)",
    stage: "CLOSED_WON",
    nextAction: "NO_ACTION_REQUIRED",
    followUpStep: "INITIAL",
    lastReachAt: "2026-02-11T09:00:00Z",
    isArchived: false,
    followUpLogs: [
      {
        id: "fu-001",
        prospectId: "p-001",
        step: "INITIAL",
        channel: "WHATSAPP",
        sentByUserId: "22222222-2222-2222-2222-222222222222",
        sentByUserName: "Budi Santoso",
        confirmedSentAt: "2026-02-11T09:00:00Z",
        notes: "Initial outreach proposal SIM-Presensi.",
      },
    ],
    createdAt: "2026-02-10T08:00:00Z",
    updatedAt: "2026-02-12T10:00:00Z",
  },
  {
    id: "p-002",
    companyName: "PT Padma Widya Setiajaya",
    contactName: "Ibu Rina Wulandari (Direktur)",
    whatsappNumber: "6281298765432",
    email: "contact@padmawidyasetiajaya.com",
    website: "padmawidyasetiajaya.com",
    industry: "Kontraktor & Konstruksi",
    location: "Semarang, Jawa Tengah",
    source: "Riset LPSE & Rekanan B2B",
    researchNotes:
      "Perusahaan kontraktor sipil dan pengadaan. Sudah memiliki domain .com tetapi belum ada website aktif. Sangat membutuhkan website profil perusahaan kredibel untuk keperluan tender proyek pemerintah & swasta.",
    painPoints: "Tender mensyaratkan company profile online terverifikasi.",
    potentialServices: "Basic Website Development + Hosting Tahunan",
    assignedSalesId: "22222222-2222-2222-2222-222222222222",
    assignedSalesName: "Budi Santoso (Sales)",
    stage: "NEGOTIATION",
    nextAction: "PREPARE_PROPOSAL",
    nextFollowUpDate: new Date().toISOString().split("T")[0],
    followUpStep: "FU2",
    lastReachAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    isArchived: false,
    followUpLogs: [
      {
        id: "fu-002-1",
        prospectId: "p-002",
        step: "INITIAL",
        channel: "WHATSAPP",
        sentByUserId: "22222222-2222-2222-2222-222222222222",
        sentByUserName: "Budi Santoso",
        confirmedSentAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        notes: "Perkenalan Fynux & audit status website mereka.",
      },
      {
        id: "fu-002-2",
        prospectId: "p-002",
        step: "FU1",
        channel: "WHATSAPP",
        sentByUserId: "22222222-2222-2222-2222-222222222222",
        sentByUserName: "Budi Santoso",
        confirmedSentAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        notes: "Kirim ringkasan portofolio kontraktor.",
      },
    ],
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "p-003",
    companyName: "Kopi Nusantara Roastery",
    contactName: "Aditya Pratama (Founder)",
    whatsappNumber: "6285712345678",
    email: "aditya@kopinusantara.id",
    industry: "F&B / Coffee Roastery",
    location: "Yogyakarta",
    source: "Instagram Business Audit",
    researchNotes:
      "Roastery kopi spesialti dengan 15k followers di IG. Transaksi grosir ke kafe-kafe masih via chat manual yang sering tercecer. Berpotensi butuh Business Website dengan katalog beans dan form pemesanan grosir B2B.",
    painPoints: "Admin kewalahan membalas chat pesanan biji kopi kiloan.",
    potentialServices: "Business Website Development",
    assignedSalesId: "22222222-2222-2222-2222-222222222222",
    assignedSalesName: "Budi Santoso (Sales)",
    stage: "CONTACTED",
    nextAction: "WAITING_FOR_RESPONSE",
    nextFollowUpDate: new Date().toISOString().split("T")[0],
    followUpStep: "INITIAL",
    lastReachAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    isArchived: false,
    followUpLogs: [
      {
        id: "fu-003-1",
        prospectId: "p-003",
        step: "INITIAL",
        channel: "WHATSAPP",
        sentByUserId: "22222222-2222-2222-2222-222222222222",
        sentByUserName: "Budi Santoso",
        confirmedSentAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        notes: "Reach now via WhatsApp Web.",
      },
    ],
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

export async function getAllProspects(filter?: {
  stage?: PipelineStage | "ALL";
  assignedSalesId?: string;
  search?: string;
}): Promise<Prospect[]> {
  let list = [...prospectsData];

  if (filter?.stage && filter.stage !== "ALL") {
    list = list.filter((p) => p.stage === filter.stage);
  }

  if (filter?.assignedSalesId) {
    list = list.filter((p) => p.assignedSalesId === filter.assignedSalesId);
  }

  if (filter?.search) {
    const q = filter.search.toLowerCase();
    list = list.filter(
      (p) =>
        p.companyName.toLowerCase().includes(q) ||
        p.contactName.toLowerCase().includes(q) ||
        p.whatsappNumber.includes(q) ||
        p.researchNotes.toLowerCase().includes(q)
    );
  }

  return list;
}

export async function getProspectById(id: string): Promise<Prospect | null> {
  const p = prospectsData.find((item) => item.id === id);
  return p ? { ...p } : null;
}

export async function checkDuplicateWhatsApp(
  rawPhone: string
): Promise<{ isDuplicate: boolean; matchedProspect?: Prospect }> {
  const { formatted, isValid } = normalizeWhatsAppNumber(rawPhone);
  if (!isValid) return { isDuplicate: false };

  const matched = prospectsData.find(
    (p) => p.whatsappNumber === formatted && !p.isArchived
  );

  return {
    isDuplicate: !!matched,
    matchedProspect: matched ? { ...matched } : undefined,
  };
}

export async function createProspect(
  input: CreateProspectInput,
  actorUserId: string,
  actorRole: string
): Promise<{ success: boolean; prospect?: Prospect; error?: string }> {
  const { formatted: waFormatted, isValid } = normalizeWhatsAppNumber(
    input.whatsappNumber
  );

  if (!isValid) {
    return {
      success: false,
      error: "Nomor WhatsApp tidak valid. Format harus diawali 628 atau 08 (10-15 digit).",
    };
  }

  if (!input.companyName.trim()) {
    return { success: false, error: "Nama perusahaan/bisnis wajib diisi." };
  }

  if (!input.researchNotes.trim()) {
    return { success: false, error: "Catatan hasil riset bisnis wajib diisi." };
  }

  const newProspect: Prospect = {
    id: `p-${Date.now()}`,
    companyName: input.companyName.trim(),
    contactName: input.contactName.trim() || input.companyName.trim(),
    whatsappNumber: waFormatted,
    email: input.email?.trim() || undefined,
    website: input.website?.trim() || undefined,
    industry: input.industry?.trim() || undefined,
    location: input.location?.trim() || undefined,
    source: input.source?.trim() || "Riset Internal Fynux",
    researchNotes: input.researchNotes.trim(),
    painPoints: input.painPoints?.trim() || undefined,
    potentialServices: input.potentialServices?.trim() || undefined,
    assignedSalesId:
      actorRole === "SALES"
        ? actorUserId
        : input.assignedSalesId || actorUserId,
    assignedSalesName:
      actorRole === "SALES" ? "Budi Santoso (Sales)" : "Faiz Aditama (Owner)",
    stage: "NEW",
    nextAction: "REACH_NOW",
    followUpStep: "INITIAL",
    isArchived: false,
    followUpLogs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  prospectsData.unshift(newProspect);

  logActivity({
    category: "CRM",
    action: "PROSPECT_CREATED",
    actorId: actorUserId,
    targetId: newProspect.id,
    targetType: "PROSPECT",
    metadata: {
      companyName: newProspect.companyName,
      whatsapp: newProspect.whatsappNumber,
    },
  });

  return { success: true, prospect: newProspect };
}

export async function updateProspectStage(
  prospectId: string,
  stage: PipelineStage,
  nextAction: NextAction,
  actorUserId: string,
  failedReason?: FailedReason
): Promise<{ success: boolean; error?: string }> {
  const idx = prospectsData.findIndex((p) => p.id === prospectId);
  if (idx === -1) return { success: false, error: "Prospek tidak ditemukan." };

  prospectsData[idx].stage = stage;
  prospectsData[idx].nextAction = nextAction;
  prospectsData[idx].updatedAt = new Date().toISOString();

  if (stage === "FAILED" && failedReason) {
    prospectsData[idx].failedReason = failedReason;
  }

  logActivity({
    category: "CRM",
    action: "PROSPECT_STAGE_UPDATED",
    actorId: actorUserId,
    targetId: prospectId,
    metadata: { stage, nextAction, failedReason },
  });

  return { success: true };
}

/**
 * Konfirmasi pengiriman pesan outreach (Mark as Sent)
 * Memicu penjadwalan follow-up kalender berikutnya secara otomatis.
 */
export async function confirmOutreachSent(
  prospectId: string,
  actorUserId: string,
  actorUserName: string,
  notes?: string
): Promise<{ success: boolean; nextStep?: string; nextDueDate?: string }> {
  const idx = prospectsData.findIndex((p) => p.id === prospectId);
  if (idx === -1) return { success: false };

  const p = prospectsData[idx];
  const currentStep = p.followUpStep || "INITIAL";

  const { nextStep, nextDueDate } = calculateNextFollowUp(
    currentStep === "FAILED" ? "INITIAL" : currentStep,
    new Date()
  );

  const logItem: FollowUpLogItem = {
    id: `fu-${Date.now()}`,
    prospectId,
    step: currentStep,
    channel: "WHATSAPP",
    sentByUserId: actorUserId,
    sentByUserName: actorUserName,
    confirmedSentAt: new Date().toISOString(),
    notes: notes || `Outreach ${currentStep} terkonfirmasi dikirim via WhatsApp Web.`,
  };

  if (!p.followUpLogs) p.followUpLogs = [];
  p.followUpLogs.push(logItem);

  p.lastReachAt = logItem.confirmedSentAt;
  p.followUpStep = nextStep;
  p.nextFollowUpDate = nextDueDate;
  p.stage = currentStep === "INITIAL" ? "CONTACTED" : p.stage;
  p.nextAction = "WAITING_FOR_RESPONSE";
  p.updatedAt = new Date().toISOString();

  logActivity({
    category: "CRM",
    action: "OUTREACH_CONFIRMED_SENT",
    actorId: actorUserId,
    targetId: prospectId,
    metadata: { stepSent: currentStep, nextStep, nextDueDate },
  });

  return { success: true, nextStep, nextDueDate };
}

/**
 * Mencatat respons balasan prospek:
 * Menghalangi/menghentikan siklus follow-up no-response.
 */
export async function recordClientReply(
  prospectId: string,
  replyText: string,
  actorUserId: string
): Promise<{ success: boolean }> {
  const idx = prospectsData.findIndex((p) => p.id === prospectId);
  if (idx === -1) return { success: false };

  const p = prospectsData[idx];
  p.stage = "RESPONDED";
  p.nextAction = "REPLY_TO_CLIENT";
  p.nextFollowUpDate = undefined; // Hentikan siklus no-response
  p.updatedAt = new Date().toISOString();

  logActivity({
    category: "CRM",
    action: "CLIENT_REPLY_RECORDED",
    actorId: actorUserId,
    targetId: prospectId,
    metadata: { replySnippet: replyText.slice(0, 100) },
  });

  return { success: true };
}

/**
 * Reaktivasi prospek yang sebelumnya berstatus FAILED
 */
export async function reactivateProspect(
  prospectId: string,
  actorUserId: string,
  notes?: string
): Promise<{ success: boolean }> {
  const idx = prospectsData.findIndex((p) => p.id === prospectId);
  if (idx === -1) return { success: false };

  const p = prospectsData[idx];
  p.stage = "NEW";
  p.nextAction = "REACH_NOW";
  p.followUpStep = "INITIAL";
  p.failedReason = undefined;
  p.nextFollowUpDate = undefined;
  p.updatedAt = new Date().toISOString();

  logActivity({
    category: "CRM",
    action: "PROSPECT_REACTIVATED",
    actorId: actorUserId,
    targetId: prospectId,
    metadata: { notes: notes || "Prospek diaktifkan kembali dari status Failed" },
  });

  return { success: true };
}
