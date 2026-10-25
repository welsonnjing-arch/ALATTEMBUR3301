import { NextRequest, NextResponse } from "next/server";
import {
  getWhatsAppSession,
  startWhatsAppPairing,
  confirmWhatsAppPairing,
  disconnectWhatsApp,
} from "@/modules/whatsapp/whatsapp.service";

export const dynamic = "force-dynamic";

export async function GET() {
  let session = await getWhatsAppSession();

  // Jika belum ada QR atau disconnected, otomatis inisialisasi
  if (session.status === "DISCONNECTED" || (!session.qrCodeDataUrl && session.status !== "CONNECTED")) {
    session = await startWhatsAppPairing();
  }

  return NextResponse.json(session, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action;

    if (action === "refresh") {
      const session = await startWhatsAppPairing(true);
      return NextResponse.json(session);
    }

    if (action === "confirm") {
      const phone = body.phoneNumber || "62895324069850";
      const session = await confirmWhatsAppPairing(phone);
      return NextResponse.json(session);
    }

    if (action === "disconnect") {
      const session = await disconnectWhatsApp();
      return NextResponse.json(session);
    }

    return NextResponse.json({ error: "Action tidak dikenal" }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
