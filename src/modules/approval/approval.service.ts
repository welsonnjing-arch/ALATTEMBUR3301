import { ApprovalRequest, ApprovalRequestType } from "./types";
import { ApprovalStatus } from "@/types/enums";
import { logActivity } from "@/lib/logger";

let approvalRequestsData: ApprovalRequest[] = [];

export async function getAllApprovalRequests(
  filterStatus?: ApprovalStatus | "ALL"
): Promise<ApprovalRequest[]> {
  if (!filterStatus || filterStatus === "ALL") {
    return [...approvalRequestsData];
  }
  return approvalRequestsData.filter((item) => item.status === filterStatus);
}

export async function createApprovalRequest(
  params: {
    type: ApprovalRequestType;
    title: string;
    description: string;
    requestedByUserId: string;
    requestedByUserName: string;
    relatedEntityId?: string;
    relatedEntityType?: "DEAL" | "INVOICE" | "PROJECT" | "PROSPECT";
  }
): Promise<ApprovalRequest> {
  const newRequest: ApprovalRequest = {
    id: `appr-${Date.now()}`,
    type: params.type,
    title: params.title,
    description: params.description,
    requestedByUserId: params.requestedByUserId,
    requestedByUserName: params.requestedByUserName,
    relatedEntityId: params.relatedEntityId,
    relatedEntityType: params.relatedEntityType,
    status: "PENDING",
    createdAt: new Date().toISOString(),
  };

  approvalRequestsData.unshift(newRequest);

  logActivity({
    category: "CRM",
    action: "APPROVAL_REQUEST_CREATED",
    actorId: params.requestedByUserId,
    targetId: newRequest.id,
    targetType: "APPROVAL_REQUEST",
    metadata: { type: newRequest.type, title: newRequest.title },
  });

  return newRequest;
}

export async function reviewApprovalRequest(
  id: string,
  decision: "APPROVED" | "REJECTED",
  reviewerUserId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const idx = approvalRequestsData.findIndex((r) => r.id === id);
  if (idx === -1) {
    return { success: false, error: "Permohonan approval tidak ditemukan." };
  }

  approvalRequestsData[idx].status = decision;
  approvalRequestsData[idx].reviewedByUserId = reviewerUserId;
  approvalRequestsData[idx].reviewedAt = new Date().toISOString();
  approvalRequestsData[idx].reviewNotes = notes;

  logActivity({
    category: "SECURITY",
    action: `APPROVAL_REQUEST_${decision}`,
    actorId: reviewerUserId,
    targetId: id,
    targetType: "APPROVAL_REQUEST",
    metadata: { decision, notes },
  });

  return { success: true };
}
