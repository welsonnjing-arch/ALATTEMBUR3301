import { CustomPermission, UserRole, UserStatus } from "@/types/roles";

export interface UserSessionData {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  permissions: CustomPermission[];
  avatarUrl?: string;
  canHandleSales?: boolean;
}

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  permissions: CustomPermission[];
  avatarUrl?: string;
  canHandleSales?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  permissions?: CustomPermission[];
  avatarUrl?: string;
  canHandleSales?: boolean;
}

export interface UpdateUserInput {
  fullName?: string;
  role?: UserRole;
  status?: UserStatus;
  password?: string;
  permissions?: CustomPermission[];
  avatarUrl?: string;
  canHandleSales?: boolean;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  session?: UserSessionData;
  redirectUrl?: string;
}
