"use client";

import { useState } from "react";
import {
  FileText,
  DollarSign,
  Plus,
  Search,
  Printer,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building,
} from "lucide-react";
import { Invoice } from "@/modules/finance/types";
import { InvoiceStatus } from "@/types/enums";
import { formatIDR } from "@/lib/currency";
import { formatDateWIB } from "@/lib/date";
import { InvoicePDFPreviewModal } from "./InvoicePDFPreviewModal";
import { RecordPaymentModal } from "./RecordPaymentModal";
import { CreateInvoiceModal } from "./CreateInvoiceModal";

interface InvoiceListTableProps {
  initialInvoices: Invoice[];
  userRole?: string;
  canCreateInvoice?: boolean;
  canConfirmPayment?: boolean;
}

const STATUS_TABS: Array<{ label: string; value: InvoiceStatus | "ALL" }> = [
  { label: "Semua", value: "ALL" },
  { label: "Issued", value: "ISSUED" },
  { label: "Partially Paid", value: "PARTIALLY_PAID" },
  { label: "Paid (Lunas)", value: "PAID" },
  { label: "Overdue", value: "OVERDUE" },
];

export function InvoiceListTable({
  initialInvoices,
  userRole = "OWNER",
  canCreateInvoice = true,
  canConfirmPayment = true,
}: InvoiceListTableProps) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [selectedStatus, setSelectedStatus] = useState<InvoiceStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Filter List
  const filtered = invoices.filter((inv) => {
    const matchesStatus =
      selectedStatus === "ALL" || inv.status === selectedStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.clientName.toLowerCase().includes(q) ||
      inv.terbilangPhrase.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case "PAID":
        return "bg-emerald-100 text-emerald-800 border-emerald-200 font-bold";
      case "PARTIALLY_PAID":
        return "bg-blue-100 text-blue-800 border-blue-200 font-semibold";
      case "ISSUED":
        return "bg-amber-100 text-amber-800 border-amber-200 font-semibold";
      case "OVERDUE":
        return "bg-rose-100 text-rose-800 border-rose-200 font-bold";
      case "DRAFT":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "CANCELLED":
        return "bg-slate-200 text-slate-500 border-slate-300 line-through";
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nomor invoice (FYN-...), nama klien..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
          />
        </div>

        {canCreateInvoice && (
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Terbitkan Invoice Baru
          </button>
        )}
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-slate-200">
        {STATUS_TABS.map((tab) => {
          const isActive = selectedStatus === tab.value;
          const count =
            tab.value === "ALL"
              ? invoices.length
              : invoices.filter((i) => i.status === tab.value).length;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setSelectedStatus(tab.value)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isActive
                  ? "bg-indigo-600 text-white font-semibold shadow-sm"
                  : "text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? "bg-indigo-800 text-indigo-100"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">No. Invoice & Klien</th>
                  <th className="py-3 px-4">Tgl Terbit / Jatuh Tempo</th>
                  <th className="py-3 px-4 text-right">Total Tagihan</th>
                  <th className="py-3 px-4 text-right">Terbayar</th>
                  <th className="py-3 px-4 text-right">Sisa Piutang</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => setPreviewInvoice(inv)}
                  >
                    {/* No. Invoice & Klien */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 font-mono flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        {inv.invoiceNumber}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-700 mt-0.5">
                        {inv.clientName}
                      </div>
                    </td>

                    {/* Tanggal */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 text-[11px]">
                      <div>{formatDateWIB(inv.issuedDate)}</div>
                      <div className="text-[10px] text-slate-400">
                        Jatuh Tempo: {formatDateWIB(inv.dueDate)}
                      </div>
                    </td>

                    {/* Total Tagihan */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatIDR(inv.totalAmount)}
                    </td>

                    {/* Terbayar */}
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-700 font-semibold whitespace-nowrap">
                      {formatIDR(inv.paidAmount)}
                    </td>

                    {/* Sisa Piutang */}
                    <td className="py-3.5 px-4 text-right font-mono whitespace-nowrap">
                      <span
                        className={
                          inv.outstandingBalance > 0
                            ? "text-rose-600 font-extrabold"
                            : "text-slate-400 font-medium"
                        }
                      >
                        {formatIDR(inv.outstandingBalance)}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full border ${getStatusBadge(
                          inv.status
                        )}`}
                      >
                        {inv.status === "PAID" ? "LUNAS" : inv.status}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {inv.status !== "PAID" && canConfirmPayment && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPaymentInvoice(inv);
                            }}
                            className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 font-semibold text-[11px] px-2.5 py-1 rounded border border-emerald-200 transition-colors"
                          >
                            <DollarSign className="w-3 h-3" />
                            Bayar
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewInvoice(inv);
                          }}
                          className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 font-medium text-[11px] px-2.5 py-1 rounded transition-colors"
                        >
                          <Printer className="w-3 h-3" />
                          Nota PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">
              Tidak ada invoice ditemukan
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery
                ? `Tidak ada hasil pencarian "${searchQuery}".`
                : "Belum ada invoice yang diterbitkan pada status ini."}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <InvoicePDFPreviewModal
        invoice={previewInvoice}
        isOpen={!!previewInvoice}
        onClose={() => setPreviewInvoice(null)}
        onRecordPayment={(inv) => {
          setPreviewInvoice(null);
          setPaymentInvoice(inv);
        }}
        canConfirmPayment={canConfirmPayment}
      />

      <RecordPaymentModal
        invoice={paymentInvoice}
        isOpen={!!paymentInvoice}
        onClose={() => setPaymentInvoice(null)}
        onSuccess={() => {
          // Re-fetch or reload
          window.location.reload();
        }}
      />

      <CreateInvoiceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}
