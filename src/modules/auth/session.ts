import { cookies } from "next/headers";
import { UserSessionData } from "./types";
import { UserRole } from "@/types/roles";

const SESSION_COOKIE_NAME = "fynux_session";

// Demo/Seed internal accounts untuk verifikasi cepat & pengujian offline
export const INITIAL_INTERNAL_USERS: UserSessionData[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    email: "faiz@fynux.co",
    fullName: "Faiz Aditama (Owner)",
    role: "OWNER",
    status: "ACTIVE",
    permissions: [
      "crm.view_all",
      "crm.edit_all",
      "finance.view_costs_margins",
      "finance.create_invoice",
      "finance.confirm_payment",
      "projects.edit_all",
      "projects.cancel",
      "settings.manage",
      "approval.manage",
    ],
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    email: "sales@fynux.co",
    fullName: "Budi Santoso (Sales)",
    role: "SALES",
    status: "ACTIVE",
    permissions: [
      "finance.create_invoice", // Sales diizinkan membuat draft invoice sesuai kesepakatan
    ],
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    email: "dev@fynux.co",
    fullName: "Eko Pratama (Developer)",
    role: "DEVELOPER",
    status: "ACTIVE",
    permissions: [],
  },
];

export async function getSessionCookie(): Promise<UserSessionData | null> {
  const cookieStore = await cookies();
  const sessionVal = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionVal) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(sessionVal, "base64").toString("utf-8"));
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
