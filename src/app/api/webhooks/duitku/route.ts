import { NextRequest, NextResponse } from "next/server";
import { getDuitkuConfig, verifyDuitkuCallbackSignature } from "@/integrations/duitku/client";
import { logActivity } from "@/lib/logger";

/**
 * FYNUX OS — Webhook Callback Duitku Payment Gateway
 * Memvalidasi signature MD5 dan mencatat perubahan status pembayaran.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const merchantCode = body.get("merchantCode")?.toString() || "";
    const amount = body.get("amount")?.toString() || "";
    const merchantOrderId = body.get("merchantOrderId")?.toString() || "";
    const signature = body.get("signature")?.toString() || "";
    const resultCode = body.get("resultCode")?.toString() || "";

    const config = getDuitkuConfig();

    // 1. Verifikasi Signature
    const isValid = verifyDuitkuCallbackSignature(
      merchantCode,
      amount,
      merchantOrderId,
      signature,
      config.apiKey
    );

    if (!isValid) {
      logActivity({
        category: "SECURITY",
        action: "DUITKU_CALLBACK_INVALID_SIGNATURE",
        actorId: "SYSTEM_WEBHOOK",
        metadata: { merchantOrderId, merchantCode },
      });
      return new NextResponse("Bad Signature", { status: 400 });
    }

    // 2. Evaluasi Hasil Pembayaran ("00" = Berhasil)
    if (resultCode === "00") {
      logActivity({
        category: "FINANCE",
        action: "DUITKU_PAYMENT_SUCCESS",
        actorId: "DUITKU_GATEWAY",
        targetId: merchantOrderId,
        metadata: { amount, resultCode },
      });
    } else {
      logActivity({
        category: "FINANCE",
        action: "DUITKU_PAYMENT_FAILED",
        actorId: "DUITKU_GATEWAY",
        targetId: merchantOrderId,
        metadata: { amount, resultCode },
      });
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
