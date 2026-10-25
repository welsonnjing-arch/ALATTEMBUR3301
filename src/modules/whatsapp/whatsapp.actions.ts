"use server";

import { revalidatePath } from "next/cache";
import {
  getWhatsAppSession,
  startWhatsAppPairing,
  confirmWhatsAppPairing,
  disconnectWhatsApp,
  sendWhatsAppMessage,
  handleIncomingWhatsAppMessage,
} from "./whatsapp.service";
import { WhatsAppSendMessageInput } from "./types";

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
