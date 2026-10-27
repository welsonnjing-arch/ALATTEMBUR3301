import { NextRequest, NextResponse } from "next/server";
import { handleIncomingWhatsAppMessage } from "@/modules/whatsapp/whatsapp.service";
import { updateMessageStatus } from "@/modules/inbox/inbox.service";

/**
 * Endpoint Webhook WhatsApp (Menerima event pesan masuk dari WhatsApp Gateway & status read receipt)
 * Mendukung format generic { phone, text }, format Fonnte { sender, message }, dan WhatsApp Cloud API
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 0. Format Status Update Meta WhatsApp Cloud API
    if (body.entry?.[0]?.changes?.[0]?.value?.statuses?.[0]) {
      const statusObj = body.entry[0].changes[0].value.statuses[0];
      const wamid = statusObj.id;
      const statusStr = String(statusObj.status || "").toLowerCase();
      let mappedStatus: "SENT" | "DELIVERED" | "READ" | "FAILED" = "SENT";
      if (statusStr === "read") mappedStatus = "READ";
      else if (statusStr === "delivered") mappedStatus = "DELIVERED";
      else if (statusStr === "sent") mappedStatus = "SENT";
      else if (statusStr === "failed") mappedStatus = "FAILED";

      const updated = updateMessageStatus(wamid, mappedStatus);
      return NextResponse.json({
        success: true,
        event: "STATUS_UPDATE",
        messageId: wamid,
        status: mappedStatus,
        updated,
      });
    }

    // 0b. Format Status Update generic / Wablas / Fonnte { id, status: "delivered" | "read" }
    if (body.id && body.status && !body.message && !body.text) {
      const statusStr = String(body.status).toLowerCase();
      let mappedStatus: "SENT" | "DELIVERED" | "READ" | "FAILED" = "SENT";
      if (statusStr === "read") mappedStatus = "READ";
      else if (statusStr === "delivered") mappedStatus = "DELIVERED";
      else if (statusStr === "sent") mappedStatus = "SENT";
      else if (statusStr === "failed") mappedStatus = "FAILED";

      const updated = updateMessageStatus(String(body.id), mappedStatus);
      return NextResponse.json({
        success: true,
        event: "STATUS_UPDATE",
        messageId: body.id,
        status: mappedStatus,
        updated,
      });
    }

    let senderPhone = "";
    let messageText = "";

    // 1. Format Generic Fynux / Standard Gateway
    if (body.phone && body.text) {
      senderPhone = String(body.phone);
      messageText = String(body.text);
    }
    // 2. Format Fonnte / Wablas
    else if (body.sender && (body.message || body.text)) {
      senderPhone = String(body.sender);
      messageText = String(body.message || body.text);
    }
    // 3. Format Meta WhatsApp Cloud API
    else if (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const msgObj = body.entry[0].changes[0].value.messages[0];
      senderPhone = String(msgObj.from || "");
      messageText = String(msgObj.text?.body || "");
    }

    if (!senderPhone || !messageText) {
      return NextResponse.json(
        { error: "Payload webhook tidak memuat data nomor pengirim atau teks pesan." },
        { status: 400 }
      );
    }

    const result = await handleIncomingWhatsAppMessage(senderPhone, messageText);

    return NextResponse.json({
      success: true,
      processed: result.success,
      conversationId: result.conversationId,
      prospectId: result.prospectId,
    });
  } catch (error: unknown) {
    console.error("Gagal memproses webhook WhatsApp:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Handler GET untuk verifikasi webhook (Meta Webhook verification handshake)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === "fynux_verify_token") {
    return new Response(challenge || "OK", { status: 200 });
  }

  return NextResponse.json({ status: "WhatsApp Webhook Active" });
}
