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
import {
  conversationsData,
  getAllConversations,
  assignConversationToSales,
} from "../src/modules/inbox/inbox.service";

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

  test("preserves conversations and chat history on disk even when WhatsApp disconnects", async () => {
    // 1. Pastikan percakapan tersimpan
    const convsBefore = await getAllConversations();
    assert.ok(convsBefore.length > 0);
    const prevCount = convsBefore.length;

    // 2. Putuskan WhatsApp (disconnect)
    const session = await disconnectWhatsApp();
    assert.equal(session.status, "DISCONNECTED");
    assert.equal(session.phoneNumber, null);

    // 3. Verifikasi percakapan TIDAK HILANG (tersimpan permanen di disk)
    const convsAfter = await getAllConversations();
    assert.equal(convsAfter.length, prevCount);
    assert.ok(convsAfter[0].messages.length > 0);
  });

  test("multi-agent shared inbox: assigns leads and filters Chat Saya without mixing up between sales", async () => {
    const sales1Id = "22222222-2222-2222-2222-222222222222";
    const sales2Id = "44444444-4444-4444-4444-444444444444";

    const allConvs = await getAllConversations();
    if (allConvs.length >= 2) {
      await assignConversationToSales(allConvs[0].id, sales1Id, "Budi Santoso (Sales 1)");
      await assignConversationToSales(allConvs[1].id, sales2Id, "Siti Rahma (Sales 2)");
    }

    const updatedConvs = await getAllConversations();

    // Filter Chat Saya untuk Sales 1
    const sales1Chats = updatedConvs.filter((c) => c.assignedSalesId === sales1Id);
    // Filter Chat Saya untuk Sales 2
    const sales2Chats = updatedConvs.filter((c) => c.assignedSalesId === sales2Id);

    assert.ok(sales1Chats.length > 0);
    assert.ok(sales2Chats.length > 0);

    // Pastikan tidak ada chat Sales 1 yang tercampur di chat Sales 2
    const overlap = sales1Chats.some((c1) => sales2Chats.some((c2) => c2.id === c1.id));
    assert.equal(overlap, false);
  });

  test("reassigns conversation to another sales agent and synchronizes CRM prospect", async () => {
    const allConvs = await getAllConversations();
    const targetConv = allConvs[0];
    assert.ok(targetConv);

    const newSalesId = "77777777-7777-7777-7777-777777777777";
    const newSalesName = "Rian Hidayat (Sales 5)";

    const assignRes = await assignConversationToSales(targetConv.id, newSalesId, newSalesName);
    assert.equal(assignRes.success, true);
    assert.equal(assignRes.thread?.assignedSalesId, newSalesId);
    assert.equal(assignRes.thread?.assignedSalesName, newSalesName);

    // Pastikan prospek CRM juga tersinkronisasi jika terhubung
    if (targetConv.prospectId) {
      const prospect = prospectsData.find((p) => p.id === targetConv.prospectId);
      if (prospect) {
        assert.equal(prospect.assignedSalesId, newSalesId);
        assert.equal(prospect.assignedSalesName, newSalesName);
      }
    }
  });

  test("supports sending and receiving media attachments (images/documents) in conversations", async () => {
    const testPhone = "081299900011";

    // 1. Kirim pesan dengan lampiran dokumen PDF
    const dummyPdfBase64 = Buffer.from("%PDF-1.4 mock content").toString("base64");
    const sendWithDoc = await sendWhatsAppMessage({
      whatsappNumber: testPhone,
      text: "Berikut kami lampirkan proposal paket Business Website.",
      actorUserId: "sales-1",
      actorUserName: "Budi Santoso",
      attachment: {
        fileName: "Proposal-Business-Website.pdf",
        fileSize: "1.2 MB",
        mimeType: "application/pdf",
        base64Data: dummyPdfBase64,
      },
    });

    assert.equal(sendWithDoc.success, true);

    const thread = conversationsData.find(
      (c) => c.whatsappNumber.replace(/\D/g, "") === "6281299900011"
    );
    assert.ok(thread);
    const lastMsg = thread.messages[thread.messages.length - 1];
    assert.ok(lastMsg.attachment);
    assert.equal(lastMsg.attachment?.fileName, "Proposal-Business-Website.pdf");
    assert.equal(lastMsg.attachment?.mimeType, "application/pdf");
    assert.ok(lastMsg.attachment?.url?.startsWith("/api/whatsapp/media/"));

    // 2. Terima pesan masuk dengan lampiran gambar
    const incomingRes = await handleIncomingWhatsAppMessage(
      "6281299900011",
      "Ini contoh logo perusahaan kami",
      undefined,
      {
        fileName: "logo-perusahaan.png",
        fileSize: "240 KB",
        mimeType: "image/png",
        url: "/api/whatsapp/media/mock-logo.png",
      }
    );

    assert.equal(incomingRes.success, true);
    const clientMsg = thread.messages[thread.messages.length - 1];
    assert.equal(clientMsg.sender, "PROSPECT");
    assert.ok(clientMsg.attachment);
    assert.equal(clientMsg.attachment?.fileName, "logo-perusahaan.png");
    assert.equal(clientMsg.attachment?.mimeType, "image/png");
  });
});
