import fs from "node:fs";
import path from "node:path";
import {
  BulkDistributeResult,
  BulkDistributionConfig,
  CreateProspectInput,
  FollowUpLogItem,
  normalizeWhatsAppNumber,
  Prospect,
  SalesUserOption,
} from "./types";
import { FailedReason, NextAction, PipelineStage } from "@/types/enums";
import { calculateNextFollowUp } from "../follow-up/follow-up.service";
import { logActivity } from "@/lib/logger";
import { INITIAL_INTERNAL_USERS } from "@/modules/auth/session";

// In-Memory Database Store dengan globalThis agar konsisten di Server Action, Server Component, & HMR
const INITIAL_PROSPECTS_DATA: Prospect[] = [];

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
      if (Array.isArray(parsed)) {
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

const crmGlobal = globalThis as unknown as CRMGlobalStore;

export function getProspectsStore(): Prospect[] {
  ensureStorageDir();
  try {
    if (fs.existsSync(PROSPECTS_FILE)) {
      const content = fs.readFileSync(PROSPECTS_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        if (!crmGlobal.prospectsData) {
          crmGlobal.prospectsData = parsed;
        } else {
          crmGlobal.prospectsData.length = 0;
          crmGlobal.prospectsData.push(...parsed);
        }
        return crmGlobal.prospectsData;
      }
    }
  } catch (err) {
    console.error("[CRM_PERSISTENCE] Gagal membaca crm-prospects.json:", err);
  }

  if (!crmGlobal.prospectsData) {
    crmGlobal.prospectsData = loadPersistedProspects();
  }
  return crmGlobal.prospectsData;
}

export function persistProspects(): void {
  ensureStorageDir();
  try {
    const data = crmGlobal.prospectsData || getProspectsStore();
    if (data) {
      fs.writeFileSync(
        PROSPECTS_FILE,
        JSON.stringify(data, null, 2),
        "utf-8"
      );
    }
  } catch (err) {
    console.error("[CRM_PERSISTENCE] Gagal menyimpan data prospek ke disk:", err);
  }
}

if (!crmGlobal.prospectsData || crmGlobal.prospectsData.length === 0) {
  crmGlobal.prospectsData = getProspectsStore();
}

export const prospectsData = crmGlobal.prospectsData;

export async function getAllProspects(filter?: {
  stage?: PipelineStage | "ALL";
  assignedSalesId?: string;
  search?: string;
}): Promise<Prospect[]> {
  const store = getProspectsStore();
  let list = [...store];

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
  const store = getProspectsStore();
  const p = store.find((item) => item.id === id);
  return p ? { ...p } : null;
}

export async function checkDuplicateWhatsApp(
  rawPhone: string
): Promise<{ isDuplicate: boolean; matchedProspect?: Prospect }> {
  const { formatted, isValid } = normalizeWhatsAppNumber(rawPhone);
  if (!isValid) return { isDuplicate: false };

  const store = getProspectsStore();
  const matched = store.find(
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
      actorRole === "SALES" || actorRole === "DEVELOPER"
        ? actorUserId
        : input.assignedSalesId || actorUserId,
    assignedSalesName:
      actorRole === "DEVELOPER"
        ? "Eko Pratama (Developer)"
        : actorRole === "SALES"
        ? "Budi Santoso (Sales)"
        : "Faiz Aditama (Owner)",
    stage: "NEW",
    nextAction: "REACH_NOW",
    followUpStep: "INITIAL",
    isArchived: false,
    followUpLogs: [],
    tags: input.tags || [],
    avatarUrl: input.avatarUrl,
    bio: input.bio,
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

/**
 * Mengambil daftar sales user internal yang aktif
 */
export function getAvailableSalesUsers(): SalesUserOption[] {
  const seen = new Set<string>();
  const list: SalesUserOption[] = [];
  for (const u of INITIAL_INTERNAL_USERS) {
    if (u.role === "SALES" && u.status === "ACTIVE" && !seen.has(u.id)) {
      seen.add(u.id);
      list.push({ id: u.id, fullName: u.fullName, email: u.email });
    }
  }
  return list;
}

export function getInternalUserById(userId: string) {
  return INITIAL_INTERNAL_USERS.find((u) => u.id === userId);
}

export async function bulkCreateProspects(
  inputs: CreateProspectInput[],
  actorUserId: string,
  actorRole: string,
  distributionConfig?: BulkDistributionConfig
): Promise<BulkImportResult> {
  const store = crmGlobal.prospectsData || prospectsData;
  const created: Prospect[] = [];
  const errors: Array<{ row: number; companyName: string; reason: string }> = [];

  // Konfigurasi target tim sales jika mode ROUND_ROBIN aktif
  const targetSalesIds =
    distributionConfig?.mode === "ROUND_ROBIN" &&
    distributionConfig.targetSalesIds &&
    distributionConfig.targetSalesIds.length > 0
      ? distributionConfig.targetSalesIds
      : null;

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

    // Hitung penugasan sales (Bagi Rata Round-Robin, Single Sales, atau Default Akun Pembuat)
    let assignedSalesId: string;
    let assignedSalesName: string;

    if (targetSalesIds && targetSalesIds.length > 0) {
      // Rotasi proporsional Round-Robin ke tim sales terpilih
      assignedSalesId = targetSalesIds[created.length % targetSalesIds.length];
      const targetUser = getInternalUserById(assignedSalesId);
      assignedSalesName = targetUser ? targetUser.fullName : "Tim Sales Fynux";
    } else if (
      distributionConfig?.mode === "SINGLE_SALES" &&
      distributionConfig.singleSalesId
    ) {
      assignedSalesId = distributionConfig.singleSalesId;
      const targetUser = getInternalUserById(assignedSalesId);
      assignedSalesName = targetUser ? targetUser.fullName : "Tim Sales Fynux";
    } else {
      assignedSalesId =
        actorRole === "SALES"
          ? actorUserId
          : input.assignedSalesId || actorUserId;
      const targetUser = getInternalUserById(assignedSalesId);
      assignedSalesName = targetUser
        ? targetUser.fullName
        : actorRole === "SALES"
        ? "Budi Santoso (Sales 1)"
        : "Faiz Aditama (Owner)";
    }

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
      assignedSalesId,
      assignedSalesName,
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
        distributionMode: distributionConfig?.mode || "DEFAULT",
        targetSalesCount: targetSalesIds ? targetSalesIds.length : 1,
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
 * Membagi rata sejumlah prospek terpilih ke tim sales secara Round-Robin (Bulk Re-distribute)
 */
export async function bulkDistributeProspects(
  prospectIds: string[],
  targetSalesIds: string[],
  actorUserId: string,
  actorRole: string
): Promise<BulkDistributeResult> {
  if (!prospectIds || prospectIds.length === 0) {
    return { success: false, updatedCount: 0, message: "Tidak ada prospek yang dipilih." };
  }
  if (!targetSalesIds || targetSalesIds.length === 0) {
    return { success: false, updatedCount: 0, message: "Pilih minimal 1 akun sales untuk pembagian." };
  }

  const store = crmGlobal.prospectsData || prospectsData;
  const targetProspects = store.filter((p) => prospectIds.includes(p.id) && !p.isArchived);

  if (targetProspects.length === 0) {
    return { success: false, updatedCount: 0, message: "Prospek terpilih tidak ditemukan atau sudah diarsipkan." };
  }

  const salesMap = new Map<string, { id: string; fullName: string }>();
  for (const sId of targetSalesIds) {
    const u = getInternalUserById(sId);
    if (u) {
      salesMap.set(sId, { id: u.id, fullName: u.fullName });
    }
  }

  const distributionSummary: Record<string, number> = {};
  targetSalesIds.forEach((id) => (distributionSummary[id] = 0));

  let assignedIndex = 0;
  for (const prospect of targetProspects) {
    const assignedSalesId = targetSalesIds[assignedIndex % targetSalesIds.length];
    const salesInfo = salesMap.get(assignedSalesId);
    const assignedSalesName = salesInfo ? salesInfo.fullName : "Tim Sales Fynux";

    prospect.assignedSalesId = assignedSalesId;
    prospect.assignedSalesName = assignedSalesName;
    prospect.updatedAt = new Date().toISOString();

    distributionSummary[assignedSalesId] = (distributionSummary[assignedSalesId] || 0) + 1;
    assignedIndex++;
  }

  persistProspects();

  logActivity({
    category: "CRM",
    action: "PROSPECTS_BULK_DISTRIBUTED",
    actorId: actorUserId,
    targetId: `batch-distribute-${Date.now()}`,
    targetType: "PROSPECT_BATCH",
    metadata: {
      requestedCount: prospectIds.length,
      distributedCount: targetProspects.length,
      targetSalesCount: targetSalesIds.length,
      distributionSummary,
      distributedByRole: actorRole,
    },
  });

  return {
    success: true,
    updatedCount: targetProspects.length,
    distributionSummary,
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
    avatarUrl?: string;
    bio?: string;
  },
  actorUserId?: string,
  actorUserName?: string
): Promise<{ success: boolean; prospect?: Prospect; error?: string }> {
  const store = getProspectsStore();
  const prospect = store.find((p) => p.id === prospectId && !p.isArchived);
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
  if (input.avatarUrl !== undefined) prospect.avatarUrl = input.avatarUrl;
  if (input.bio !== undefined) prospect.bio = input.bio;
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
  const store = getProspectsStore();
  const idx = store.findIndex((p) => p.id === prospectId);
  if (idx === -1) return { success: false, error: "Prospek tidak ditemukan." };

  store[idx].stage = stage;
  store[idx].nextAction = nextAction;
  store[idx].updatedAt = new Date().toISOString();

  if (stage === "FAILED" && failedReason) {
    store[idx].failedReason = failedReason;
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
  const store = getProspectsStore();
  const idx = store.findIndex((p) => p.id === prospectId);
  if (idx === -1) return { success: false };

  const p = store[idx];
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
  const store = getProspectsStore();
  const idx = store.findIndex((p) => p.id === prospectId);
  if (idx === -1) return { success: false };

  const p = store[idx];
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
  const store = getProspectsStore();
  const idx = store.findIndex((p) => p.id === prospectId);
  if (idx === -1) return { success: false };

  const p = store[idx];
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
