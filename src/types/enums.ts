/**
 * FYNUX OS — Domain Enums
 * Standar status, tipe data finansial, siklus operasional bisnis Fynux OS.
 */

// CRM & Sales Pipeline
export type PipelineStage =
  | "NEW"
  | "CONTACTED"
  | "RESPONDED"
  | "ENGAGED"
  | "QUALIFIED"
  | "NEGOTIATION"
  | "PENDING"
  | "CLOSED_WON"
  | "FAILED";

export type NextAction =
  | "REACH_NOW"
  | "WAITING_FOR_RESPONSE"
  | "REPLY_TO_CLIENT"
  | "PREPARE_PROPOSAL"
  | "SCHEDULE_MEETING"
  | "FOLLOW_UP_SCHEDULED"
  | "NO_ACTION_REQUIRED";

export type FailedReason =
  | "NO_RESPONSE"
  | "REJECTED"
  | "BUDGET"
  | "NOT_A_FIT"
  | "COMPETITOR"
  | "ALREADY_HAVE_PROVIDER"
  | "TIMELINE"
  | "OTHER";

// Finance & Invoicing
export type InvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

export type PaymentMethod =
  | "MANUAL_TRANSFER_BCA"
  | "DUITKU_QRIS"
  | "DUITKU_VA";

export type PaymentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "FAILED"
  | "REVERSED"
  | "REFUNDED";

// Project Lifecycle
export type ProjectStatus =
  | "DRAFT"
  | "ACTIVE"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED"
  | "ARCHIVED";

// Task Workflow
export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "BLOCKED"
  | "DONE";

export type TaskPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT";

// Client Lifecycle & Maintenance
export type ServiceTier =
  | "BASIC"
  | "BUSINESS"
  | "ENTERPRISE";

export type MaintenanceBillingType =
  | "ONE_OFF"
  | "MONTHLY"
  | "ANNUAL";

export type MaintenanceContractStatus =
  | "ACTIVE"
  | "EXPIRING_SOON"
  | "EXPIRED"
  | "RENEWED"
  | "TERMINATED";

// Governance & System
export type ApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export type ActivityCategory =
  | "CRM"
  | "FINANCE"
  | "PROJECT"
  | "AI"
  | "SECURITY"
  | "SYSTEM";
