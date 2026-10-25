"use server";

import { revalidatePath } from "next/cache";
import {
  appendDraftReply,
  appendIncomingMessage,
  getAllConversations,
  getConversationById,
} from "./inbox.service";
import { getSessionCookie } from "../auth/session";

export async function fetchConversationsAction() {
  return await getAllConversations();
}

export async function fetchConversationByIdAction(id: string) {
  return await getConversationById(id);
}

export async function pasteIncomingChatAction(
  conversationId: string,
  rawText: string
) {
  const session = await getSessionCookie();
  if (!session) {
    return { success: false, error: "Sesi telah berakhir." };
  }

  const res = await appendIncomingMessage(conversationId, rawText.trim());
  if (res.success) {
    revalidatePath("/inbox");
  }
  return res;
}

export async function saveDraftReplyAction(
  conversationId: string,
  draftText: string
) {
  const session = await getSessionCookie();
  if (!session) {
    return { success: false, error: "Sesi telah berakhir." };
  }

  const res = await appendDraftReply(conversationId, draftText.trim());
  if (res.success) {
    revalidatePath("/inbox");
  }
  return res;
}
