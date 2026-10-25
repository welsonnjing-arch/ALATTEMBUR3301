import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/modules/whatsapp/whatsapp.service";
import { getSessionCookie } from "@/modules/auth/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session = await getSessionCookie();

    const actorUserId = body.actorUserId || session?.id || "sales-operator";
    const actorUserName = body.actorUserName || session?.fullName || "Sales Operator";

    console.log("[WA_SEND_API] Menerima request kirim:", {
      to: body.whatsappNumber,
      textLength: body.text?.length,
      actorUserName,
    });

    const res = await sendWhatsAppMessage({
      ...body,
      actorUserId,
      actorUserName,
    });
    console.log("[WA_SEND_API] Hasil kirim:", res);

    return NextResponse.json(res);
  } catch (error: unknown) {
    console.error("[WA_SEND_API] Error:", error);
    const msg = error instanceof Error ? error.message : "Gagal mengirim pesan";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
