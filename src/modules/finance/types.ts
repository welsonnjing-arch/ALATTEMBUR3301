import { InvoiceStatus, PaymentMethod, PaymentStatus } from "@/types/enums";

export interface InvoiceItem {
  id: string;
  description: string;
  durationInfo?: string; // misal: "12 bulan", "3 bulan"
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // Format: FYN-(NUMBER)-(DATE), contoh: FYN-202602-0003
  dealId?: string;
  clientId: string;
  clientName: string;
  paymentMethod?: PaymentMethod | "Cash";
  issuedDate: string; // Tanggal Terbit
  paymentDate?: string; // Tanggal Pembayaran
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  outstandingBalance: number;
  status: InvoiceStatus;
  dueDate: string;
  terbilangPhrase: string;
  notes?: string;
  signerName?: string;
  signerRole?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceInput {
  clientName: string;
  dealId?: string;
  clientId?: string;
  dueDate: string;
  items: Array<{
    description: string;
    durationInfo?: string;
    quantity: number;
    unitPrice: number;
  }>;
  discount?: number;
  notes?: string;
  paymentMethod?: PaymentMethod | "Cash";
}

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod | "Cash";
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
