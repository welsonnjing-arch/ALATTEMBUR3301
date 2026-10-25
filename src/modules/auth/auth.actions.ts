"use server";

import { redirect } from "next/navigation";
import {
  clearSessionCookie,
  getDefaultWorkspaceRoute,
  getSessionCookie,
  INITIAL_INTERNAL_USERS,
  setSessionCookie,
} from "./session";
import { AuthResult, UserSessionData } from "./types";
import { UserRole } from "@/types/roles";
import { logSecurityEvent } from "@/lib/logger";

export async function loginAction(
  prevState: unknown,
  formData: FormData
): Promise<AuthResult> {
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return {
      success: false,
      error: "Email dan password wajib diisi.",
    };
  }

  // 1. Cari user di akun terdaftar
  const matchedUser = INITIAL_INTERNAL_USERS.find(
    (u) => u.email.toLowerCase() === email
  );

  if (!matchedUser) {
    logSecurityEvent("LOGIN_FAILED_UNKNOWN_USER", "ANONYMOUS", { email });
    return {
      success: false,
      error: "Kredensial tidak valid atau akun tidak terdaftar.",
    };
  }

  // 2. Periksa status akun (Non-aktif ditolak mutlak)
  if (matchedUser.status === "INACTIVE") {
    logSecurityEvent("LOGIN_BLOCKED_INACTIVE_ACCOUNT", matchedUser.id, { email });
    return {
      success: false,
      error: "Akun ini telah dinonaktifkan oleh Owner. Akses ditolak.",
    };
  }

  // 3. Set Sesi
  await setSessionCookie(matchedUser);

  logSecurityEvent("LOGIN_SUCCESS", matchedUser.id, {
    email: matchedUser.email,
    role: matchedUser.role,
  });

  const targetRoute = getDefaultWorkspaceRoute(matchedUser.role);
  redirect(targetRoute);
}

export async function switchRoleDevAction(targetRole: UserRole): Promise<void> {
  const matched = INITIAL_INTERNAL_USERS.find((u) => u.role === targetRole);
  if (matched) {
    await setSessionCookie(matched);
    const targetRoute = getDefaultWorkspaceRoute(matched.role);
    redirect(targetRoute);
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
