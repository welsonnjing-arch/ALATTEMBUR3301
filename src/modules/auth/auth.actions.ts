"use server";

import { redirect } from "next/navigation";
import {
  clearSessionCookie,
  getDefaultWorkspaceRoute,
  getSessionCookie,
  setSessionCookie,
} from "./session";
import { AuthResult, CreateUserInput, UpdateUserInput, UserAccount, UserSessionData } from "./types";
import { logSecurityEvent } from "@/lib/logger";
import {
  authenticateUser,
  createUser,
  deleteUser,
  getAllUsers,
  hasAnyUsers,
  hasOwnerUser,
  toSessionData,
  updateUser,
} from "./user.service";

/**
 * Server Action untuk login pengguna dengan verifikasi kata sandi aman
 */
export async function loginAction(
  prevState: unknown,
  formData: FormData
): Promise<AuthResult> {
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return {
      success: false,
      error: "Email dan kata sandi wajib diisi.",
    };
  }

  const authRes = authenticateUser(email, password);
  if (!authRes.success || !authRes.user) {
    return {
      success: false,
      error: authRes.error || "Email atau kata sandi tidak valid.",
    };
  }

  const user = authRes.user;

  // Set Sesi Cookie Aman
  await setSessionCookie(user);

  logSecurityEvent("LOGIN_SUCCESS", user.id, {
    email: user.email,
    role: user.role,
  });

  const targetRoute = getDefaultWorkspaceRoute(user.role);
  redirect(targetRoute);
}

/**
 * Server Action untuk membuat akun Owner pertama saat sistem masih kosong
 */
export async function registerInitialOwnerAction(
  prevState: unknown,
  formData: FormData
): Promise<AuthResult> {
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();
  const fullName = formData.get("fullName")?.toString().trim();

  if (!email || !password || !fullName) {
    return {
      success: false,
      error: "Nama lengkap, email, dan kata sandi wajib diisi.",
    };
  }

  // Hanya boleh dijalankan jika belum ada akun Owner di sistem
  if (hasOwnerUser()) {
    return {
      success: false,
      error: "Akun Owner sudah ada di sistem. Silakan login.",
    };
  }

  try {
    const owner = createUser({
      email,
      password,
      fullName,
      role: "OWNER",
    });

    const sessionData = toSessionData(owner);
    await setSessionCookie(sessionData);

    logSecurityEvent("OWNER_INITIAL_SETUP_SUCCESS", owner.id, {
      email: owner.email,
      fullName: owner.fullName,
    });

    redirect("/command-center");
  } catch (err: unknown) {
    const isRedirect =
      (err as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT") ||
      (err as Error)?.message === "NEXT_REDIRECT";
    if (isRedirect) {
      throw err;
    }
    return {
      success: false,
      error: (err as Error)?.message || "Gagal membuat akun Owner.",
    };
  }
}

/**
 * Memeriksa apakah sistem sudah memiliki pengguna aktif
 */
export async function checkSystemUsersStatusAction(): Promise<{
  hasUsers: boolean;
  hasOwner: boolean;
}> {
  return {
    hasUsers: hasAnyUsers(),
    hasOwner: hasOwnerUser(),
  };
}

/**
 * Server Action untuk mengambil daftar anggota tim (khusus role OWNER)
 */
export async function fetchTeamMembersAction(): Promise<
  Omit<UserAccount, "passwordHash" | "salt">[]
> {
  const current = await getSessionCookie();
  if (!current || current.role !== "OWNER") {
    throw new Error("Akses ditolak: Hanya Owner yang dapat mengelola anggota tim.");
  }

  const users = getAllUsers();
  return users.map((u) => ({
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    role: u.role,
    status: u.status,
    permissions: u.permissions,
    avatarUrl: u.avatarUrl,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }));
}

/**
 * Server Action untuk menambah anggota tim baru oleh Owner
 */
export async function createTeamMemberAction(
  input: CreateUserInput
): Promise<{ success: boolean; error?: string; user?: Omit<UserAccount, "passwordHash" | "salt"> }> {
  const current = await getSessionCookie();
  if (!current || current.role !== "OWNER") {
    return { success: false, error: "Akses ditolak: Hanya Owner yang dapat menambah akun." };
  }

  try {
    const newUser = createUser(input, current.id);
    return {
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        status: newUser.status,
        permissions: newUser.permissions,
        avatarUrl: newUser.avatarUrl,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error)?.message || "Gagal membuat akun tim.",
    };
  }
}

/**
 * Server Action untuk memperbarui profil/role/status/password anggota tim oleh Owner
 */
export async function updateTeamMemberAction(
  id: string,
  input: UpdateUserInput
): Promise<{ success: boolean; error?: string }> {
  const current = await getSessionCookie();
  if (!current || current.role !== "OWNER") {
    return { success: false, error: "Akses ditolak: Hanya Owner yang dapat mengubah akun tim." };
  }

  try {
    updateUser(id, input, current.id);
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error)?.message || "Gagal memperbarui akun tim.",
    };
  }
}

/**
 * Server Action untuk menghapus akun anggota tim oleh Owner
 */
export async function deleteTeamMemberAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const current = await getSessionCookie();
  if (!current || current.role !== "OWNER") {
    return { success: false, error: "Akses ditolak: Hanya Owner yang dapat menghapus akun." };
  }

  try {
    deleteUser(id, current.id);
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error)?.message || "Gagal menghapus akun tim.",
    };
  }
}

export async function logoutAction(): Promise<void> {
  const current = await getSessionCookie();
  if (current) {
    logSecurityEvent("LOGOUT", current.id, { email: current.email });
  }
  await clearSessionCookie();
  redirect("/login");
}

export async function getCurrentUserAction(): Promise<UserSessionData | null> {
  return await getSessionCookie();
}
