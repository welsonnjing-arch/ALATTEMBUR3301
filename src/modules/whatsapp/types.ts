import { PipelineStage } from "@/types/enums";

export type WhatsAppConnectionStatus =
  | "DISCONNECTED"
  | "SCANNING_QR"
  | "CONNECTING"
  | "CONNECTED"
  | "ERROR";

export interface WhatsAppSessionInfo {
  status: WhatsAppConnectionStatus;
  qrCodeDataUrl: string | null;
  phoneNumber: string | null;
  pushName: string | null;
  platform: string | null;
  connectedAt: string | null;
  lastActiveAt: string | null;
  error?: string | null;
}

export interface WhatsAppSendMessageInput {
  prospectId?: string;
  whatsappNumber: string;
  text: string;
  actorUserId?: string;
  actorUserName?: string;
}

export interface WhatsAppMessageResult {
  success: boolean;
  messageId?: string;
  timestamp?: string;
  error?: string;
  updatedStage?: PipelineStage;
}
