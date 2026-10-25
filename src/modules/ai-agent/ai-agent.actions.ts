"use server";

import { revalidatePath } from "next/cache";
import { getConversationById } from "../inbox/inbox.service";
import { analyzeConversationWithGemini } from "./ai-agent.service";
import { getSessionCookie } from "../auth/session";
import { createApprovalRequest } from "../approval/approval.service";

export async function analyzeConversationAction(conversationId: string) {
  const session = await getSessionCookie();
  if (!session) {
    return { success: false, error: "Sesi tidak valid." };
  }

  const conv = await getConversationById(conversationId);
  if (!conv) {
    return { success: false, error: "Percakapan tidak ditemukan." };
  }

  const history = conv.messages.map((m) => ({
    sender: m.sender as "SALES" | "PROSPECT",
    text: m.text,
    timestamp: m.timestamp,
  }));

  const analysis = await analyzeConversationWithGemini({
    prospectResearchNotes: conv.researchNotes,
    conversationHistory: history,
  });

  // Jika AI mendeteksi permintaan komersial (diskon/harga kustom), buat tiket di Approval Queue
  if (analysis.requiresCommercialApproval && analysis.commercialApprovalDetails) {
    await createApprovalRequest({
      type: analysis.commercialApprovalDetails.type,
      title: `${analysis.commercialApprovalDetails.type}: ${conv.companyName}`,
      description: `${analysis.commercialApprovalDetails.description}. Nilai diminta: ${analysis.commercialApprovalDetails.requestedValue || "Negosiasi"}`,
      requestedByUserId: session.id,
      requestedByUserName: `${session.fullName} (via AI Agent)`,
      relatedEntityId: conv.prospectId,
      relatedEntityType: "PROSPECT",
    });

    revalidatePath("/approval-queue");
  }

  return { success: true, analysis };
}
