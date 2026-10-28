import { NextRequest, NextResponse } from "next/server";
import { syncConversationWhatsAppProfile, fetchContactWhatsAppProfile } from "@/modules/whatsapp/whatsapp.service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversationId, phone } = body;

    if (conversationId) {
      const res = await syncConversationWhatsAppProfile(conversationId);
      return NextResponse.json(res);
    }

    if (phone) {
      const res = await fetchContactWhatsAppProfile(phone);
      return NextResponse.json({ success: true, ...res });
    }

    return NextResponse.json(
      { success: false, error: "conversationId atau phone wajib disertakan." },
      { status: 400 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan internal";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
