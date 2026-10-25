import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/modules/whatsapp/whatsapp.service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[WA_SEND_API] Menerima request kirim:", {
      to: body.whatsappNumber,
      textLength: body.text?.length,
    });

    const res = await sendWhatsAppMessage(body);
    console.log("[WA_SEND_API] Hasil kirim:", res);

    return NextResponse.json(res);
  } catch (error: unknown) {
    console.error("[WA_SEND_API] Error:", error);
    const msg = error instanceof Error ? error.message : "Gagal mengirim pesan";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
