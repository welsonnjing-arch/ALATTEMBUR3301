import { CustomPermission, UserRole, UserStatus } from "@/types/roles";

export interface UserSessionData {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  permissions: CustomPermission[];
  avatarUrl?: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  session?: UserSessionData;
  redirectUrl?: string;
}
