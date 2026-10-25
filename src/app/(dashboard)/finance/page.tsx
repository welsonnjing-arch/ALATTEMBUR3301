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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tagihan Diterbitkan */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Tagihan Diterbitkan
            </span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {formatIDR(summary.totalIssued)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Dari {summary.invoicesCount} invoice resmi terbit
          </p>
        </div>

        {/* Pembayaran Diterima (Kas Masuk) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Pembayaran Diterima
            </span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 font-mono">
            {formatIDR(summary.totalPaid)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Dana riil masuk via BCA & Duitku PG
          </p>
        </div>

        {/* Sisa Piutang Berjalan */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Sisa Piutang Klien
            </span>
            <ArrowDownRight className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-700 font-mono">
            {formatIDR(summary.totalOutstanding)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Belum jatuh tempo / menunggu pelunasan
          </p>
        </div>

        {/* Estimasi Laba Bersih (Anti Fake Zero) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Estimasi Margin Bersih
            </span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {summary.profitability.profit !== null
              ? `${summary.profitability.marginPercent}%`
              : "Belum dihitung"}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
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
