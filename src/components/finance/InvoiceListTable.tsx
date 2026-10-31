"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Pagination } from "@/components/common/Pagination";
import { useToast } from "@/components/common/Toast";
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
  const router = useRouter();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);

  useEffect(() => {
    setInvoices(initialInvoices);
  }, [initialInvoices]);

  const [selectedStatus, setSelectedStatus] = useState<InvoiceStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 25;

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedInvoices = filtered.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE
  );

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case "PAID":
        return "bg-slate-900 text-white border-slate-800 font-bold";
      case "PARTIALLY_PAID":
        return "bg-blue-50 text-blue-700 border-blue-200 font-semibold";
      case "ISSUED":
        return "bg-slate-100 text-slate-700 border-slate-200 font-semibold";
      case "OVERDUE":
        return "bg-slate-200 text-slate-800 border-slate-300 font-bold";
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
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
          />
        </div>

        {canCreateInvoice && (
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-500/20 transition-all active-press"
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
              onClick={() => {
                setSelectedStatus(tab.value);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isActive
                  ? "bg-slate-900 text-white font-semibold shadow-sm"
                  : "text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                  isActive
                    ? "bg-slate-800 text-slate-200"
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
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden w-full">
        {filtered.length > 0 ? (
          <>
            <div className="table-container-clean w-full overflow-x-auto border-0 rounded-none shadow-none">
            <table className="w-full text-left text-xs min-w-[1020px]">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 min-w-[200px]">No. Invoice & Klien</th>
                  <th className="py-3.5 px-4 min-w-[140px]">Tgl Terbit / Jatuh Tempo</th>
                  <th className="py-3.5 px-4 text-right min-w-[130px]">Total Tagihan</th>
                  <th className="py-3.5 px-4 text-right min-w-[120px]">Terbayar</th>
                  <th className="py-3.5 px-4 text-right min-w-[120px]">Sisa Piutang</th>
                  <th className="py-3.5 px-4 text-center min-w-[100px]">Status</th>
                  <th className="py-3.5 px-4 text-right min-w-[210px] pr-8">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="table-row-hover hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => setPreviewInvoice(inv)}
                  >
                    {/* No. Invoice & Klien */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 font-mono flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
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
                    <td className="py-3.5 px-4 text-right font-mono text-slate-900 font-bold whitespace-nowrap">
                      {formatIDR(inv.paidAmount)}
                    </td>

                    {/* Sisa Piutang */}
                    <td className="py-3.5 px-4 text-right font-mono whitespace-nowrap">
                      <span
                        className={
                          inv.outstandingBalance > 0
                            ? "text-slate-900 font-bold"
                            : "text-slate-400 font-medium"
                        }
                      >
                        {formatIDR(inv.outstandingBalance)}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-md border font-mono ${getStatusBadge(
                          inv.status
                        )}`}
                      >
                        {inv.status === "PAID" ? "LUNAS" : inv.status}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap min-w-[210px] pr-8">
                      <div className="flex items-center justify-end gap-1.5">
                        {inv.status !== "PAID" && canConfirmPayment && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPaymentInvoice(inv);
                            }}
                            className="inline-flex items-center gap-1 text-slate-800 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 font-semibold text-[11px] px-2.5 py-1 rounded-lg border border-slate-200 transition-all active-press"
                          >
                            <DollarSign className="w-3 h-3 text-blue-600" />
                            Bayar
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewInvoice(inv);
                          }}
                          className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 font-medium text-[11px] px-2.5 py-1 rounded-lg transition-all active-press"
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

            {/* Pagination Controls (25 Data Per Page) */}
            <div className="p-4 border-t border-slate-200/80 bg-slate-50/40">
              <Pagination
                currentPage={safeCurrentPage}
                totalItems={filtered.length}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
                itemLabel="invoice"
              />
            </div>
          </>
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
        onSuccess={(updatedInvoice) => {
          if (updatedInvoice) {
            setInvoices((prev) =>
              prev.map((inv) => (inv.id === updatedInvoice.id ? updatedInvoice : inv))
            );
          }
          router.refresh();
        }}
      />

      <CreateInvoiceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(newInvoice) => {
          if (newInvoice) {
            setInvoices((prev) => [newInvoice, ...prev]);
          }
          router.refresh();
        }}
      />
    </div>
  );
}
