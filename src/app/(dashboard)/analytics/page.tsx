import { BarChart3, TrendingUp, Users, DollarSign, Briefcase } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Analytics & Performa Operasional
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Analitik bisnis, konversi sales CRM, delivery proyek, dan akurasi AI Sales Agent
          </p>
        </div>
        <div className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200">
          Periode: Bulan Berjalan (Oktober 2026)
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Performa Sales & CRM
          </h2>
          <div className="text-2xl font-bold text-slate-900 mt-2">0% Closing Rate</div>
          <p className="text-[11px] text-slate-400 mt-1">0 Deal Accepted dari 0 Prospek Riset</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Performa Delivery Proyek
          </h2>
          <div className="text-2xl font-bold text-slate-900 mt-2">100% On-Time</div>
          <p className="text-[11px] text-slate-400 mt-1">0 Keterlambatan serah terima tercatat</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            AI Sales Agent Assistance
          </h2>
          <div className="text-2xl font-bold text-slate-900 mt-2">0 Draf Pesan</div>
          <p className="text-[11px] text-slate-400 mt-1">Draf klasifikasi & bantuan percakapan</p>
        </div>
      </div>
    </div>
  );
}
