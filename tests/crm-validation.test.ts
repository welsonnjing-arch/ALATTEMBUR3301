import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { normalizeWhatsAppNumber } from "../src/modules/crm/types";
import { createProspect } from "../src/modules/crm/crm.service";

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

  test("rejects prospect creation if researchNotes is empty (Mandatory Research Rule)", async () => {
    const res = await createProspect(
      {
        companyName: "PT Test Tanpa Riset",
        contactName: "Budi",
        whatsappNumber: "081234567899",
        researchNotes: "   ", // Only whitespace
      },
      "sales-user-id",
      "SALES"
    );

    assert.equal(res.success, false);
    assert.ok(res.error?.includes("riset"));
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
});
