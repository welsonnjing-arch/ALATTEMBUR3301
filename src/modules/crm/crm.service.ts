import fs from "node:fs";
import path from "node:path";
import { CreateProspectInput, FollowUpLogItem, normalizeWhatsAppNumber, Prospect } from "./types";
import { FailedReason, NextAction, PipelineStage } from "@/types/enums";
import { calculateNextFollowUp } from "../follow-up/follow-up.service";
import { logActivity } from "@/lib/logger";

// In-Memory Database Store dengan globalThis agar konsisten di Server Action, Server Component, & HMR
const INITIAL_PROSPECTS_DATA: Prospect[] = [
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

interface CRMGlobalStore {
  prospectsData?: Prospect[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const PROSPECTS_FILE = path.join(DATA_DIR, "crm-prospects.json");

function ensureStorageDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadPersistedProspects(): Prospect[] {
  ensureStorageDir();
  try {
    if (fs.existsSync(PROSPECTS_FILE)) {
      const content = fs.readFileSync(PROSPECTS_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("[CRM_PERSISTENCE] Gagal membaca crm-prospects.json:", err);
  }

  try {
    fs.writeFileSync(
      PROSPECTS_FILE,
      JSON.stringify(INITIAL_PROSPECTS_DATA, null, 2),
      "utf-8"
    );
  } catch {}

  return [...INITIAL_PROSPECTS_DATA];
}

export function persistProspects(): void {
  ensureStorageDir();
  try {
    if (crmGlobal.prospectsData) {
      fs.writeFileSync(
        PROSPECTS_FILE,
        JSON.stringify(crmGlobal.prospectsData, null, 2),
        "utf-8"
      );
    }
  } catch (err) {
    console.error("[CRM_PERSISTENCE] Gagal menyimpan data prospek ke disk:", err);
  }
}

const crmGlobal = globalThis as unknown as CRMGlobalStore;
if (!crmGlobal.prospectsData || crmGlobal.prospectsData.length === 0) {
  crmGlobal.prospectsData = loadPersistedProspects();
}

export const prospectsData = crmGlobal.prospectsData;

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

  if (!input.companyName || !input.companyName.trim()) {
    return { success: false, error: "Nama perusahaan/bisnis wajib diisi." };
  }

  // Catatan riset bisnis bersifat opsional (sesuai arahan pengguna)
  const safeNotes = input.researchNotes?.trim() || "Belum ada catatan riset";

  const newProspect: Prospect = {
    id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    companyName: input.companyName.trim(),
    contactName: input.contactName?.trim() || input.companyName.trim(),
    whatsappNumber: waFormatted,
    email: input.email?.trim() || undefined,
    website: input.website?.trim() || undefined,
    industry: input.industry?.trim() || undefined,
    location: input.location?.trim() || undefined,
    source: input.source?.trim() || "Riset Internal Fynux",
    researchNotes: safeNotes,
    painPoints: input.painPoints?.trim() || undefined,
    potentialServices: input.potentialServices?.trim() || "Basic Website Development",
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
    tags: input.tags || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const store = crmGlobal.prospectsData || prospectsData;
  store.unshift(newProspect);
  persistProspects();

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

export interface BulkImportResult {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  prospects: Prospect[];
  errors: Array<{ row: number; companyName: string; reason: string }>;
}

export async function bulkCreateProspects(
  inputs: CreateProspectInput[],
  actorUserId: string,
  actorRole: string
): Promise<BulkImportResult> {
  const store = crmGlobal.prospectsData || prospectsData;
  const created: Prospect[] = [];
  const errors: Array<{ row: number; companyName: string; reason: string }> = [];

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const rowNum = i + 1;

    if (!input.companyName || !input.companyName.trim()) {
      errors.push({
        row: rowNum,
        companyName: input.companyName || `Baris ${rowNum}`,
        reason: "Nama bisnis wajib diisi.",
      });
      continue;
    }

    const { formatted: waFormatted, isValid } = normalizeWhatsAppNumber(
      input.whatsappNumber || ""
    );
    if (!isValid) {
      errors.push({
        row: rowNum,
        companyName: input.companyName,
        reason: `Nomor WhatsApp tidak valid: "${input.whatsappNumber || ""}". Format harus diawali 08 atau 628 (10-15 digit).`,
      });
      continue;
    }

    // Periksa duplikasi kontak di database CRM
    const existingInStore = store.find(
      (p) => p.whatsappNumber === waFormatted && !p.isArchived
    );
    const existingInBatch = created.find((p) => p.whatsappNumber === waFormatted);

    if (existingInStore) {
      errors.push({
        row: rowNum,
        companyName: input.companyName,
        reason: `Nomor WhatsApp (${waFormatted}) sudah ada di database CRM atas nama "${existingInStore.companyName}" (Stage: ${existingInStore.stage}).`,
      });
      continue;
    }

    if (existingInBatch) {
      errors.push({
        row: rowNum,
        companyName: input.companyName,
        reason: `Nomor WhatsApp (${waFormatted}) duplikat dengan baris sebelumnya dalam file yang sama.`,
      });
      continue;
    }

    const safeNotes = input.researchNotes?.trim() || "Di-import dari Excel/CSV";

    const newProspect: Prospect = {
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      companyName: input.companyName.trim(),
      contactName: input.contactName?.trim() || input.companyName.trim(),
      whatsappNumber: waFormatted,
      email: input.email?.trim() || undefined,
      website: input.website?.trim() || undefined,
      industry: input.industry?.trim() || undefined,
      location: input.location?.trim() || undefined,
      source: input.source?.trim() || "Bulk Import Excel/CSV",
      researchNotes: safeNotes,
      painPoints: input.painPoints?.trim() || undefined,
      potentialServices:
        input.potentialServices?.trim() || "Basic Website Development",
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

    store.unshift(newProspect);
    created.push(newProspect);
  }

  if (created.length > 0) {
    persistProspects();
    logActivity({
      category: "CRM",
      action: "PROSPECT_BULK_IMPORTED",
      actorId: actorUserId,
      targetId: `batch-${Date.now()}`,
      targetType: "PROSPECT_BATCH",
      metadata: {
        totalImported: created.length,
        totalSkipped: errors.length,
      },
    });
  }

  return {
    success: created.length > 0,
    importedCount: created.length,
    skippedCount: errors.length,
    prospects: created,
    errors,
  };
}

/**
 * Perbarui informasi detail prospek CRM (catatan riset bisnis, pain points, industri/niche, tags, dsb.)
 */
export async function updateProspectDetails(
  prospectId: string,
  input: {
    researchNotes?: string;
    painPoints?: string;
    industry?: string;
    tags?: string[];
    companyName?: string;
    contactName?: string;
    email?: string;
    website?: string;
    location?: string;
  },
  actorUserId?: string,
  actorUserName?: string
): Promise<{ success: boolean; prospect?: Prospect; error?: string }> {
  const prospect = prospectsData.find((p) => p.id === prospectId && !p.isArchived);
  if (!prospect) {
    return { success: false, error: "Prospek tidak ditemukan." };
  }

  if (input.researchNotes !== undefined) prospect.researchNotes = input.researchNotes;
  if (input.painPoints !== undefined) prospect.painPoints = input.painPoints;
  if (input.industry !== undefined) prospect.industry = input.industry;
  if (input.tags !== undefined) prospect.tags = input.tags;
  if (input.companyName !== undefined) prospect.companyName = input.companyName;
  if (input.contactName !== undefined) prospect.contactName = input.contactName;
  if (input.email !== undefined) prospect.email = input.email;
  if (input.website !== undefined) prospect.website = input.website;
  if (input.location !== undefined) prospect.location = input.location;
  prospect.updatedAt = new Date().toISOString();

  persistProspects();

  logActivity({
    category: "CRM",
    action: "PROSPECT_UPDATED",
    actorId: actorUserId || "user",
    targetId: prospectId,
    targetType: "PROSPECT",
    metadata: {
      updatedFields: Object.keys(input),
      companyName: prospect.companyName,
      actorUserName,
    },
  });

  return { success: true, prospect };
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

  persistProspects();

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

  persistProspects();

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

  persistProspects();

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

  persistProspects();

  logActivity({
    category: "CRM",
    action: "PROSPECT_REACTIVATED",
    actorId: actorUserId,
    targetId: prospectId,
    metadata: { notes: notes || "Prospek diaktifkan kembali dari status Failed" },
  });

  return { success: true };
}

/**
 * Menghapus prospek dari database CRM
 * Hak Akses:
 * - OWNER: Bebas menghapus prospek manapun
 * - SALES: Hanya dapat menghapus prospek miliknya yang masih baru (stage NEW & belum pernah dikirimi outreach)
 */
export async function deleteProspect(
  prospectId: string,
  actorUserId: string,
  actorRole: string
): Promise<{ success: boolean; error?: string }> {
  const store = crmGlobal.prospectsData || prospectsData;
  const idx = store.findIndex((p) => p.id === prospectId);
  if (idx === -1) {
    return { success: false, error: "Data prospek tidak ditemukan." };
  }

  const prospect = store[idx];

  // Validasi Otorisasi
  if (actorRole !== "OWNER") {
    if (prospect.assignedSalesId && prospect.assignedSalesId !== actorUserId) {
      return {
        success: false,
        error: "Akses ditolak: Anda hanya dapat menghapus prospek milik Anda sendiri.",
      };
    }
    if (
      prospect.stage !== "NEW" ||
      (prospect.followUpLogs && prospect.followUpLogs.length > 0)
    ) {
      return {
        success: false,
        error: "Akses ditolak: Prospek yang sudah pernah dihubungi (outreach) hanya dapat dihapus oleh Owner.",
      };
    }
  }

  const [deleted] = store.splice(idx, 1);
  persistProspects();

  logActivity({
    category: "CRM",
    action: "PROSPECT_DELETED",
    actorId: actorUserId,
    targetId: prospectId,
    targetType: "PROSPECT",
    metadata: {
      companyName: deleted.companyName,
      whatsapp: deleted.whatsappNumber,
      stage: deleted.stage,
      deletedByRole: actorRole,
    },
  });

  return { success: true };
}

/**
 * Menghapus banyak data prospek sekaligus (Bulk Delete)
 */
export async function bulkDeleteProspects(
  prospectIds: string[],
  actorUserId: string,
  actorRole: string
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  const store = crmGlobal.prospectsData || prospectsData;
  let deletedCount = 0;

  for (const id of prospectIds) {
    const idx = store.findIndex((p) => p.id === id);
    if (idx === -1) continue;

    const prospect = store[idx];
    if (actorRole !== "OWNER") {
      if (prospect.assignedSalesId && prospect.assignedSalesId !== actorUserId) continue;
      if (
        prospect.stage !== "NEW" ||
        (prospect.followUpLogs && prospect.followUpLogs.length > 0)
      ) {
        continue;
      }
    }

    store.splice(idx, 1);
    deletedCount++;
  }

  persistProspects();

  logActivity({
    category: "CRM",
    action: "PROSPECTS_BULK_DELETED",
    actorId: actorUserId,
    targetId: `batch-delete-${Date.now()}`,
    targetType: "PROSPECT_BATCH",
    metadata: {
      requestedCount: prospectIds.length,
      deletedCount,
      deletedByRole: actorRole,
    },
  });

  return { success: true, deletedCount };
}
