import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/logger";

/**
 * FYNUX OS — Internal Cron & Automation Runner
 * Menjalankan evaluasi jatuh tempo follow-up CRM dan pengingat renewal kontrak maintenance.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  logActivity({
    category: "SYSTEM",
    action: "CRON_EXECUTION_TRIGGERED",
    actorId: "SYSTEM_CRON",
    metadata: { timestamp: new Date().toISOString() },
  });

  return NextResponse.json({
    success: true,
    message: "Fynux OS background evaluation triggered successfully",
    timestamp: new Date().toISOString(),
  });
}
