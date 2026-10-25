"use server";

import { revalidatePath } from "next/cache";
import { getSessionCookie } from "../auth/session";
import { getAllApprovalRequests, reviewApprovalRequest } from "./approval.service";
import { ApprovalStatus } from "@/types/enums";

export async function fetchApprovalRequestsAction(status?: ApprovalStatus | "ALL") {
  return await getAllApprovalRequests(status);
}

export async function reviewApprovalAction(
  requestId: string,
  decision: "APPROVED" | "REJECTED",
  notes?: string
) {
  const session = await getSessionCookie();
  if (!session || session.role !== "OWNER") {
    return {
      success: false,
      error: "Hanya Owner yang berwenang memberikan persetujuan komersial.",
    };
  }

  const res = await reviewApprovalRequest(requestId, decision, session.id, notes);
  if (res.success) {
    revalidatePath("/approval-queue");
    revalidatePath("/command-center");
  }
  return res;
}
