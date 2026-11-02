import { getAllInvoices, getFinancialSummary } from "@/modules/finance/finance.service";
import { getSessionCookie } from "@/modules/auth/session";
import { InvoiceListTable } from "@/components/finance/InvoiceListTable";
import { formatIDR } from "@/lib/currency";
import { DollarSign, FileText, CreditCard, ArrowDownRight, TrendingUp } from "lucide-react";

export default async function FinancePage() {
  const session = await getSessionCookie();
  const invoices = await getAllInvoices();
  const summary = await getFinancialSummary();

  const isOwner = session?.role === "OWNER";
  const canCreate =
    isOwner ||
    (session?.role === "SALES" && session?.permissions.includes("finance.create_invoice"));
  const canConfirm =
    isOwner || session?.permissions.includes("finance.confirm_payment");

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Finance & Invoicing Engine
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Pengelolaan tagihan resmi format FYN-(NUMBER)-(DATE), pelacakan pembayaran Transfer BCA & Duitku, piutang, dan profitabilitas riil
        </p>
      </div>

      {/* 4 Financial Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4">
        {/* Total Tagihan Diterbitkan */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs min-w-0">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 truncate">
              Total Tagihan Diterbitkan
            </span>
            <FileText className="w-4 h-4 text-blue-600 shrink-0" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-slate-900 font-mono tracking-tight truncate">
            {formatIDR(summary.totalIssued)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            Dari {summary.invoicesCount} invoice resmi terbit
          </p>
        </div>

        {/* Pembayaran Diterima (Kas Masuk) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs min-w-0">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 truncate">
              Pembayaran Diterima
            </span>
            <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-slate-900 font-mono tracking-tight truncate">
            {formatIDR(summary.totalPaid)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            Dana riil masuk via BCA & Duitku PG
          </p>
        </div>

        {/* Sisa Piutang Berjalan */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs min-w-0">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 truncate">
              Sisa Piutang Klien
            </span>
            <ArrowDownRight className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-slate-900 font-mono tracking-tight truncate">
            {formatIDR(summary.totalOutstanding)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            Belum jatuh tempo / menunggu pelunasan
          </p>
        </div>

        {/* Estimasi Laba Bersih (Anti Fake Zero) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs min-w-0">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 truncate">
              Estimasi Margin Bersih
            </span>
            <TrendingUp className="w-4 h-4 text-blue-600 shrink-0" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-slate-900 font-mono tracking-tight truncate">
            {summary.profitability.profit !== null
              ? `${summary.profitability.marginPercent}%`
              : "Belum dihitung"}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {summary.profitability.isCostComplete
              ? `Laba: ${formatIDR(summary.profitability.profit)}`
              : "Menunggu pencatatan biaya produksi proyek"}
          </p>
        </div>
      </div>

      {/* Invoice Table Container */}
      <InvoiceListTable
        initialInvoices={invoices}
        userRole={session?.role || "OWNER"}
        canCreateInvoice={canCreate}
        canConfirmPayment={canConfirm}
      />
    </div>
  );
}
