import { CreateInvoiceInput, Invoice, PaymentRecord, ProjectCost } from "./types";
import { InvoiceStatus, PaymentMethod } from "@/types/enums";
import { terbilang } from "@/lib/terbilang";
import { calculateProfitability } from "@/lib/currency";
import { logActivity } from "@/lib/logger";

let invoicesData: Invoice[] = [
  {
    id: "inv-001",
    invoiceNumber: "FYN-202602-0003",
    dealId: "deal-001",
    clientId: "p-001",
    clientName: "SMAN 2 NGAGLIK",
    paymentMethod: "Cash",
    issuedDate: "2026-02-12",
    paymentDate: "2026-02-11",
    dueDate: "2026-02-12",
    subtotal: 950000,
    discount: 0,
    totalAmount: 950000,
    paidAmount: 950000,
    outstandingBalance: 0,
    status: "PAID",
    terbilangPhrase: "Sembilan ratus lima puluh ribu rupiah.",
    notes:
      "SIM-Presensi berbasis web v1.0 mencakup: Multi-Device Support, Kiosk Absensi, Manajemen Database Siswa/Guru, Keamanan Data (anti brute-force), serta modul laporan eksekutif Excel multi-sheet otomatis.\n\nPembayaran telah diterima lunas secara cash pada 11 Februari 2026.\nPeriode layanan hosting dan domain mulai dihitung sejak aktivasi.",
    signerName: "Faiz Aditama",
    signerRole: "Lead Developer FYNUX",
    items: [
      {
        id: "item-1",
        description: "Web App Development - Presensi Digital Basic (GRATIS)\nNilai normal: Rp 5.800.000",
        durationInfo: "-",
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
      },
      {
        id: "item-2",
        description:
          "Hosting (Paket Tahunan)\n- Unlimited SSD NVMe Storage\n- Unlimited Visitor/Month\n- Unlimited Email Account\n- Unlimited Subdomain\n- Free SSL\n- DDoS Protect up to 6 Tbps",
        durationInfo: "12 bulan",
        quantity: 1,
        unitPrice: 948000,
        totalPrice: 948000,
      },
      {
        id: "item-3",
        description: "Domain .COM - padmawidyasetiajaya.com (GRATIS)\nNilai normal: Rp 168.000/tahun",
        durationInfo: "12 bulan",
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
      },
      {
        id: "item-4",
        description:
          "Maintenance & Monitoring (3 Bulan GRATIS)\nRevisi sistem 1x; garansi bug sistem.\nSetelah periode garansi: Rp 98.000/bulan (opsional).",
        durationInfo: "3 bulan",
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
      },
      {
        id: "item-5",
        description: "Biaya Administrasi",
        durationInfo: "-",
        quantity: 1,
        unitPrice: 2000,
        totalPrice: 2000,
      },
    ],
    createdAt: "2026-02-12T08:00:00Z",
    updatedAt: "2026-02-12T10:00:00Z",
  },
  {
    id: "inv-002",
    invoiceNumber: "FYN-202610-0004",
    dealId: "deal-002",
    clientId: "p-002",
    clientName: "PT Padma Widya Setiajaya",
    paymentMethod: "MANUAL_TRANSFER_BCA",
    issuedDate: "2026-10-25",
    dueDate: "2026-11-05",
    subtotal: 3500000,
    discount: 350000,
    totalAmount: 3150000,
    paidAmount: 0,
    outstandingBalance: 3150000,
    status: "ISSUED",
    terbilangPhrase: "Tiga juta seratus lima puluh ribu rupiah.",
    notes:
      "Paket Business Website mencakup: CMS Kustom Portofolio Tender, Domain .COM 1 Tahun, Cloud Hosting NVMe, dan Garansi Teknis 6 Bulan.\n\nPembayaran dapat ditransfer ke Rekening BCA: 1234567890 a/n Fynux Digital Solutions.",
    signerName: "Faiz Aditama",
    signerRole: "Lead Developer FYNUX",
    items: [
      {
        id: "item-10",
        description: "Business Website Development — CMS Kustom Portofolio Tender",
        durationInfo: "14 hari",
        quantity: 1,
        unitPrice: 3500000,
        totalPrice: 3500000,
      },
      {
        id: "item-11",
        description: "Domain .COM & Cloud Hosting NVMe High Speed",
        durationInfo: "12 bulan",
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
      },
      {
        id: "item-12",
        description: "Garansi Teknis & Pemeliharaan Sistem",
        durationInfo: "6 bulan",
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let paymentsData: PaymentRecord[] = [
  {
    id: "pay-001",
    invoiceId: "inv-001",
    amount: 950000,
    method: "Cash",
    status: "CONFIRMED",
    referenceNumber: "CASH-20260211-01",
    confirmedBy: "Faiz Aditama (Owner)",
    confirmedAt: "2026-02-11T14:00:00Z",
    createdAt: "2026-02-11T14:00:00Z",
  },
];

let projectCostsData: ProjectCost[] = [
  {
    id: "cost-001",
    projectId: "proj-001",
    category: "HOSTING",
    amount: 350000,
    description: "Alokasi server Cloud NVMe untuk presensi digital SMAN 2 Ngaglik",
    recordedBy: "Faiz Aditama",
    createdAt: "2026-02-12T10:00:00Z",
  },
  {
    id: "cost-002",
    projectId: "proj-001",
    category: "DOMAIN",
    amount: 140000,
    description: "Registrasi domain resmi sekolah",
    recordedBy: "Faiz Aditama",
    createdAt: "2026-02-12T10:00:00Z",
  },
];

export async function getAllInvoices(filterStatus?: InvoiceStatus | "ALL"): Promise<Invoice[]> {
  if (!filterStatus || filterStatus === "ALL") {
    return [...invoicesData];
  }
  return invoicesData.filter((inv) => inv.status === filterStatus);
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const inv = invoicesData.find((i) => i.id === id);
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

  invoicesData.unshift(newInvoice);

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
  const idx = invoicesData.findIndex((i) => i.id === invoiceId);
  if (idx === -1) {
    return { success: false, error: "Invoice tidak ditemukan." };
  }

  const inv = invoicesData[idx];

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
  const totalIssued = invoicesData.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalPaid = invoicesData.reduce((acc, i) => acc + i.paidAmount, 0);
  const totalOutstanding = invoicesData.reduce((acc, i) => acc + i.outstandingBalance, 0);

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
    invoicesCount: invoicesData.length,
    paymentsCount: paymentsData.length,
  };
}
