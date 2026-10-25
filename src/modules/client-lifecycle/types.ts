import {
  MaintenanceBillingType,
  MaintenanceContractStatus,
  ServiceTier,
} from "@/types/enums";

export type ClientStatus = "ACTIVE" | "INACTIVE";

export type WarrantyStatus = "ACTIVE" | "EXPIRING_SOON" | "EXPIRED";

export type ClaimStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";

export interface Client {
  id: string;
  name: string; // Nama institusi / perusahaan
  industry?: string;
  website?: string;
  address?: string;
  picName: string;
  picPhone: string; // Normalisasi 628xxx
  email?: string;
  position?: string;
  status: ClientStatus;
  totalLtv: number; // Nilai transaksi kumulatif
  projectCount: number;
  onboardingDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WarrantyClaim {
  id: string;
  warrantyId: string;
  issueTitle: string;
  issueDescription: string;
  reportedDate: string;
  status: ClaimStatus;
  reportedBy: string;
  resolutionNotes?: string;
  resolvedAt?: string;
}

export interface Warranty {
  id: string;
  clientId: string;
  clientName: string;
  projectId: string;
  projectName: string;
  tier: ServiceTier;
  durationMonths: number; // 3 (Basic), 6 (Business), 12 (Enterprise)
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: WarrantyStatus;
  daysRemaining: number;
  scopeOfSupport: string;
  claims: WarrantyClaim[];
  createdAt: string;
}

export interface MaintenanceContract {
  id: string;
  contractNumber: string; // Format: MNC-2026-001
  clientId: string;
  clientName: string;
  projectId?: string;
  projectName?: string;
  billingType: MaintenanceBillingType;
  price: number; // Rp
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  daysRemaining: number;
  status: MaintenanceContractStatus;
  terms: string;
  scopeItems: string[];
  renewalReminderDate: string;
  renewalAlertSent: boolean;
  createdAt: string;
}

export interface ClientOpportunity {
  id: string;
  clientId: string;
  previousProjectId?: string;
  type: "REPEAT_ORDER" | "UPSELL";
  title: string;
  estimatedValue?: number;
  stage: "IDENTIFIED" | "PROPOSAL" | "WON" | "LOST";
  createdAt: string;
}

export interface CreateClientInput {
  name: string;
  industry?: string;
  website?: string;
  address?: string;
  picName: string;
  picPhone: string;
  email?: string;
  position?: string;
  notes?: string;
}

export interface CreateWarrantyInput {
  clientId: string;
  projectId: string;
  tier: ServiceTier;
  startDate: string;
  durationMonths?: number;
  scopeOfSupport?: string;
}

export interface CreateWarrantyClaimInput {
  warrantyId: string;
  issueTitle: string;
  issueDescription: string;
  reportedBy: string;
}

export interface CreateMaintenanceContractInput {
  clientId: string;
  projectId?: string;
  billingType: MaintenanceBillingType;
  price: number;
  startDate: string;
  durationMonths: number;
  terms?: string;
  scopeItems?: string[];
}
