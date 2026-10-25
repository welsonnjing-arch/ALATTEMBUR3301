import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { UserRole } from "../src/types/roles";

// Pure helper replicating the route protection logic in middleware
function checkRouteAccess(
  pathname: string,
  role: UserRole,
  status: "ACTIVE" | "INACTIVE" = "ACTIVE"
): { allowed: boolean; redirectTo?: string } {
  if (status === "INACTIVE") {
    return { allowed: false, redirectTo: "/login" };
  }

  const isOwner = role === "OWNER";
  const isSales = role === "SALES";
  const isDev = role === "DEVELOPER";

  const ownerOnlyRoutes = ["/command-center", "/approval-queue", "/settings"];
  if (ownerOnlyRoutes.some((route) => pathname.startsWith(route)) && !isOwner) {
    const fallback = isSales ? "/sales-workspace" : "/delivery-workspace";
    return { allowed: false, redirectTo: fallback };
  }

  if (pathname.startsWith("/sales-workspace") && !isSales && !isOwner) {
    return { allowed: false, redirectTo: "/delivery-workspace" };
  }

  if (pathname.startsWith("/delivery-workspace") && !isDev && !isOwner) {
    return { allowed: false, redirectTo: "/sales-workspace" };
  }

  return { allowed: true };
}

describe("RBAC & Role-Based Route Access Control", () => {
  test("Owner has unrestricted access to all sensitive routes", () => {
    assert.equal(checkRouteAccess("/command-center", "OWNER").allowed, true);
    assert.equal(checkRouteAccess("/approval-queue", "OWNER").allowed, true);
    assert.equal(checkRouteAccess("/settings", "OWNER").allowed, true);
    assert.equal(checkRouteAccess("/sales-workspace", "OWNER").allowed, true);
    assert.equal(checkRouteAccess("/delivery-workspace", "OWNER").allowed, true);
    assert.equal(checkRouteAccess("/crm", "OWNER").allowed, true);
    assert.equal(checkRouteAccess("/finance", "OWNER").allowed, true);
  });

  test("Sales is blocked from /command-center, /approval-queue, and /settings", () => {
    const resCmd = checkRouteAccess("/command-center", "SALES");
    assert.equal(resCmd.allowed, false);
    assert.equal(resCmd.redirectTo, "/sales-workspace");

    const resApp = checkRouteAccess("/approval-queue", "SALES");
    assert.equal(resApp.allowed, false);
    assert.equal(resApp.redirectTo, "/sales-workspace");

    const resSet = checkRouteAccess("/settings", "SALES");
    assert.equal(resSet.allowed, false);
    assert.equal(resSet.redirectTo, "/sales-workspace");
  });

  test("Developer is blocked from /command-center and /sales-workspace", () => {
    const resCmd = checkRouteAccess("/command-center", "DEVELOPER");
    assert.equal(resCmd.allowed, false);
    assert.equal(resCmd.redirectTo, "/delivery-workspace");

    const resSales = checkRouteAccess("/sales-workspace", "DEVELOPER");
    assert.equal(resSales.allowed, false);
    assert.equal(resSales.redirectTo, "/delivery-workspace");
  });

  test("INACTIVE accounts are immediately kicked out to /login regardless of role", () => {
    const res = checkRouteAccess("/command-center", "OWNER", "INACTIVE");
    assert.equal(res.allowed, false);
    assert.equal(res.redirectTo, "/login");
  });
});
