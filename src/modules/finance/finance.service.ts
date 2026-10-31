import fs from "node:fs";
import path from "node:path";
import { CreateInvoiceInput, Invoice, PaymentRecord, ProjectCost } from "./types";
import { InvoiceStatus, PaymentMethod } from "@/types/enums";
import { terbilang } from "@/lib/terbilang";
import { calculateProfitability } from "@/lib/currency";
import { logActivity } from "@/lib/logger";

interface FinanceGlobalStore {
  invoicesData?: Invoice[];
  paymentsData?: PaymentRecord[];
  projectCostsData?: ProjectCost[];
}

const financeGlobal = globalThis as unknown as FinanceGlobalStore;

const DATA_DIR = path.join(process.cwd(), "data");
const INVOICES_FILE = path.join(DATA_DIR, "invoices.json");

function ensureStorageDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadPersistedInvoices(): Invoice[] {
  ensureStorageDir();
  if (!fs.existsSync(INVOICES_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(INVOICES_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Gagal membaca invoices.json:", err);
    return [];
  }
}

function persistInvoices() {
  try {
    ensureStorageDir();
    const data = financeGlobal.invoicesData || invoicesData;
    fs.writeFileSync(INVOICES_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Gagal menyimpan invoices.json:", err);
  }
}

export const invoicesData: Invoice[] =
  financeGlobal.invoicesData || (financeGlobal.invoicesData = loadPersistedInvoices());

let paymentsData: PaymentRecord[] =
  financeGlobal.paymentsData || (financeGlobal.paymentsData = []);

let projectCostsData: ProjectCost[] =
  financeGlobal.projectCostsData || (financeGlobal.projectCostsData = []);

export async function getAllInvoices(filterStatus?: InvoiceStatus | "ALL"): Promise<Invoice[]> {
  const store = financeGlobal.invoicesData || invoicesData;
  if (!filterStatus || filterStatus === "ALL") {
    return [...store];
  }
  return store.filter((inv) => inv.status === filterStatus);
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const store = financeGlobal.invoicesData || invoicesData;
  const inv = store.find((i) => i.id === id);
  return inv ? { ...inv } : null;
}

export async function createInvoice(
  input: CreateInvoiceInput,
  actorUserId: string,
  actorName: string
): Promise<{ success: boolean; invoice?: Invoice; error?: string }> {
  if (!input.clientName.trim()) {
    return { success: false, error: "Nama klien wajib diisi." };
  }
  if (!input.items || input.items.length === 0) {
    return { success: false, error: "Rincian item tagihan tidak boleh kosong." };
  }

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const seqNumber = String(invoicesData.length + 1).padStart(4, "0");
  const invoiceNumber = `FYN-${dateStr.slice(0, 6)}-${seqNumber}`;

  let subtotal = 0;
  const items = input.items.map((item, idx) => {
    const total = item.quantity * item.unitPrice;
    subtotal += total;
    return {
      id: `item-${Date.now()}-${idx}`,
      description: item.description,
      durationInfo: item.durationInfo || "-",
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: total,
    };
  });

  const discount = input.discount || 0;
  const totalAmount = Math.max(0, subtotal - discount);

  const newInvoice: Invoice = {
    id: `inv-${Date.now()}`,
    invoiceNumber,
    dealId: input.dealId,
    clientId: input.clientId || `client-${Date.now()}`,
    clientName: input.clientName.trim(),
    paymentMethod: input.paymentMethod || "MANUAL_TRANSFER_BCA",
    issuedDate: new Date().toISOString().split("T")[0],
    dueDate: input.dueDate,
    keterangan: input.keterangan || "Rincian nota pembayaran proyek",
    items,
    subtotal,
    discount,
    totalAmount,
    paidAmount: 0,
    outstandingBalance: totalAmount,
    status: "ISSUED",
    terbilangPhrase: terbilang(totalAmount),
    notes: input.notes || "Terima kasih atas kepercayaan Anda kepada Fynux Digital Solutions.",
    signerName: "Faiz Aditama",
    signerRole: "Lead Developer FYNUX",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const store = financeGlobal.invoicesData || invoicesData;
  store.unshift(newInvoice);
  persistInvoices();

  logActivity({
    category: "FINANCE",
    action: "INVOICE_ISSUED",
    actorId: actorUserId,
    targetId: newInvoice.id,
    targetType: "INVOICE",
    metadata: {
      invoiceNumber: newInvoice.invoiceNumber,
      totalAmount: newInvoice.totalAmount,
      clientName: newInvoice.clientName,
    },
  });

  return { success: true, invoice: newInvoice };
}

export async function recordPayment(
  invoiceId: string,
  amount: number,
  method: PaymentMethod | "Cash",
  actorUserId: string,
  actorName: string,
  referenceNumber?: string
): Promise<{ success: boolean; invoice?: Invoice; error?: string }> {
  const store = financeGlobal.invoicesData || invoicesData;
  const idx = store.findIndex((i) => i.id === invoiceId);
  if (idx === -1) {
    return { success: false, error: "Invoice tidak ditemukan." };
  }

  const inv = store[idx];

  if (amount <= 0) {
    return { success: false, error: "Nominal pembayaran harus lebih dari 0." };
  }

  const paymentRecord: PaymentRecord = {
    id: `pay-${Date.now()}`,
    invoiceId,
    amount,
    method,
    status: "CONFIRMED",
    referenceNumber: referenceNumber || `REF-${Date.now()}`,
    confirmedBy: actorName,
    confirmedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  paymentsData.unshift(paymentRecord);

  // Perbarui saldo invoice
  inv.paidAmount += amount;
  inv.outstandingBalance = Math.max(0, inv.totalAmount - inv.paidAmount);
  inv.paymentDate = new Date().toISOString().split("T")[0];
  inv.paymentMethod = method;

  if (inv.outstandingBalance === 0) {
    inv.status = "PAID";
  } else {
    inv.status = "PARTIALLY_PAID";
  }
  inv.updatedAt = new Date().toISOString();

  persistInvoices();

  logActivity({
    category: "FINANCE",
    action: "PAYMENT_RECORDED",
    actorId: actorUserId,
    targetId: inv.id,
    targetType: "PAYMENT",
    metadata: {
      amount,
      method,
      outstandingBalance: inv.outstandingBalance,
      status: inv.status,
    },
  });

  return { success: true, invoice: inv };
}

export async function getFinancialSummary() {
  const store = financeGlobal.invoicesData || invoicesData;
  const totalIssued = store.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalPaid = store.reduce((acc, i) => acc + i.paidAmount, 0);
  const totalOutstanding = store.reduce((acc, i) => acc + i.outstandingBalance, 0);

  // Ambil biaya produksi yang tercatat
  const allCosts = projectCostsData.map((c) => c.amount);
  const costComplete = projectCostsData.length > 0;

  // Hitung profitabilitas (dengan pencegahan fake zero)
  const profitability = calculateProfitability(totalIssued, allCosts, costComplete);

  return {
    totalIssued,
    totalPaid,
    totalOutstanding,
    profitability,
    invoicesCount: store.length,
    paymentsCount: paymentsData.length,
  };
}

export function resetFinanceForTesting(): void {
  const store = financeGlobal.invoicesData || invoicesData;
  store.length = 0;
  paymentsData.length = 0;
  projectCostsData.length = 0;
}
