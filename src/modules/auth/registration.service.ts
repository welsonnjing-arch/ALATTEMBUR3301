import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { UserRole } from "@/types/roles";
import { generateSalt, hashPassword } from "./crypto";
import { createUserFromRegistration, getUserByEmail, toSessionData } from "./user.service";
import { UserSessionData } from "./types";
import { logSecurityEvent } from "@/lib/logger";

const DATA_DIR = path.join(process.cwd(), "data");
const REGISTRATIONS_FILE = path.join(DATA_DIR, "pending-registrations.json");

export interface PendingRegistration {
  id: string;
  fullName: string;
  email: string;
  role: "SALES" | "DEVELOPER";
  passwordHash: string;
  salt: string;
  options: [number, number, number]; // 3 nomor 2-digit pilihan (tampil di calon pendaftar)
  correctNumber: number;              // Nomor otorisasi yang benar (HANYA MUNCUL DI AKUN OWNER)
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  attempts: number;
  createdAt: string;
  expiresAt: string;
}

export interface OwnerPendingRegistrationView {
  id: string;
  fullName: string;
  email: string;
  role: "SALES" | "DEVELOPER";
  correctNumber: number;
  options: [number, number, number];
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  createdAt: string;
  expiresAt: string;
}

function ensureStorage(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(REGISTRATIONS_FILE)) {
    fs.writeFileSync(REGISTRATIONS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

export function loadPendingRegistrations(): PendingRegistration[] {
  ensureStorage();
  try {
    const raw = fs.readFileSync(REGISTRATIONS_FILE, "utf-8");
    return JSON.parse(raw) as PendingRegistration[];
  } catch {
    return [];
  }
}

export function savePendingRegistrations(list: PendingRegistration[]): void {
  ensureStorage();
  fs.writeFileSync(REGISTRATIONS_FILE, JSON.stringify(list, null, 2), "utf-8");
}

/**
 * Menghasilkan 3 angka 2 digit unik (rentang 11-98) dan memilih salah satu sebagai nomor otorisasi rahasia
 */
export function generateThreeNumbers(): {
  options: [number, number, number];
  correctNumber: number;
} {
  const set = new Set<number>();
  while (set.size < 3) {
    const num = Math.floor(Math.random() * 88) + 11; // 11 sampai 98
    set.add(num);
  }
  const arr = Array.from(set);
  // Acak posisi nomor yang benar
  const correctNumber = arr[Math.floor(Math.random() * arr.length)];
  return {
    options: arr as [number, number, number],
    correctNumber,
  };
}

/**
 * Mendaftarkan permintaan akun baru dari form /login
 */
export function createPendingRegistration(input: {
  fullName: string;
  email: string;
  password: string;
  role: "SALES" | "DEVELOPER";
}): {
  registrationId: string;
  options: [number, number, number];
} {
  const emailNorm = input.email.trim().toLowerCase();

  // 1. Cek apakah email sudah terdaftar di sistem pengguna
  const existingUser = getUserByEmail(emailNorm);
  if (existingUser) {
    throw new Error(`Email "${emailNorm}" sudah terdaftar di sistem. Silakan login.`);
  }

  // 2. Validasi password
  if (!input.password || input.password.trim().length < 6) {
    throw new Error("Kata sandi minimal harus 6 karakter.");
  }

  // 3. Generate salt & password hash
  const salt = generateSalt();
  const passwordHash = hashPassword(input.password.trim(), salt);

  // 4. Generate 3 pilihan nomor & 1 nomor benar
  const { options, correctNumber } = generateThreeNumbers();

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // Aktif 15 menit

  const registration: PendingRegistration = {
    id: `reg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    fullName: input.fullName.trim(),
    email: emailNorm,
    role: input.role,
    passwordHash,
    salt,
    options,
    correctNumber,
    status: "PENDING",
    attempts: 0,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  // 5. Simpan dan perbarui daftar registrasi pending
  const all = loadPendingRegistrations().filter(
    (r) => r.email !== emailNorm || r.status !== "PENDING"
  );
  all.unshift(registration);
  savePendingRegistrations(all);

  logSecurityEvent("REGISTRATION_REQUEST_SUBMITTED", "ANONYMOUS", {
    registrationId: registration.id,
    email: registration.email,
    role: registration.role,
    correctNumber: registration.correctNumber,
  });

  return {
    registrationId: registration.id,
    options: registration.options,
  };
}

/**
 * Mengambil daftar registrasi yang menunggu persetujuan (Khusus Akun Owner)
 * Termasuk nomor otorisasi rahasia untuk diberikan kepada calon user
 */
export function getPendingRegistrationsForOwner(): OwnerPendingRegistrationView[] {
  const all = loadPendingRegistrations();
  const now = new Date();

  return all
    .filter((r) => r.status === "PENDING" && new Date(r.expiresAt) > now)
    .map((r) => ({
      id: r.id,
      fullName: r.fullName,
      email: r.email,
      role: r.role,
      correctNumber: r.correctNumber,
      options: r.options,
      status: r.status,
      createdAt: r.createdAt,
      expiresAt: r.expiresAt,
    }));
}

/**
 * Calon user mengetuk salah satu dari 3 nomor di halaman /login
 */
export function verifyRegistrationNumber(
  registrationId: string,
  chosenNumber: number
): {
  success: boolean;
  user?: UserSessionData;
  error?: string;
} {
  const all = loadPendingRegistrations();
  const index = all.findIndex((r) => r.id === registrationId);

  if (index === -1) {
    return {
      success: false,
      error: "Permintaan registrasi tidak ditemukan atau telah kedaluwarsa.",
    };
  }

  const reg = all[index];
  if (reg.status !== "PENDING") {
    return {
      success: false,
      error: `Pendaftaran ini sudah berstatus ${reg.status}.`,
    };
  }

  const now = new Date();
  if (new Date(reg.expiresAt) <= now) {
    reg.status = "EXPIRED";
    savePendingRegistrations(all);
    return {
      success: false,
      error: "Waktu verifikasi telah habis (kedaluwarsa). Silakan daftar ulang.",
    };
  }

  // Validasi nomor otorisasi
  if (chosenNumber !== reg.correctNumber) {
    reg.attempts += 1;
    if (reg.attempts >= 3) {
      reg.status = "REJECTED";
    }
    savePendingRegistrations(all);

    logSecurityEvent("REGISTRATION_VERIFY_FAILED_WRONG_NUMBER", "ANONYMOUS", {
      registrationId,
      email: reg.email,
      chosenNumber,
      attempts: reg.attempts,
    });

    return {
      success: false,
      error:
        reg.attempts >= 3
          ? "Anda telah 3 kali salah memasukkan nomor otorisasi. Pendaftaran ditolak."
          : `Nomor otorisasi ${chosenNumber} salah. Silakan pastikan nomor yang benar dari akun Owner Anda.`,
    };
  }

  // Nomor benar! Buat user di users.json
  const newUser = createUserFromRegistration({
    fullName: reg.fullName,
    email: reg.email,
    passwordHash: reg.passwordHash,
    salt: reg.salt,
    role: reg.role,
  });

  reg.status = "APPROVED";
  savePendingRegistrations(all);

  logSecurityEvent("REGISTRATION_VERIFIED_SUCCESS", newUser.id, {
    registrationId,
    email: newUser.email,
    role: newUser.role,
    numberVerified: chosenNumber,
  });

  return {
    success: true,
    user: toSessionData(newUser),
  };
}

/**
 * Owner menolak pendaftaran akun
 */
export function rejectPendingRegistration(
  registrationId: string,
  ownerId: string
): boolean {
  const all = loadPendingRegistrations();
  const index = all.findIndex((r) => r.id === registrationId);
  if (index === -1) return false;

  all[index].status = "REJECTED";
  savePendingRegistrations(all);

  logSecurityEvent("REGISTRATION_REJECTED_BY_OWNER", ownerId, {
    registrationId,
    email: all[index].email,
  });

  return true;
}
