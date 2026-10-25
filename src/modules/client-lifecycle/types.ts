import { MaintenanceBillingType, MaintenanceContractStatus, ServiceTier } from "@/types/enums";

export interface ProjectWarranty {
  id: string;
  clientId: string;
  projectId: string;
  tier: ServiceTier;
  startDate: string;
  endDate: string;
  scopeOfSupport: string;
  isActive: boolean;
  notes?: string;
}

export interface MaintenanceContract {
  id: string;
  clientId: string;
  projectId?: string;
  billingType: MaintenanceBillingType;
  price: number;
  startDate: string;
  endDate: string;
  renewalReminderDate: string; // Tanggal sistem memunculkan reminder task internal
  status: MaintenanceContractStatus;
  terms?: string;
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
