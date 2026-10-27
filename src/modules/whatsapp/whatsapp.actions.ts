"use server";

import { revalidatePath } from "next/cache";
import {
  getWhatsAppSession,
  startWhatsAppPairing,
  confirmWhatsAppPairing,
  disconnectWhatsApp,
  sendWhatsAppMessage,
  handleIncomingWhatsAppMessage,
  markConversationMessagesAsRead,
  simulateRecipientReadMessages,
} from "./whatsapp.service";
import { WhatsAppSendMessageInput } from "./types";
import { MessageStatus } from "@/modules/inbox/types";
import { updateMessageStatus } from "@/modules/inbox/inbox.service";

export async function getWhatsAppSessionAction() {
  return await getWhatsAppSession();
}

export async function startWhatsAppPairingAction() {
  const session = await startWhatsAppPairing();
  revalidatePath("/inbox");
  return session;
}

export async function confirmWhatsAppPairingAction(
  phoneNumber?: string,
  pushName?: string
) {
  const session = await confirmWhatsAppPairing(phoneNumber, pushName);
  revalidatePath("/inbox");
  revalidatePath("/crm");
  return session;
}

export async function disconnectWhatsAppAction() {
  const session = await disconnectWhatsApp();
  revalidatePath("/inbox");
  revalidatePath("/crm");
  return session;
}

export async function sendWhatsAppMessageAction(input: WhatsAppSendMessageInput) {
  const res = await sendWhatsAppMessage(input);
  revalidatePath("/inbox");
  revalidatePath("/crm");
  revalidatePath("/sales-workspace");
  return res;
}

export async function simulateIncomingWhatsAppMessageAction(
  phoneNumber: string,
  text: string
) {
  const res = await handleIncomingWhatsAppMessage(phoneNumber, text);
  revalidatePath("/inbox");
  revalidatePath("/crm");
  revalidatePath("/sales-workspace");
  return res;
}

export async function addConversationNoteAction(
  conversationId: string,
  text: string,
  actorUserId?: string,
  actorUserName?: string
) {
  const { appendOutgoingMessage } = await import("@/modules/inbox/inbox.service");
  const res = await appendOutgoingMessage(
    conversationId,
    text,
    "SALES",
    actorUserId || "SYSTEM",
    actorUserName || "Sistem Fynux"
  );
  revalidatePath("/inbox");
  return res;
}

export async function markConversationAsReadAction(conversationId: string) {
  const res = await markConversationMessagesAsRead(conversationId);
  revalidatePath("/inbox");
  return res;
}

export async function simulateRecipientReadMessagesAction(conversationId: string) {
  const res = await simulateRecipientReadMessages(conversationId);
  revalidatePath("/inbox");
  return res;
}

export async function updateMessageStatusAction(
  messageId: string,
  status: MessageStatus
) {
  const updated = updateMessageStatus(messageId, status);
  if (updated) {
    revalidatePath("/inbox");
  }
  return { success: updated };
}
