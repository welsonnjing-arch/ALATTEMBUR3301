import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  startWhatsAppPairing,
  confirmWhatsAppPairing,
  disconnectWhatsApp,
  sendWhatsAppMessage,
  handleIncomingWhatsAppMessage,
  getWhatsAppSession,
} from "../src/modules/whatsapp/whatsapp.service";
import { createProspect, prospectsData } from "../src/modules/crm/crm.service";
import { conversationsData } from "../src/modules/inbox/inbox.service";

describe("Native WhatsApp Web Engine & CRM Synchronization", () => {
  test("generates dynamic QR code data URL or preserves connected session", async () => {
    const session = await startWhatsAppPairing();
    assert.ok(session.status === "SCANNING_QR" || session.status === "CONNECTED");
    if (session.status === "SCANNING_QR") {
      assert.ok(session.qrCodeDataUrl?.startsWith("data:image/png;base64,"));
    }
  });

  test("confirms pairing and marks session connected with normalized phone", async () => {
    const session = await confirmWhatsAppPairing("0895324069850", "Fynux Official");
    assert.equal(session.status, "CONNECTED");
    assert.equal(session.phoneNumber, "62895324069850");
    assert.equal(session.qrCodeDataUrl, null);
  });

  test("automatically transitions CRM prospect from NEW to CONTACTED on outgoing message", async () => {
    // 1. Buat prospek baru di CRM
    const testPhone = "081299900011";
    const createRes = await createProspect(
      {
        companyName: "PT Bintang Abadi Konstruksi",
        contactName: "Bapak Hendra",
        whatsappNumber: testPhone,
        researchNotes: "Kontraktor baru belum punya company profile",
      },
      "sales-1",
      "SALES"
    );

    assert.equal(createRes.success, true);
    assert.ok(createRes.prospect);
    assert.equal(createRes.prospect?.stage, "NEW");

    // 2. Kirim pesan WhatsApp pertama dari dashboard
    const sendRes = await sendWhatsAppMessage({
      whatsappNumber: testPhone,
      text: "Selamat siang Pak Hendra, salam kenal dari tim Fynux...",
      actorUserId: "sales-1",
      actorUserName: "Budi Santoso",
    });

    assert.equal(sendRes.success, true);
    assert.equal(sendRes.updatedStage, "CONTACTED");

    // 3. Verifikasi prospek di CRM terupdate
    const prospect = prospectsData.find((p) => p.id === createRes.prospect?.id);
    assert.ok(prospect);
    assert.equal(prospect?.stage, "CONTACTED");
    assert.equal(prospect?.nextAction, "WAITING_FOR_RESPONSE");
    assert.ok(prospect?.lastReachAt);
    assert.ok(prospect?.nextFollowUpDate); // Terjadwal FU1

    // 4. Verifikasi thread percakapan terisi pesan sales
    const cleanPhone = "6281299900011";
    const thread = conversationsData.find(
      (c) => c.whatsappNumber.replace(/\D/g, "") === cleanPhone
    );
    assert.ok(thread);
    assert.ok(thread?.messages.some((m) => m.sender === "SALES" && m.text.includes("Pak Hendra")));
  });

  test("automatically transitions CRM prospect to RESPONDED and halts cold follow-up on incoming message", async () => {
    const cleanPhone = "6281299900011";

    // Simulasikan balasan chat WhatsApp dari klien
    const incomingText = "Halo Mas Budi, terima kasih infonya. Boleh kirimkan portofolio dan penawaran harganya?";
    const incomingRes = await handleIncomingWhatsAppMessage(cleanPhone, incomingText);

    assert.equal(incomingRes.success, true);

    // Verifikasi prospek di CRM otomatis naik ke RESPONDED
    const prospect = prospectsData.find((p) => p.whatsappNumber === cleanPhone);
    assert.ok(prospect);
    assert.equal(prospect?.stage, "RESPONDED");
    assert.equal(prospect?.nextAction, "REPLY_TO_CLIENT");
    assert.equal(prospect?.nextFollowUpDate, undefined); // Spam follow-up terhenti!

    // Verifikasi pesan masuk tercatat di Inbox
    const thread = conversationsData.find(
      (c) => c.whatsappNumber.replace(/\D/g, "") === cleanPhone
    );
    assert.ok(thread);
    const lastMsg = thread?.messages[thread.messages.length - 1];
    assert.equal(lastMsg?.sender, "PROSPECT");
    assert.equal(lastMsg?.text, incomingText);
  });

  test("disconnects session properly", async () => {
    const session = await disconnectWhatsApp();
    assert.equal(session.status, "DISCONNECTED");
    assert.equal(session.phoneNumber, null);
  });
});
