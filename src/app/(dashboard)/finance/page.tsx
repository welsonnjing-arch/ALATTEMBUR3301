import { DollarSign, FileText, CreditCard, ArrowDownRight, Plus } from "lucide-react";

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Finance & Invoicing
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengelolaan invoice, verifikasi pembayaran manual BCA / Duitku, piutang, dan kalkulasi profit riil
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Buat Invoice Baru
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Invoice Diterbitkan</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">Rp 0</div>
          <p className="text-[10px] text-slate-400 mt-1">Format penomoran: FYN-(NO)-(TGL)</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Pembayaran Diterima</span>
            <CreditCard className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">Rp 0</div>
          <p className="text-[10px] text-slate-400 mt-1">Via Transfer Manual BCA & Duitku PG</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Sisa Piutang Klien (Unpaid)</span>
            <ArrowDownRight className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">Rp 0</div>
          <p className="text-[10px] text-slate-400 mt-1">Menunggu pelunasan / termin</p>
        </div>
      </div>

      {/* Invoice Table Placeholder */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
        <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-800">
          Belum ada invoice yang dibuat
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Invoice dibuat otomatis saat penawaran deal disetujui client atau diterbitkan manual oleh Owner/Sales.
        </p>
      </div>
    </div>
  );
}
