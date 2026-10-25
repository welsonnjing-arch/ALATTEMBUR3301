import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { normalizeWhatsAppNumber } from "../src/modules/crm/types";
import { createProspect, bulkCreateProspects } from "../src/modules/crm/crm.service";

describe("CRM Data Validation & Normalization Rules", () => {
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
    const bulkRows = [
      {
        companyName: "Klinik Sehat Prima",
        contactName: "dr. Andi",
        whatsappNumber: "087711223344",
        industry: "Healthcare",
        website: "https://kliniksehatprima.com",
        potentialServices: "Web Appointment System",
        researchNotes: "Pasien booking via manual chat WA sering antri",
        painPoints: "Sistem reservasi manual",
      },
      {
        companyName: "Toko Sparepart Jaya",
        // contactName omitted -> should fallback to companyName
        whatsappNumber: "6287755667788",
        // researchNotes omitted -> should fallback to default
      },
      {
        companyName: "PT Nomor Duplikat Batch",
        whatsappNumber: "087711223344", // Duplicate of 1st row
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
    assert.equal(first?.whatsappNumber, "6287711223344");
    assert.equal(first?.stage, "NEW");
    assert.equal(first?.potentialServices, "Web Appointment System");

    const second = result.prospects.find((p) => p.companyName === "Toko Sparepart Jaya");
    assert.ok(second);
    assert.equal(second?.contactName, "Toko Sparepart Jaya");
    assert.equal(second?.researchNotes, "Di-import dari Excel/CSV");
  });
});
