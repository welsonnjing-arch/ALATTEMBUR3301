import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  createClient,
  createMaintenanceContract,
  createWarranty,
  getAllWarranties,
} from "../src/modules/client-lifecycle/client-lifecycle.service";

describe("Client Lifecycle & Warranty Engine Rules", () => {
  test("creates a client with normalized phone number", async () => {
    const res = await createClient(
      {
        name: "CV Berkah Abadi",
        picName: "Ahmad Dahlan",
        picPhone: "085712345678",
        industry: "Retail",
      },
      "actor-owner-id"
    );

    assert.equal(res.success, true);
    assert.equal(res.client?.picPhone, "6285712345678");
    assert.equal(res.client?.status, "ACTIVE");
  });

  test("creates warranty with correct default duration per tier (Basic: 3 bln, Business: 6 bln, Enterprise: 12 bln)", async () => {
    const resBasic = await createWarranty(
      {
        clientId: "p-001",
        projectId: "proj-001",
        tier: "BASIC",
        startDate: "2026-10-01",
      },
      "actor-owner-id"
    );
    assert.equal(resBasic.success, true);
    assert.equal(resBasic.warranty?.durationMonths, 3);
    assert.equal(resBasic.warranty?.endDate, "2027-01-01");

    const resBusiness = await createWarranty(
      {
        clientId: "p-002",
        projectId: "proj-002",
        tier: "BUSINESS",
        startDate: "2026-10-01",
      },
      "actor-owner-id"
    );
    assert.equal(resBusiness.success, true);
    assert.equal(resBusiness.warranty?.durationMonths, 6);
    assert.equal(resBusiness.warranty?.endDate, "2027-04-01");

    const resEnterprise = await createWarranty(
      {
        clientId: "p-003",
        projectId: "proj-003",
        tier: "ENTERPRISE",
        startDate: "2026-10-01",
      },
      "actor-owner-id"
    );
    assert.equal(resEnterprise.success, true);
    assert.equal(resEnterprise.warranty?.durationMonths, 12);
    assert.equal(resEnterprise.warranty?.endDate, "2027-10-01");
  });

  test("generates maintenance contract with format MNC-YYYYMM-XXXX", async () => {
    const res = await createMaintenanceContract(
      {
        clientId: "p-001",
        billingType: "MONTHLY",
        price: 98000,
        startDate: "2026-11-01",
        durationMonths: 6,
      },
      "actor-owner-id"
    );

    assert.equal(res.success, true);
    assert.ok(res.contract?.contractNumber.startsWith("MNC-"));
    assert.equal(res.contract?.billingType, "MONTHLY");
    assert.equal(res.contract?.price, 98000);
  });
});
