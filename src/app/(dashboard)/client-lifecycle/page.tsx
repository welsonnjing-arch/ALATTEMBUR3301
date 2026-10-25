import { ShieldCheck, RefreshCw, Sparkles } from "lucide-react";

export default function ClientLifecyclePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Client Lifecycle, Warranty & Maintenance
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Pengelolaan masa garansi per proyek, kontrak maintenance berulang, dan peluang repeat order
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm mb-3">
            <ShieldCheck className="w-4 h-4" />
            Masa Garansi (Warranty)
          </div>
          <p className="text-xs text-slate-500">
            Dihitung sejak konfirmasi serah terima proyek selesai. Tidak ada modul tiket khusus.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm mb-3">
            <RefreshCw className="w-4 h-4" />
            Kontrak Maintenance
          </div>
          <p className="text-xs text-slate-500">
            Mendukung skema one-off, bulanan, atau tahunan dengan pengingat renewal otomatis di dashboard.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm mb-3">
            <Sparkles className="w-4 h-4" />
            Repeat Order & Upsell
          </div>
          <p className="text-xs text-slate-500">
            Peluang baru dari client lama otomatis terhubung dengan histori proyek dan invoice terdahulu.
          </p>
        </div>
      </div>
    </div>
  );
}
