"use server";

import { revalidatePath } from "next/cache";
import { getSessionCookie } from "../auth/session";
import {
  checkDuplicateWhatsApp,
  confirmOutreachSent,
  createProspect,
  getAllProspects,
  getProspectById,
  reactivateProspect,
  recordClientReply,
  updateProspectStage,
} from "./crm.service";
import { CreateProspectInput, Prospect } from "./types";
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
