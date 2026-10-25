import { NextRequest, NextResponse } from "next/server";
import { assignConversationToSales } from "@/modules/inbox/inbox.service";
import { getSessionCookie } from "@/modules/auth/session";
import { logSecurityEvent } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionCookie();

    // Validasi otorisasi: Hanya role OWNER yang berhak menugaskan atau memindahkan penugasan kontak
    if (session && session.role !== "OWNER") {
      logSecurityEvent("UNAUTHORIZED_ASSIGNMENT_ATTEMPT", session.id, {
        role: session.role,
        email: session.email,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Akses ditolak: Hanya Owner yang memiliki wewenang untuk menugaskan kontak ini ke Sales.",
        },
        { status: 403 }
      );
    }

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
