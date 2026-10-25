import { CustomPermission, UserRole, UserSession } from "@/types/roles";

/**
 * Helper untuk memeriksa otorisasi akses pengguna.
 * Aturan dasar:
 * - Role OWNER memiliki bypass mutlak terhadap seluruh aksi.
 * - Role lain harus memiliki role yang diizinkan ATAU memiliki custom permission spesifik.
 */

export function isOwner(user: Pick<UserSession, "role">): boolean {
  return user.role === "OWNER";
}

export function hasPermission(
  user: UserSession,
  requiredPermission: CustomPermission
): boolean {
  // 1. Owner selalu diizinkan
  if (user.role === "OWNER") {
    return true;
  }

  // 2. Akun non-aktif ditolak mutlak
  if (user.status === "INACTIVE") {
    return false;
  }

  // 3. Periksa custom permissions array
  return user.permissions.includes(requiredPermission);
}

export function canViewAllProspects(user: UserSession): boolean {
  return user.role === "OWNER" || hasPermission(user, "crm.view_all");
}

export function canViewFinancialMargins(user: UserSession): boolean {
  return user.role === "OWNER" || hasPermission(user, "finance.view_costs_margins");
}

export function canCreateInvoice(user: UserSession): boolean {
  return (
    user.role === "OWNER" ||
    (user.role === "SALES" && hasPermission(user, "finance.create_invoice"))
  );
}

export function canConfirmPayment(user: UserSession): boolean {
  return user.role === "OWNER" || hasPermission(user, "finance.confirm_payment");
}

export function canEditProject(user: UserSession, projectAssigneeIds: string[]): boolean {
  if (user.role === "OWNER") return true;
  if (hasPermission(user, "projects.edit_all")) return true;
  if (user.role === "DEVELOPER" && projectAssigneeIds.includes(user.id)) return true;
  return false;
}
