"use server";

import { getSessionCookie, setSessionCookie } from "./session";
import {
  createPendingRegistration,
  getPendingRegistrationsForOwner,
  OwnerPendingRegistrationView,
  rejectPendingRegistration,
  verifyRegistrationNumber,
} from "./registration.service";

export type { OwnerPendingRegistrationView };
import { UserRole } from "@/types/roles";
import { UserSessionData } from "./types";

export interface RequestRegistrationResult {
  success: boolean;
  registrationId?: string;
  options?: [number, number, number];
  email?: string;
  fullName?: string;
  role?: string;
  error?: string;
}

export interface VerifyNumberResult {
  success: boolean;
  user?: UserSessionData;
  error?: string;
}

/**
 * Server Action: Calon pengguna mengajukan pendaftaran dari halaman /login
 */
export async function requestRegistrationAction(
  prevState: unknown,
  formData: FormData
): Promise<RequestRegistrationResult> {
  const fullName = formData.get("fullName")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();
  const role = (formData.get("role")?.toString().trim().toUpperCase() || "DEVELOPER") as UserRole;

  if (!fullName || !email || !password) {
    return {
      success: false,
      error: "Nama lengkap, email, dan kata sandi wajib diisi.",
    };
  }

  if (role !== "SALES" && role !== "DEVELOPER") {
    return {
      success: false,
      error: "Pilihan role tim hanya boleh Sales atau Developer.",
    };
  }

  try {
    const res = createPendingRegistration({
      fullName,
      email,
      password,
      role,
    });

    return {
      success: true,
      registrationId: res.registrationId,
      options: res.options,
      email,
      fullName,
      role,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error)?.message || "Gagal memproses permohonan pendaftaran.",
    };
  }
}

/**
 * Server Action: Calon pengguna mengetuk salah satu dari 3 nomor di halaman /login
 */
export async function verifyRegistrationNumberAction(input: {
  registrationId: string;
  chosenNumber: number;
}): Promise<VerifyNumberResult> {
  const { registrationId, chosenNumber } = input;

  if (!registrationId || typeof chosenNumber !== "number") {
    return {
      success: false,
      error: "Parameter verifikasi tidak lengkap.",
    };
  }

  try {
    const result = verifyRegistrationNumber(registrationId, chosenNumber);
    if (!result.success || !result.user) {
      return {
        success: false,
        error: result.error || "Verifikasi nomor otorisasi gagal.",
      };
    }

    // Buat sesi otomatis setelah verifikasi nomor berhasil
    await setSessionCookie(result.user);

    return {
      success: true,
      user: result.user,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error)?.message || "Terjadi kesalahan saat memverifikasi nomor otorisasi.",
    };
  }
}

/**
 * Server Action: Mengambil pendaftaran aktif yang memerlukan otorisasi (Khusus Akun Owner)
 */
export async function fetchPendingRegistrationsForOwnerAction(): Promise<
  OwnerPendingRegistrationView[]
> {
  const session = await getSessionCookie();
  if (!session || session.role !== "OWNER") {
    return [];
  }

  return getPendingRegistrationsForOwner();
}

/**
 * Server Action: Owner menolak permohonan pendaftaran
 */
export async function rejectPendingRegistrationAction(
  registrationId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getSessionCookie();
  if (!session || session.role !== "OWNER") {
    return {
      success: false,
      error: "Hanya akun Owner yang berhak menolak pendaftaran akun.",
    };
  }

  const success = rejectPendingRegistration(registrationId, session.id);
  return { success };
}
