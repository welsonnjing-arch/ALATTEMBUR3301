import { test, describe, after, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { normalizeWhatsAppNumber } from "../src/modules/crm/types";
import { createUser, deleteUser } from "../src/modules/auth/user.service";
import {
  createProspect,
  bulkCreateProspects,
  deleteProspect,
  bulkDeleteProspects,
  bulkDistributeProspects,
  getAvailableSalesUsers,
  getProspectById,
  prospectsData,
  persistProspects,
} from "../src/modules/crm/crm.service";

describe("CRM Data Validation & Normalization Rules", () => {
  const DATA_DIR = path.join(process.cwd(), "data");
  const PROSPECTS_FILE = path.join(DATA_DIR, "crm-prospects.json");
  let backupContent: string | null = null;

  before(() => {
    if (fs.existsSync(PROSPECTS_FILE)) {
      backupContent = fs.readFileSync(PROSPECTS_FILE, "utf-8");
    }
  });
  test("normalizes local 08xxx to international standard 628xxx", () => {
    const res = normalizeWhatsAppNumber("0895324069850");
    assert.equal(res.isValid, true);
    assert.equal(res.formatted, "62895324069850");
  });

  test("normalizes +628xxx correctly", () => {
    const res = normalizeWhatsAppNumber("+6281234567890");
    assert.equal(res.isValid, true);
    assert.equal(res.formatted, "6281234567890");
  });

  test("leaves valid 628xxx untouched", () => {
    const res = normalizeWhatsAppNumber("6281234567890");
    assert.equal(res.isValid, true);
    assert.equal(res.formatted, "6281234567890");
  });

  test("identifies invalid/too short phone numbers", () => {
    const res = normalizeWhatsAppNumber("123");
    assert.equal(res.isValid, false);
  });

  test("allows prospect creation even if researchNotes is omitted or empty (optional field rule)", async () => {
    const res = await createProspect(
      {
        companyName: "PT Test Tanpa Riset Wajib",
        contactName: "Budi",
        whatsappNumber: "081234567899",
        researchNotes: "   ", // Only whitespace or empty
      },
      "sales-user-id",
      "SALES"
    );

    assert.equal(res.success, true);
    assert.ok(res.prospect);
    assert.equal(res.prospect?.researchNotes, "Belum ada catatan riset");
  });

  test("successfully creates prospect when researchNotes is provided", async () => {
    const res = await createProspect(
      {
        companyName: "PT Maju Terus Konstruksi",
        contactName: "Ir. Hendro",
        whatsappNumber: "081999888777",
        researchNotes: "Website lama lambat dan belum mobile responsive, butuh web profil modern.",
      },
      "sales-user-id",
      "SALES"
    );

    assert.equal(res.success, true);
    assert.ok(res.prospect);
    assert.equal(res.prospect?.whatsappNumber, "6281999888777");
  });

  test("bulkCreateProspects processes multiple rows, normalizes numbers, skips duplicates, and assigns defaults", async () => {
    const uniqueSuffix1 = Math.floor(100000 + Math.random() * 900000).toString();
    const uniqueSuffix2 = Math.floor(100000 + Math.random() * 900000).toString();
    const phone1 = `0877${uniqueSuffix1}`;
    const phone2 = `62877${uniqueSuffix2}`;

    const bulkRows = [
      {
        companyName: "Klinik Sehat Prima",
        contactName: "dr. Andi",
        whatsappNumber: phone1,
        industry: "Healthcare",
        website: "https://kliniksehatprima.com",
        potentialServices: "Web Appointment System",
        researchNotes: "Pasien booking via manual chat WA sering antri",
        painPoints: "Sistem reservasi manual",
      },
      {
        companyName: "Toko Sparepart Jaya",
        // contactName omitted -> should fallback to companyName
        whatsappNumber: phone2,
        // researchNotes omitted -> should fallback to default
      },
      {
        companyName: "PT Nomor Duplikat Batch",
        whatsappNumber: phone1, // Duplicate of 1st row
      },
      {
        companyName: "Perusahaan Invalid No",
        whatsappNumber: "9999", // Invalid format
      },
    ];

    const result = await bulkCreateProspects(bulkRows, "tester-user", "ADMIN");

    assert.equal(result.success, true);
    assert.equal(result.importedCount, 2); // 1st and 2nd valid
    assert.equal(result.skippedCount, 2); // duplicate and invalid
    assert.equal(result.errors.length, 2);

    const first = result.prospects.find((p) => p.companyName === "Klinik Sehat Prima");
    assert.ok(first);
    assert.equal(first?.whatsappNumber, `62877${uniqueSuffix1}`);
    assert.equal(first?.stage, "NEW");
    assert.equal(first?.potentialServices, "Web Appointment System");

    const second = result.prospects.find((p) => p.companyName === "Toko Sparepart Jaya");
    assert.ok(second);
    assert.equal(second?.contactName, "Toko Sparepart Jaya");
    assert.equal(second?.researchNotes, "Di-import dari Excel/CSV");

    // Clean up imported test prospects so data store remains clean
    await bulkDeleteProspects(
      result.prospects.map((p) => p.id),
      "tester-user",
      "OWNER"
    );
  });

  test("deletes a prospect successfully and removes it from CRM records", async () => {
    // 1. Buat prospek uji coba
    const createRes = await createProspect(
      {
        companyName: "PT Hapus Data Test",
        contactName: "Bpk Agus",
        whatsappNumber: "081877665544",
        researchNotes: "Kontak untuk pengujian fitur hapus",
      },
      "owner-user-id",
      "OWNER"
    );

    assert.equal(createRes.success, true);
    assert.ok(createRes.prospect);
    const targetId = createRes.prospect.id;

    // 2. Verifikasi ada di CRM
    const existsBefore = await getProspectById(targetId);
    assert.ok(existsBefore);

    // 3. Hapus prospek
    const deleteRes = await deleteProspect(targetId, "owner-user-id", "OWNER");
    assert.equal(deleteRes.success, true);

    // 4. Verifikasi sudah tidak ada di CRM
    const existsAfter = await getProspectById(targetId);
    assert.equal(existsAfter, null);
  });

  test("bulk deletes multiple selected prospects successfully", async () => {
    // 1. Buat 2 prospek untuk bulk delete
    const p1 = await createProspect(
      {
        companyName: "PT Bulk Delete 1",
        whatsappNumber: "081900112233",
      },
      "owner-user-id",
      "OWNER"
    );
    const p2 = await createProspect(
      {
        companyName: "PT Bulk Delete 2",
        whatsappNumber: "081900112234",
      },
      "owner-user-id",
      "OWNER"
    );

    assert.ok(p1.prospect);
    assert.ok(p2.prospect);

    // 2. Hapus secara massal
    const bulkRes = await bulkDeleteProspects(
      [p1.prospect.id, p2.prospect.id],
      "owner-user-id",
      "OWNER"
    );

    assert.equal(bulkRes.success, true);
    assert.equal(bulkRes.deletedCount, 2);

    // 3. Verifikasi keduanya sudah terhapus
    assert.equal(await getProspectById(p1.prospect.id), null);
    assert.equal(await getProspectById(p2.prospect.id), null);
  });

  test("bulkCreateProspects divides imported contacts evenly across selected sales agents in Round-Robin mode", async () => {
    const salesList = getAvailableSalesUsers();
    assert.ok(salesList.length >= 2, "Harus ada minimal 2 sales untuk pengujian round-robin");

    // Ambil 3 sales pertama
    const targetSales = salesList.slice(0, 3);
    const targetSalesIds = targetSales.map((s) => s.id);

    // Siapkan 6 kontak untuk diimpor
    const inputs = [
      { companyName: "Bisnis RR 1", whatsappNumber: "081211110001" },
      { companyName: "Bisnis RR 2", whatsappNumber: "081211110002" },
      { companyName: "Bisnis RR 3", whatsappNumber: "081211110003" },
      { companyName: "Bisnis RR 4", whatsappNumber: "081211110004" },
      { companyName: "Bisnis RR 5", whatsappNumber: "081211110005" },
      { companyName: "Bisnis RR 6", whatsappNumber: "081211110006" },
    ];

    const result = await bulkCreateProspects(
      inputs,
      "owner-user-id",
      "OWNER",
      {
        mode: "ROUND_ROBIN",
        targetSalesIds,
      }
    );

    assert.equal(result.success, true);
    assert.equal(result.importedCount, 6);

    // Hitung perolehan masing-masing sales
    const countPerSales: Record<string, number> = {};
    for (const p of result.prospects) {
      assert.ok(p.assignedSalesId);
      assert.ok(targetSalesIds.includes(p.assignedSalesId!));
      countPerSales[p.assignedSalesId!] = (countPerSales[p.assignedSalesId!] || 0) + 1;
    }

    // 6 kontak dibagi 3 sales = masing-masing tepat 2 kontak
    for (const sId of targetSalesIds) {
      assert.equal(countPerSales[sId], 2);
    }
  });

  test("bulkDistributeProspects redistributes selected prospects evenly to target sales", async () => {
    // 1. Buat 4 prospek awal milik Owner
    const p1 = await createProspect({ companyName: "Dist 1", whatsappNumber: "081222220001" }, "owner-id", "OWNER");
    const p2 = await createProspect({ companyName: "Dist 2", whatsappNumber: "081222220002" }, "owner-id", "OWNER");
    const p3 = await createProspect({ companyName: "Dist 3", whatsappNumber: "081222220003" }, "owner-id", "OWNER");
    const p4 = await createProspect({ companyName: "Dist 4", whatsappNumber: "081222220004" }, "owner-id", "OWNER");

    const prospectIds = [p1.prospect!.id, p2.prospect!.id, p3.prospect!.id, p4.prospect!.id];

    const salesList = getAvailableSalesUsers().slice(0, 2);
    const targetSalesIds = salesList.map((s) => s.id);

    // 2. Lakukan distribusi massal (4 kontak dibagi 2 sales = masing-masing 2 kontak)
    const distResult = await bulkDistributeProspects(
      prospectIds,
      targetSalesIds,
      "owner-id",
      "OWNER"
    );

    assert.equal(distResult.success, true);
    assert.equal(distResult.updatedCount, 4);
    assert.ok(distResult.updatedProspects && distResult.updatedProspects.length === 4);
    assert.equal(distResult.distributionSummary?.[targetSalesIds[0]], 2);
    assert.equal(distResult.distributionSummary?.[targetSalesIds[1]], 2);

    // 3. Verifikasi pada data prospek di CRM dan disk persistence
    const updatedP1 = await getProspectById(prospectIds[0]);
    const updatedP2 = await getProspectById(prospectIds[1]);
    assert.ok(updatedP1?.assignedSalesId === targetSalesIds[0] || updatedP1?.assignedSalesId === targetSalesIds[1]);
    assert.ok(updatedP2?.assignedSalesId === targetSalesIds[0] || updatedP2?.assignedSalesId === targetSalesIds[1]);

    // Verifikasi disk persistence langsung dari file JSON
    const diskContent = JSON.parse(fs.readFileSync(PROSPECTS_FILE, "utf-8"));
    const diskP1 = diskContent.find((p: any) => p.id === prospectIds[0]);
    assert.ok(diskP1 && diskP1.assignedSalesId);
  });

  test("includes Developer with canHandleSales: true in getAvailableSalesUsers and Round-Robin CRM distribution", async () => {
    const timestamp = Date.now();
    // 1. Buat 1 Developer murni (canHandleSales: false) dan 1 Developer Hybrid (canHandleSales: true)
    const pureDev = createUser({
      fullName: "Pure Coder",
      email: `pure.coder.${timestamp}@fynux.com`,
      role: "DEVELOPER",
      password: "passwordPure123",
      canHandleSales: false,
    });

    const hybridDev = createUser({
      fullName: "Hybrid Dev",
      email: `hybrid.dev.${timestamp}@fynux.com`,
      role: "DEVELOPER",
      password: "passwordHybrid123",
      canHandleSales: true,
    });

    try {
      // 2. Periksa list sales users
      const salesList = getAvailableSalesUsers();
      const foundPureDev = salesList.find((s) => s.id === pureDev.id);
      const foundHybridDev = salesList.find((s) => s.id === hybridDev.id);

      assert.equal(foundPureDev, undefined, "Pure Developer tidak boleh masuk ke daftar sales CRM");
      assert.ok(foundHybridDev, "Hybrid Developer harus masuk ke daftar sales CRM");
      assert.equal(foundHybridDev?.fullName, "Hybrid Dev (Dev/Marketing)");
      assert.equal(foundHybridDev?.role, "DEVELOPER");

      // 3. Uji distribusi Round-Robin yang melibatkan Hybrid Developer
      const testInputs = [
        { companyName: "Klien Hybrid 1", whatsappNumber: "081911223341" },
        { companyName: "Klien Hybrid 2", whatsappNumber: "081911223342" },
      ];

      const distResult = await bulkCreateProspects(
        testInputs,
        "owner-user-id",
        "OWNER",
        {
          mode: "ROUND_ROBIN",
          targetSalesIds: [hybridDev.id],
        }
      );

      assert.equal(distResult.success, true);
      assert.equal(distResult.importedCount, 2);
      assert.equal(distResult.prospects[0].assignedSalesId, hybridDev.id);
      assert.equal(distResult.prospects[1].assignedSalesId, hybridDev.id);
    } finally {
      try {
        deleteUser(pureDev.id);
      } catch {}
      try {
        deleteUser(hybridDev.id);
      } catch {}
    }
  });

  after(() => {
    if (backupContent !== null) {
      fs.writeFileSync(PROSPECTS_FILE, backupContent, "utf-8");
      try {
        const parsed = JSON.parse(backupContent);
        prospectsData.length = 0;
        prospectsData.push(...parsed);
      } catch {}
    }
  });
});
