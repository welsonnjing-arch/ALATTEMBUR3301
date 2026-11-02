import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  generateThreeNumbers,
  createPendingRegistration,
  getPendingRegistrationsForOwner,
  verifyRegistrationNumber,
  loadPendingRegistrations,
  savePendingRegistrations,
} from "../src/modules/auth/registration.service";
import {
  getUserByEmail,
  getAllUsers,
  getDefaultPermissionsForRole,
  deleteUser,
} from "../src/modules/auth/user.service";

describe("Google Auth 3-Number Registration & Developer CRM Access", () => {
  const originalPending = loadPendingRegistrations();
  const testEmail = `test.dev.${Date.now()}@fynux.co`;

  after(() => {
    // Restore pending registrations
    savePendingRegistrations(originalPending);

    // Clean up created test user if any
    const created = getUserByEmail(testEmail);
    if (created) {
      deleteUser(created.id, "TEST");
    }
  });

  it("generateThreeNumbers produces exactly 3 distinct 2-digit numbers with correctNumber included", () => {
    for (let i = 0; i < 10; i++) {
      const { options, correctNumber } = generateThreeNumbers();
      assert.equal(options.length, 3);
      assert.equal(new Set(options).size, 3, "All 3 numbers must be unique");
      assert.ok(
        options.includes(correctNumber),
        "correctNumber must be one of the 3 options"
      );
      for (const num of options) {
        assert.ok(num >= 10 && num <= 99, "Numbers must be 2-digit");
      }
    }
  });

  it("creates pending registration and returns 3 options without exposing correctNumber", () => {
    const res = createPendingRegistration({
      fullName: "Budi Developer",
      email: testEmail,
      password: "password123",
      role: "DEVELOPER",
    });

    assert.ok(res.registrationId.startsWith("reg-"));
    assert.equal(res.options.length, 3);
    assert.equal(new Set(res.options).size, 3);

    // Verify stored registration
    const all = loadPendingRegistrations();
    const stored = all.find((r) => r.id === res.registrationId);
    assert.ok(stored);
    assert.equal(stored.email, testEmail);
    assert.equal(stored.role, "DEVELOPER");
    assert.equal(stored.status, "PENDING");
    assert.ok(stored.options.includes(stored.correctNumber));
  });

  it("owner view retrieves pending registration including secret correctNumber", () => {
    const ownerList = getPendingRegistrationsForOwner();
    const target = ownerList.find((r) => r.email === testEmail);
    assert.ok(target, "Owner must see the pending registration");
    assert.ok(typeof target.correctNumber === "number");
    assert.ok(target.options.includes(target.correctNumber));
  });

  it("rejects verification when candidate selects wrong number", () => {
    const all = loadPendingRegistrations();
    const stored = all.find((r) => r.email === testEmail);
    assert.ok(stored);

    // Pick a number that is NOT correctNumber
    const wrongNumber = stored.options.find((n) => n !== stored.correctNumber)!;
    const res = verifyRegistrationNumber(stored.id, wrongNumber);

    assert.equal(res.success, false);
    assert.ok(res.error?.includes("salah"));

    // User should not yet exist in users.json
    assert.equal(getUserByEmail(testEmail), undefined);
  });

  it("successfully approves registration and creates active user when correct number is chosen", () => {
    const all = loadPendingRegistrations();
    const stored = all.find((r) => r.email === testEmail);
    assert.ok(stored);

    const res = verifyRegistrationNumber(stored.id, stored.correctNumber);
    assert.equal(res.success, true);
    assert.ok(res.user);
    assert.equal(res.user.email, testEmail);
    assert.equal(res.user.role, "DEVELOPER");
    assert.equal(res.user.status, "ACTIVE");

    // Verify user is persisted in users.json
    const createdUser = getUserByEmail(testEmail);
    assert.ok(createdUser);
    assert.equal(createdUser.fullName, "Budi Developer");
    assert.equal(createdUser.role, "DEVELOPER");
    assert.equal(createdUser.status, "ACTIVE");
  });

  it("DEVELOPER role has default permission to view CRM (crm.view_all)", () => {
    const devPermissions = getDefaultPermissionsForRole("DEVELOPER");
    assert.ok(
      devPermissions.includes("crm.view_all"),
      "DEVELOPER role must have crm.view_all permission"
    );
  });
});
