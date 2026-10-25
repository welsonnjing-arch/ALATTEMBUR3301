import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { UserRole } from "@/types/roles";

const PUBLIC_PATHS = [
  "/login",
  "/api/webhooks",
  "/api/cron",
  "/favicon.ico",
];

interface SessionPayload {
  role: UserRole;
  status: "ACTIVE" | "INACTIVE";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Lewati resource statis Next.js dan public assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  // 2. Ambil cookie sesi internal
  const sessionCookie = request.cookies.get("fynux_session")?.value;

  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  let session: SessionPayload;
  try {
    session = JSON.parse(Buffer.from(sessionCookie, "base64").toString("utf-8"));
  } catch {
    const loginUrl = new URL("/login", request.url);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete("fynux_session");
    return res;
  }

  // 3. Akun non-aktif langsung diblokir
  if (session.status === "INACTIVE") {
    const loginUrl = new URL("/login", request.url);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete("fynux_session");
    return res;
  }

  // 4. Redirect root "/" ke dashboard sesuai role
  if (pathname === "/") {
    const target =
      session.role === "OWNER"
        ? "/command-center"
        : session.role === "SALES"
        ? "/sales-workspace"
        : "/delivery-workspace";
    return NextResponse.redirect(new URL(target, request.url));
  }

  // 5. Role-based Route Protection
  const isOwner = session.role === "OWNER";
  const isSales = session.role === "SALES";
  const isDev = session.role === "DEVELOPER";

  // Rute Khusus Owner
  const ownerOnlyRoutes = ["/command-center", "/approval-queue", "/settings"];
  if (ownerOnlyRoutes.some((route) => pathname.startsWith(route)) && !isOwner) {
    const fallback = isSales ? "/sales-workspace" : "/delivery-workspace";
    return NextResponse.redirect(new URL(fallback, request.url));
  }

  // Sales Workspace
  if (pathname.startsWith("/sales-workspace") && !isSales && !isOwner) {
    return NextResponse.redirect(new URL("/delivery-workspace", request.url));
  }

  // Delivery Workspace
  if (pathname.startsWith("/delivery-workspace") && !isDev && !isOwner) {
    return NextResponse.redirect(new URL("/sales-workspace", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
