import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  authenticateUser,
  createUser,
  deleteUser,
  getAllUsers,
  getUserByEmail,
  getUserById,
  hasAnyUsers,
  hasOwnerUser,
  saveUsers,
  updateUser,
} from "../src/modules/auth/user.service";
import { generateSalt, hashPassword, verifyPassword } from "../src/modules/auth/crypto";

describe("User Authentication & Team Management Engine", () => {
  const DATA_DIR = path.join(process.cwd(), "data");
  const USERS_FILE = path.join(DATA_DIR, "users.json");
  let backupContent: string | null = null;

  before(() => {
    if (fs.existsSync(USERS_FILE)) {
      backupContent = fs.readFileSync(USERS_FILE, "utf-8");
    }
    // Set environment test storage clean
    saveUsers([]);
  });

  after(() => {
    if (backupContent !== null) {
      fs.writeFileSync(USERS_FILE, backupContent, "utf-8");
    } else if (fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), "utf-8");
    }
  });

  test("hashes password with PBKDF2 salt and verifies securely", () => {
    const salt = generateSalt();
    assert.equal(salt.length, 32); // 16 bytes in hex

    const hash1 = hashPassword("rahasia123", salt);
    assert.ok(hash1.length > 0);

    // Correct password matches
    assert.equal(verifyPassword("rahasia123", salt, hash1), true);

    // Wrong password fails
    assert.equal(verifyPassword("salah_password", salt, hash1), false);
  });

  test("creates owner account and confirms owner existence", () => {
    const owner = createUser({
      fullName: "Owner Asli Fynux",
      email: "owner.real@fynux.com",
      role: "OWNER",
      password: "passwordOwner123",
    });

    assert.ok(owner.id);
    assert.equal(owner.email, "owner.real@fynux.com");
    assert.equal(owner.role, "OWNER");
    assert.equal(owner.status, "ACTIVE");
    assert.ok(owner.permissions.includes("settings.manage"));

    assert.equal(hasOwnerUser(), true);
    assert.equal(hasAnyUsers(), true);
  });

  test("prevents creating user with duplicate email or weak password", () => {
    assert.throws(
      () => {
        createUser({
          fullName: "Duplikat Owner",
          email: "owner.real@fynux.com",
          role: "SALES",
          password: "password123",
        });
      },
      /sudah terdaftar/
    );

    assert.throws(
      () => {
        createUser({
          fullName: "User Pendek",
          email: "short@fynux.com",
          role: "SALES",
          password: "123",
        });
      },
      /minimal harus 6 karakter/
    );
  });

  test("authenticates valid credentials and rejects invalid or inactive accounts", () => {
    // 1. Success login
    const loginOk = authenticateUser("owner.real@fynux.com", "passwordOwner123");
    assert.equal(loginOk.success, true);
    assert.equal(loginOk.user?.email, "owner.real@fynux.com");
    assert.equal(loginOk.user?.role, "OWNER");

    // 2. Wrong password
    const loginWrongPass = authenticateUser("owner.real@fynux.com", "wrongpassword");
    assert.equal(loginWrongPass.success, false);

    // 3. Unknown email
    const loginUnknown = authenticateUser("unknown@fynux.com", "password123");
    assert.equal(loginUnknown.success, false);

    // 4. Create sales, deactivate, and verify blocked
    const sales = createUser({
      fullName: "Sales Lapangan",
      email: "sales.lap@fynux.com",
      role: "SALES",
      password: "passwordSales123",
    });

    const activeLogin = authenticateUser("sales.lap@fynux.com", "passwordSales123");
    assert.equal(activeLogin.success, true);

    // Nonaktifkan sales
    updateUser(sales.id, { status: "INACTIVE" });
    const blockedLogin = authenticateUser("sales.lap@fynux.com", "passwordSales123");
    assert.equal(blockedLogin.success, false);
    assert.match(blockedLogin.error || "", /dinonaktifkan/);
  });

  test("prevents deleting the sole owner of the system", () => {
    const owner = getUserByEmail("owner.real@fynux.com");
    assert.ok(owner);

    assert.throws(
      () => {
        deleteUser(owner!.id);
      },
      /Tidak dapat menghapus satu-satunya akun Owner/
    );
  });

  test("supports Developer as Marketing hybrid with canHandleSales flag", () => {
    // 1. Buat Developer dengan canHandleSales: true
    const dev = createUser({
      fullName: "Dev Hybrid Marketing",
      email: "dev.marketing@fynux.com",
      role: "DEVELOPER",
      password: "passwordDev123",
      canHandleSales: true,
    });

    assert.ok(dev.id);
    assert.equal(dev.role, "DEVELOPER");
    assert.equal(dev.canHandleSales, true);

    // 2. Verifikasi autentikasi mengembalikan session data dengan canHandleSales
    const authResult = authenticateUser("dev.marketing@fynux.com", "passwordDev123");
    assert.equal(authResult.success, true);
    assert.equal(authResult.user?.canHandleSales, true);

    // 3. Update canHandleSales menjadi false
    const updated = updateUser(dev.id, { canHandleSales: false });
    assert.equal(updated.canHandleSales, false);

    const reAuth = authenticateUser("dev.marketing@fynux.com", "passwordDev123");
    assert.equal(reAuth.user?.canHandleSales, false);

    // 4. Update kembali menjadi true
    const reUpdated = updateUser(dev.id, { canHandleSales: true });
    assert.equal(reUpdated.canHandleSales, true);

    // Bersihkan user pengujian
    deleteUser(dev.id);
  });

  test("deletes non-owner user successfully", () => {
    const sales = getUserByEmail("sales.lap@fynux.com");
    assert.ok(sales);

    deleteUser(sales!.id);
    assert.equal(getUserById(sales!.id), undefined);
  });
});
