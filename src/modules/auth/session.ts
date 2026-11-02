import { cookies } from "next/headers";
import { UserSessionData } from "./types";
import { UserRole } from "@/types/roles";
import { getAllUsers, getUserById, toSessionData } from "./user.service";

const SESSION_COOKIE_NAME = "fynux_session";

/**
 * Mengambil seluruh data sesi pengguna yang terdaftar di database
 */
export function getInternalUsers(): UserSessionData[] {
  return getAllUsers().map(toSessionData);
}

/**
 * Proxy dinamis kompatibilitas untuk INITIAL_INTERNAL_USERS
 * Mengarah langsung ke data persisten data/users.json tanpa akun hardcoded dummy
 */
export const INITIAL_INTERNAL_USERS: UserSessionData[] = new Proxy(
  [] as UserSessionData[],
  {
    get(target, prop, receiver) {
      const users = getAllUsers().map(toSessionData);
      if (prop === "length") return users.length;
      if (prop === Symbol.iterator) return users[Symbol.iterator].bind(users);
      if (typeof prop === "string" && !isNaN(Number(prop))) {
        return users[Number(prop)];
      }
      const val = Reflect.get(users, prop, receiver);
      if (typeof val === "function") {
        return val.bind(users);
      }
      return val;
    },
  }
);

export async function getSessionCookie(): Promise<UserSessionData | null> {
  const cookieStore = await cookies();
  const sessionVal = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionVal) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(sessionVal, "base64").toString("utf-8"));
    if (!parsed || !parsed.id) {
      return null;
    }

    // Selalu sinkronkan dengan database user terbaru agar perubahan avatarUrl, fullName, dan status langsung live
    const freshUser = getUserById(parsed.id);
    if (freshUser) {
      if (freshUser.status === "INACTIVE") {
        return null;
      }
      return toSessionData(freshUser);
    }

    if (parsed.status === "INACTIVE") {
      return null;
    }
    return parsed as UserSessionData;
  } catch {
    return null;
  }
}

export async function setSessionCookie(session: UserSessionData): Promise<void> {
  const cookieStore = await cookies();
  const serialized = Buffer.from(JSON.stringify(session)).toString("base64");

  cookieStore.set(SESSION_COOKIE_NAME, serialized, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 hari
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export function getDefaultWorkspaceRoute(role: UserRole): string {
  switch (role) {
    case "OWNER":
      return "/command-center";
    case "SALES":
      return "/sales-workspace";
    case "DEVELOPER":
      return "/delivery-workspace";
  }
}
