import { InvoiceStatus, PaymentMethod, PaymentStatus } from "@/types/enums";

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // Format: FYN-(NUMBER)-(DATE), contoh: FYN-001-20261025
  dealId?: string;
  clientId: string;
  clientName: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  outstandingBalance: number;
  status: InvoiceStatus;
  dueDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  referenceNumber?: string;
  proofUrl?: string;
  confirmedBy?: string;
  confirmedAt?: string;
  createdAt: string;
}

export interface ProjectCost {
  id: string;
  projectId: string;
  category: "HOSTING" | "DOMAIN" | "DEVELOPER" | "ASSET" | "OTHER";
  amount: number;
  description: string;
  recordedBy: string;
  createdAt: string;
}
