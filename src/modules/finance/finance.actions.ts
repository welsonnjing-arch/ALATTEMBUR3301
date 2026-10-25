"use server";

import { revalidatePath } from "next/cache";
import { getSessionCookie } from "../auth/session";
import {
  createInvoice,
  getAllInvoices,
  getFinancialSummary,
  getInvoiceById,
  recordPayment,
} from "./finance.service";
import { CreateInvoiceInput } from "./types";
import { InvoiceStatus, PaymentMethod } from "@/types/enums";

export async function fetchInvoicesAction(statusFilter?: InvoiceStatus | "ALL") {
  return await getAllInvoices(statusFilter);
}

export async function fetchInvoiceDetailAction(id: string) {
  return await getInvoiceById(id);
}

export async function createInvoiceAction(input: CreateInvoiceInput) {
  const session = await getSessionCookie();
  if (!session) {
    return { success: false, error: "Sesi telah berakhir." };
  }

  // Verifikasi otorisasi: Owner atau Sales dengan izin create_invoice
  const canCreate =
    session.role === "OWNER" ||
    (session.role === "SALES" && session.permissions.includes("finance.create_invoice"));

  if (!canCreate) {
    return {
      success: false,
      error: "Anda tidak memiliki kewenangan untuk menerbitkan invoice.",
    };
  }

  const res = await createInvoice(input, session.id, session.fullName);
  if (res.success) {
    revalidatePath("/finance");
    revalidatePath("/command-center");
  }
  return res;
}

export async function recordPaymentAction(
  invoiceId: string,
  amount: number,
  method: PaymentMethod | "Cash",
  referenceNumber?: string
) {
  const session = await getSessionCookie();
  if (!session) {
    return { success: false, error: "Sesi telah berakhir." };
  }

  // Verifikasi otorisasi konfirmasi pembayaran: Owner atau user dengan izin confirm_payment
  const canConfirm =
    session.role === "OWNER" || session.permissions.includes("finance.confirm_payment");

  if (!canConfirm) {
    return {
      success: false,
      error: "Hanya Owner atau pengguna dengan izin yang dapat mengonfirmasi pembayaran.",
    };
  }

  const res = await recordPayment(
    invoiceId,
    amount,
    method,
    session.id,
    session.fullName,
    referenceNumber
  );

  if (res.success) {
    revalidatePath("/finance");
    revalidatePath("/command-center");
  }
  return res;
}

export async function fetchFinancialSummaryAction() {
  return await getFinancialSummary();
}
