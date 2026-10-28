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
import { createProspect, prospectsData, getProspectById } from "../src/modules/crm/crm.service";
import {
  conversationsData,
  getAllConversations,
  assignConversationToSales,
  updateConversationCRMDetails,
  getOrCreateConversationByProspect,
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
    assert.ok(convsAfter.some((c) => c.messages.length > 0));
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

  test("allows creating project in /projects and task to-do in /tasks from WhatsApp conversation", async () => {
    const { createProject, createTask, getAllProjects, getAllTasks } = await import(
      "../src/modules/projects/projects.service"
    );

    // 1. Tambah Project dari percakapan WhatsApp
    const projectRes = await createProject(
      {
        name: "Website Demo - PT Demo Klien",
        clientId: "client-demo-123",
        clientName: "PT Demo Klien",
        targetDeadline: "2026-11-05",
        scopeDescription: "Demo website landing page dari request chat WA.",
        assignedMemberIds: ["33333333-3333-3333-3333-333333333333"],
      },
      "22222222-2222-2222-2222-222222222222",
      "Budi Santoso (Sales 1)"
    );

    assert.equal(projectRes.success, true);
    assert.ok(projectRes.project);

    const allProjects = await getAllProjects();
    const createdProj = allProjects.find((p) => p.id === projectRes.project?.id);
    assert.ok(createdProj);
    assert.equal(createdProj.name, "Website Demo - PT Demo Klien");

    // 2. Tambah Task To Do dari percakapan WhatsApp
    const taskRes = await createTask(
      {
        title: "Buat demo website untuk PT Demo Klien",
        description: "Permintaan dari prospek via WhatsApp. Segera siapkan wireframe.",
        projectId: createdProj.id,
        primaryPicId: "33333333-3333-3333-3333-333333333333",
        priority: "HIGH",
        deadline: "2026-10-30",
      },
      "22222222-2222-2222-2222-222222222222",
      "Budi Santoso (Sales 1)"
    );

    assert.equal(taskRes.success, true);
    assert.ok(taskRes.task);

    const allTasks = await getAllTasks();
    const createdTask = allTasks.find((t) => t.id === taskRes.task?.id);
    assert.ok(createdTask);
    assert.equal(createdTask.title, "Buat demo website untuk PT Demo Klien");
    assert.equal(createdTask.projectId, createdProj.id);
    assert.equal(createdTask.priority, "HIGH");
  });

  test("tracks message delivery receipts: SENT (centang 1), DELIVERED (centang 2 abu-abu), and READ (centang 2 biru)", async () => {
    const { updateMessageStatus } = await import("../src/modules/inbox/inbox.service");
    const { simulateRecipientReadMessages, markConversationMessagesAsRead } = await import(
      "../src/modules/whatsapp/whatsapp.service"
    );

    const testPhone = "081255566677";
    // 1. Kirim pesan keluar baru dari sales
    const sendRes = await sendWhatsAppMessage({
      whatsappNumber: testPhone,
      text: "Halo Bapak, kami ingin follow up penawaran website yang kami kirimkan kemarin.",
      actorUserId: "sales-1",
      actorUserName: "Budi Santoso",
    });

    assert.equal(sendRes.success, true);
    assert.ok(sendRes.messageId);

    const cleanPhone = "6281255566677";
    const thread = conversationsData.find(
      (c) => c.whatsappNumber.replace(/\D/g, "") === cleanPhone
    );
    assert.ok(thread);

    const sentMsg = thread.messages.find((m) => m.id === sendRes.messageId);
    assert.ok(sentMsg);
    // Verifikasi pesan baru berstatus SENT (centang 1 abu-abu)
    assert.equal(sentMsg.status, "SENT");

    // 2. Simulasi update pengiriman dari WhatsApp server (DELIVERY_ACK / DELIVERED - centang 2 abu-abu)
    const delivered = updateMessageStatus(sendRes.messageId, "DELIVERED");
    assert.equal(delivered, true);
    assert.equal(sentMsg.status, "DELIVERED");

    // 3. Simulasi penerima membuka dan membaca pesan (READ - centang 2 biru)
    const readRes = await simulateRecipientReadMessages(thread.id);
    assert.equal(readRes.success, true);
    assert.ok(readRes.updatedCount >= 1);
    assert.equal(sentMsg.status, "READ");

    // 4. Kirim balasan dari klien -> verifikasi unreadCount bertambah dan read receipt
    const replyRes = await handleIncomingWhatsAppMessage(cleanPhone, "Iya Mas Budi, sudah kami baca.");
    assert.equal(replyRes.success, true);
    assert.ok(thread.unreadCount >= 1);

    // Tandai dibaca oleh sales operator
    const markReadRes = await markConversationMessagesAsRead(thread.id);
    assert.equal(markReadRes.success, true);
    assert.equal(thread.unreadCount, 0);
  });

  test("synchronizes tags, research notes, pain points, and industry between WhatsApp inbox and CRM", async () => {
    // 1. Buat prospek baru di CRM
    const testPhone = "081299900088";
    const createRes = await createProspect(
      {
        companyName: "PT Sinar Baja Mandiri",
        contactName: "Ibu Ratna",
        whatsappNumber: testPhone,
        industry: "Distributor Besi & Baja",
        painPoints: "Sistem katalog masih manual PDF via WA",
        researchNotes: "Butuh web katalog dengan order WA langsung",
        tags: ["Prospek Baru"],
      },
      "sales-1",
      "SALES"
    );

    assert.equal(createRes.success, true);
    assert.ok(createRes.prospect);

    // 2. Dapatkan percakapan yang tersinkronisasi di inbox
    const thread = await getOrCreateConversationByProspect(createRes.prospect!);
    assert.ok(thread);
    assert.deepEqual(thread.tags, ["Prospek Baru"]);

    // 3. Update tags dan field riset CRM langsung dari WhatsApp inbox drawer
    const updateRes = await updateConversationCRMDetails(thread.id, {
      tags: ["Hot Lead", "Website Demo", "Prioritas"],
      industry: "Manufaktur & Fabrikasi Baja",
      painPoints: "Katalog manual, sering terlambat respon harga tender",
      researchNotes: "Ibu Ratna setuju dibuatkan demo prototipe web dalam 2 hari",
    });

    assert.equal(updateRes.success, true);
    assert.ok(updateRes.conversation);
    assert.deepEqual(updateRes.conversation.tags, ["Hot Lead", "Website Demo", "Prioritas"]);
    assert.equal(
      updateRes.conversation.researchNotes,
      "Ibu Ratna setuju dibuatkan demo prototipe web dalam 2 hari"
    );

    // 4. Pastikan data CRM juga ter-update secara otomatis
    const crmProspect = prospectsData.find((p) => p.id === createRes.prospect?.id);
    assert.ok(crmProspect);
    assert.deepEqual(crmProspect.tags, ["Hot Lead", "Website Demo", "Prioritas"]);
    assert.equal(crmProspect.industry, "Manufaktur & Fabrikasi Baja");
    assert.equal(
      crmProspect.painPoints,
      "Katalog manual, sering terlambat respon harga tender"
    );
    assert.equal(
      crmProspect.researchNotes,
      "Ibu Ratna setuju dibuatkan demo prototipe web dalam 2 hari"
    );
  });

  test("allows DEVELOPER role full functional and feature access to WhatsApp inbox", async () => {
    const devUserId = "33333333-3333-3333-3333-333333333333";
    const devName = "Eko Pratama (Developer)";

    // 1. Buat prospek oleh Developer
    const testPhone = "081299900099";
    const createRes = await createProspect(
      {
        companyName: "PT Global Tech Solusindo",
        contactName: "Pak Agus",
        whatsappNumber: testPhone,
        industry: "IT & Software Services",
        painPoints: "Butuh bantuan integrasi custom API",
        researchNotes: "Developer handling technical discovery",
        tags: ["Technical Lead"],
      },
      devUserId,
      "DEVELOPER"
    );

    assert.equal(createRes.success, true);
    assert.ok(createRes.prospect);
    assert.equal(createRes.prospect.assignedSalesId, devUserId);
    assert.equal(createRes.prospect.assignedSalesName, devName);

    // 2. Buka obrolan di Inbox sebagai Developer
    const thread = await getOrCreateConversationByProspect(createRes.prospect!);
    assert.ok(thread);
    assert.equal(thread.assignedSalesId, devUserId);
    assert.equal(thread.assignedSalesName, devName);

    // 3. Developer dapat mengirim pesan di obrolan
    const sendRes = await sendWhatsAppMessage({
      whatsappNumber: testPhone,
      text: "Halo Pak Agus, saya Eko dari tim technical dev Fynux. Kami siap bantu integrasi API.",
      actorUserId: devUserId,
      actorUserName: devName,
    });
    assert.equal(sendRes.success, true);

    const updatedConvs = await getAllConversations();
    const myDevChats = updatedConvs.filter((c) => c.assignedSalesId === devUserId);
    assert.ok(myDevChats.length > 0);
    assert.ok(myDevChats.some((c) => c.id === thread.id));

    // 4. Developer dapat mengupdate tags dan riset bisnis CRM dari Inbox
    const updateRes = await updateConversationCRMDetails(
      thread.id,
      {
        tags: ["Technical Lead", "API Integration", "High Priority"],
        researchNotes: "Spesifikasi arsitektur API telah disepakati",
      },
      devUserId,
      devName
    );
    assert.equal(updateRes.success, true);
    assert.deepEqual(updateRes.conversation?.tags, [
      "Technical Lead",
      "API Integration",
      "High Priority",
    ]);
  });

  test("fetches and synchronizes WhatsApp contact avatar picture and bio status with CRM", async () => {
    const testPhone = "081288899911";
    const prospectRes = await createProspect(
      {
        companyName: "PT Avatar Mandiri",
        contactName: "Bambang Wijaya",
        whatsappNumber: testPhone,
      },
      "sales-1",
      "SALES"
    );
    assert.equal(prospectRes.success, true);
    const prospect = prospectRes.prospect!;

    // Buat/ambil thread inbox
    const thread = await getOrCreateConversationByProspect(prospect);
    assert.ok(thread);

    // Update avatarUrl & bio pada conversation
    const mockAvatar = "/api/whatsapp/media/avatar-6281288899911.jpg";
    const mockBio = "Available | CEO at PT Avatar Mandiri";
    const updateRes = await updateConversationCRMDetails(
      thread.id,
      {
        avatarUrl: mockAvatar,
        bio: mockBio,
      },
      "sales-1",
      "Budi Santoso"
    );

    assert.equal(updateRes.success, true);
    assert.equal(updateRes.conversation?.avatarUrl, mockAvatar);
    assert.equal(updateRes.conversation?.bio, mockBio);

    // Verifikasi sync ke prospek CRM
    const updatedProspect = await getProspectById(prospect.id);
    assert.ok(updatedProspect);
    assert.equal(updatedProspect?.avatarUrl, mockAvatar);
    assert.equal(updatedProspect?.bio, mockBio);
  });
});
