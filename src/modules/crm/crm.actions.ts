"use server";

import { revalidatePath } from "next/cache";
import { getSessionCookie } from "../auth/session";
import {
  bulkCreateProspects,
  bulkDeleteProspects,
  bulkDistributeProspects,
  getAvailableSalesUsers,
  checkDuplicateWhatsApp,
  confirmOutreachSent,
  createProspect,
  deleteProspect,
  getAllProspects,
  getProspectById,
  reactivateProspect,
  recordClientReply,
  updateProspectStage,
  updateProspectDetails,
} from "./crm.service";
import {
  BulkDistributeResult,
  BulkDistributionConfig,
  CreateProspectInput,
  Prospect,
  SalesUserOption,
} from "./types";
import { FailedReason, NextAction, PipelineStage } from "@/types/enums";

export async function fetchProspectsAction(filter?: {
  stage?: PipelineStage | "ALL";
  search?: string;
}): Promise<Prospect[]> {
  const session = await getSessionCookie();
  if (!session) return [];

  // Jika bukan Owner dan tidak punya permission crm.view_all, hanya ambil prospek milik Sales tersebut
  const assignedSalesId =
    session.role === "OWNER" || session.permissions.includes("crm.view_all")
      ? undefined
      : session.id;

  return await getAllProspects({
    ...filter,
    assignedSalesId,
  });
}

export async function checkDuplicateAction(phone: string) {
  return await checkDuplicateWhatsApp(phone);
}

export async function createProspectAction(input: CreateProspectInput) {
  const session = await getSessionCookie();
  if (!session) {
    return { success: false, error: "Sesi telah berakhir. Silakan login kembali." };
  }

  const res = await createProspect(input, session.id, session.role);
  if (res.success) {
    revalidatePath("/crm");
    revalidatePath("/sales-workspace");
  }
  return res;
}

export async function fetchAvailableSalesAction(): Promise<SalesUserOption[]> {
  return getAvailableSalesUsers();
}

export async function bulkCreateProspectsAction(
  inputs: CreateProspectInput[],
  distributionConfig?: BulkDistributionConfig
) {
  const session = await getSessionCookie();
  if (!session) {
    return {
      success: false,
      importedCount: 0,
      skippedCount: inputs.length,
      prospects: [],
      errors: [{ row: 0, companyName: "Semua", reason: "Sesi telah berakhir. Silakan login kembali." }],
    };
  }

  const res = await bulkCreateProspects(inputs, session.id, session.role, distributionConfig);
  if (res.success) {
    revalidatePath("/crm");
    revalidatePath("/sales-workspace");
    revalidatePath("/inbox");
  }
  return res;
}

export async function bulkDistributeProspectsAction(
  prospectIds: string[],
  targetSalesIds: string[]
): Promise<BulkDistributeResult> {
  const session = await getSessionCookie();
  if (!session) {
    return { success: false, updatedCount: 0, message: "Sesi telah berakhir. Silakan login kembali." };
  }

  // Hanya OWNER atau user dengan izin crm.edit_all yang berhak membagikan prospek secara massal
  if (session.role !== "OWNER" && !session.permissions?.includes("crm.edit_all")) {
    return {
      success: false,
      updatedCount: 0,
      message: "Hanya akun Owner yang memiliki wewenang membagikan prospek tim sales.",
    };
  }

  const res = await bulkDistributeProspects(
    prospectIds,
    targetSalesIds,
    session.id,
    session.role
  );

  if (res.success) {
    revalidatePath("/crm");
    revalidatePath("/sales-workspace");
    revalidatePath("/inbox");
  }

  return res;
}

export async function updateProspectStatusAction(
  prospectId: string,
  stage: PipelineStage,
  nextAction: NextAction,
  failedReason?: FailedReason
) {
  const session = await getSessionCookie();
  if (!session) {
    return { success: false, error: "Sesi telah berakhir." };
  }

  const res = await updateProspectStage(
    prospectId,
    stage,
    nextAction,
    session.id,
    failedReason
  );

  if (res.success) {
    revalidatePath("/crm");
    revalidatePath("/sales-workspace");
  }
  return res;
}

export async function confirmOutreachSentAction(
  prospectId: string,
  notes?: string
) {
  const session = await getSessionCookie();
  if (!session) {
    return { success: false, error: "Sesi telah berakhir." };
  }

  const res = await confirmOutreachSent(
    prospectId,
    session.id,
    session.fullName,
    notes
  );

  if (res.success) {
    revalidatePath("/crm");
    revalidatePath("/sales-workspace");
  }
  return res;
}

export async function recordClientReplyAction(
  prospectId: string,
  replyText: string
) {
  const session = await getSessionCookie();
  if (!session) {
    return { success: false, error: "Sesi telah berakhir." };
  }

  const res = await recordClientReply(prospectId, replyText, session.id);
  if (res.success) {
    revalidatePath("/crm");
    revalidatePath("/sales-workspace");
  }
  return res;
}

export async function reactivateProspectAction(
  prospectId: string,
  notes?: string
) {
  const session = await getSessionCookie();
  if (!session) {
    return { success: false, error: "Sesi telah berakhir." };
  }

  const res = await reactivateProspect(prospectId, session.id, notes);
  if (res.success) {
    revalidatePath("/crm");
    revalidatePath("/sales-workspace");
  }
  return res;
}

export async function getProspectDetailAction(id: string) {
  return await getProspectById(id);
}

export async function deleteProspectAction(prospectId: string) {
  const session = await getSessionCookie();
  if (!session) {
    return { success: false, error: "Sesi telah berakhir. Silakan login kembali." };
  }

  const res = await deleteProspect(prospectId, session.id, session.role);
  if (res.success) {
    revalidatePath("/crm");
    revalidatePath("/sales-workspace");
    revalidatePath("/inbox");
  }
  return res;
}

export async function bulkDeleteProspectsAction(prospectIds: string[]) {
  const session = await getSessionCookie();
  if (!session) {
    return { success: false, deletedCount: 0, error: "Sesi telah berakhir. Silakan login kembali." };
  }

  const res = await bulkDeleteProspects(prospectIds, session.id, session.role);
  if (res.success) {
    revalidatePath("/crm");
    revalidatePath("/sales-workspace");
    revalidatePath("/inbox");
  }
  return res;
}

export async function updateProspectDetailsAction(
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
  }
) {
  const session = await getSessionCookie();
  if (!session) {
    return { success: false, error: "Sesi telah berakhir." };
  }

  const res = await updateProspectDetails(
    prospectId,
    input,
    session.id,
    session.fullName
  );

  if (res.success) {
    revalidatePath("/crm");
    revalidatePath("/inbox");
    revalidatePath("/sales-workspace");
  }
  return res;
}
