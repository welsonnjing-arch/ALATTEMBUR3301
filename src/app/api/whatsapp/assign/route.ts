import { NextRequest, NextResponse } from "next/server";
import { assignConversationToSales } from "@/modules/inbox/inbox.service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { conversationId, salesId, salesName } = await req.json();

    if (!conversationId || !salesId || !salesName) {
      return NextResponse.json(
        { success: false, error: "Parameter conversationId, salesId, dan salesName wajib diisi." },
        { status: 400 }
      );
    }

    const result = await assignConversationToSales(conversationId, salesId, salesName);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menugaskan percakapan";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
