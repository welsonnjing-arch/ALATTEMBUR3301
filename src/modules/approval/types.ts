import { ApprovalStatus } from "@/types/enums";

export type ApprovalRequestType =
  | "DISCOUNT"
  | "CUSTOM_PRICING"
  | "PAYMENT_TERMS"
  | "REFUND"
  | "PROJECT_CANCELLATION"
  | "CONTRACTUAL_COMMITMENT"
  | "AI_COMMERCIAL_ACTION";

export interface ApprovalRequest {
  id: string;
  type: ApprovalRequestType;
  title: string;
  description: string;
  requestedByUserId: string;
  requestedByUserName: string;
  relatedEntityId?: string; // dealId, invoiceId, projectId, atau prospectId
  relatedEntityType?: "DEAL" | "INVOICE" | "PROJECT" | "PROSPECT";
  status: ApprovalStatus;
  reviewedByUserId?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
}
