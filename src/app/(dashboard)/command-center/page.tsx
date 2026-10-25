import {
  TrendingUp,
  AlertCircle,
  Clock,
  DollarSign,
  Briefcase,
  Users,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";

export default function CommandCenterPage() {
  return (
    <div className="space-y-6">
      {/* Page Title & Timezone Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Company Command Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pusat kendali eksekutif Fynux Digital Solutions — Periode: Bulan Ini (Oktober 2026)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-1 rounded-md border border-indigo-100">
            Pola: Hybrid Executive View
          </span>
        </div>
      </div>

      {/* 1. BUSINESS OVERVIEW (Angka Bisnis Kunci) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Revenue Terkonfirmasi</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">Rp 0</div>
          <p className="text-[11px] text-slate-400 mt-1">Pembayaran riil yang telah masuk</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Piutang Berjalan (Outstanding)</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">Rp 0</div>
          <p className="text-[11px] text-slate-400 mt-1">Invoice terbit yang belum lunas</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Project Aktif</span>
            <Briefcase className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">0 Project</div>
          <p className="text-[11px] text-slate-400 mt-1">Sedang dikerjakan tim delivery</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Estimasi Margin Bersih</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">Belum dihitung</div>
          <p className="text-[11px] text-slate-400 mt-1">Menunggu kelengkapan biaya produksi</p>
        </div>
      </div>

      {/* 2. PRIORITY ACTIONS (Tindakan Mendesak Owner) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Priority Actions (Perlu Tindakan Owner Segera)
            </h2>
          </div>
          <span className="text-xs font-medium text-slate-500">0 Permintaan Menunggu</span>
        </div>

        <div className="border border-dashed border-slate-200 rounded-lg p-8 text-center bg-slate-50/50">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800">
            Seluruh antrean operasional aman
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Tidak ada permohonan diskon komersial, refund, atau invoice jatuh tempo kritis yang tertunda saat ini.
          </p>
        </div>
      </div>

      {/* 3. OPERATIONAL OVERVIEW (CRM, Delivery & Tim) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Pipeline Summary */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              Pipeline Prospek Aktif
            </h3>
            <span className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer flex items-center gap-0.5">
              Lihat CRM <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100">
              <span className="text-slate-600">Prospek Baru (Belum Outreach)</span>
              <span className="font-semibold text-slate-900">0</span>
            </div>
            <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100">
              <span className="text-slate-600">Percakapan Berjalan (Engaged)</span>
              <span className="font-semibold text-slate-900">0</span>
            </div>
            <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100">
              <span className="text-slate-600">Meeting Terjadwal (Qualified)</span>
              <span className="font-semibold text-slate-900">0</span>
            </div>
            <div className="flex justify-between items-center text-xs py-2">
              <span className="text-slate-600">Negosiasi & Penawaran Terkirim</span>
              <span className="font-semibold text-slate-900">0</span>
            </div>
          </div>
        </div>

        {/* Delivery Health & Risks */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-slate-500" />
              Status Delivery & Risiko Proyek
            </h3>
            <span className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer flex items-center gap-0.5">
              Lihat Proyek <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100">
              <span className="text-slate-600">Proyek Berjalan Tepat Waktu</span>
              <span className="font-semibold text-emerald-600">0</span>
            </div>
            <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100">
              <span className="text-slate-600">Proyek On Hold (Ada Hambatan)</span>
              <span className="font-semibold text-amber-600">0</span>
            </div>
            <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100">
              <span className="text-slate-600">Masa Garansi Berjalan (Warranty)</span>
              <span className="font-semibold text-blue-600">0</span>
            </div>
            <div className="flex justify-between items-center text-xs py-2">
              <span className="text-slate-600">Kontrak Maintenance Aktif</span>
              <span className="font-semibold text-purple-600">0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
