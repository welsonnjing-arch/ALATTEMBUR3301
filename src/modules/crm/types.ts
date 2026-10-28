import { FailedReason, NextAction, PipelineStage } from "@/types/enums";

export interface FollowUpLogItem {
  id: string;
  prospectId: string;
  step: "INITIAL" | "FU1" | "FU2" | "FU3" | "FAILED";
  channel: string;
  sentByUserId: string;
  sentByUserName: string;
  confirmedSentAt: string;
  notes?: string;
}

export interface Prospect {
  id: string;
  companyName: string;
  contactName: string;
  whatsappNumber: string; // Dinormalisasi (misal: 628123456789)
  email?: string;
  website?: string;
  industry?: string;
  location?: string;
  source?: string;
  researchNotes: string; // Catatan bebas riset bisnis
  painPoints?: string;
  potentialServices?: string;
  assignedSalesId?: string;
  assignedSalesName?: string;
  stage: PipelineStage;
  nextAction: NextAction;
  nextFollowUpDate?: string;
  followUpStep?: "INITIAL" | "FU1" | "FU2" | "FU3" | "FAILED";
  lastReachAt?: string;
  failedReason?: FailedReason;
  isArchived?: boolean;
  followUpLogs?: FollowUpLogItem[];
  tags?: string[];
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProspectInput {
  companyName: string;
  contactName?: string;
  whatsappNumber: string;
  email?: string;
  website?: string;
  industry?: string;
  location?: string;
  source?: string;
  researchNotes?: string;
  painPoints?: string;
  potentialServices?: string;
  assignedSalesId?: string;
  tags?: string[];
  avatarUrl?: string;
  bio?: string;
}

export interface NormalizePhoneResult {
  formatted: string;
  isValid: boolean;
}

/**
 * Normalisasi nomor WhatsApp ke format internasional (default 628xxx untuk nomor lokal Indonesia)
 * Mendukung nomor Indonesia, nomor internasional, serta WhatsApp Linked ID (LID)
 */
export function normalizeWhatsAppNumber(phone: string): NormalizePhoneResult {
  let cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  } else if (cleaned.startsWith("+62")) {
    cleaned = "62" + cleaned.slice(3);
  }
  const isValid = cleaned.length >= 8 && cleaned.length <= 18;
  return { formatted: cleaned, isValid };
}
