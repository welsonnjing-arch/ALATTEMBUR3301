/**
 * FYNUX OS — Roles & Permissions Core Type Definitions
 * Sesuai spesifikasi mainproject.txt (Bab 16) & businesslogic.txt (Bab 3)
 */

export type UserRole = "OWNER" | "SALES" | "DEVELOPER";

export type UserStatus = "ACTIVE" | "INACTIVE";

/**
 * Custom permissions yang dapat ditambahkan/dicabut oleh Owner per user
 * tanpa mengubah role dasar user tersebut.
 */
export type CustomPermission =
  | "crm.view_all"               // Mengakses seluruh prospek (bukan hanya yang di-assign)
  | "crm.edit_all"               // Mengedit seluruh prospek
  | "finance.view_costs_margins" // Mengakses biaya internal, profit, dan margin deal
  | "finance.create_invoice"     // Menerbitkan invoice deal
  | "finance.confirm_payment"    // Mengonfirmasi pembayaran manual (Transfer BCA)
  | "projects.edit_all"          // Mengedit semua project (bukan hanya project yang di-assign)
  | "projects.cancel"            // Membatalkan project (default hanya Owner)
  | "settings.manage"            // Mengubah konfigurasi bisnis, SOP, jadwal FU
  | "approval.manage";           // Mengakses Approval Queue komersial

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  permissions: CustomPermission[];
  avatarUrl?: string;
}

export interface PermissionCheckContext {
  userId: string;
  role: UserRole;
  permissions: CustomPermission[];
}
