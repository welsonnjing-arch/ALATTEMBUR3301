import { NextRequest, NextResponse } from "next/server";
import {
  deleteConversation,
  getAllConversations,
  getOrCreateConversationByProspect,
} from "@/modules/inbox/inbox.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const conversations = await getAllConversations();
  return NextResponse.json(conversations, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.whatsappNumber || !body.companyName) {
      return NextResponse.json(
        { success: false, error: "Nomor WhatsApp dan Nama Perusahaan wajib diisi." },
        { status: 400 }
      );
    }

    const thread = await getOrCreateConversationByProspect({
      id: body.prospectId || `p-direct-${Date.now()}`,
      companyName: body.companyName,
      contactName: body.contactName || body.companyName,
      whatsappNumber: body.whatsappNumber,
      researchNotes: body.researchNotes,
      assignedSalesId: body.assignedSalesId,
      assignedSalesName: body.assignedSalesName,
    });

    return NextResponse.json({ success: true, thread });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal membuat ruang obrolan";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("id");
    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: "ID percakapan wajib disertakan." },
        { status: 400 }
      );
    }

    const deleted = await deleteConversation(conversationId);
    return NextResponse.json({ success: deleted });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menghapus percakapan";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
