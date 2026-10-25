import { Flame, MessageCircle, Calendar, Target, PlusCircle } from "lucide-react";
import Link from "next/link";

export default function SalesWorkspacePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Sales Workspace
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Area kerja operasional sales: follow-up prospek, chat WhatsApp, dan closing
          </p>
        </div>
        <Link
          href="/crm"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Tambah Prospek Baru
        </Link>
      </div>

      {/* Target Pribadi & Indikator Harian */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Prospek Ter-assign</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">0</div>
          <p className="text-[10px] text-slate-400 mt-1">Hanya prospek tanggung jawab Anda</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Follow-Up Hari Ini</span>
            <Calendar className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">0</div>
          <p className="text-[10px] text-slate-400 mt-1">Jatuh tempo jadwal kalender</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Respon Masuk (Perlu Balas)</span>
            <MessageCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">0</div>
          <p className="text-[10px] text-slate-400 mt-1">Client merespons pesan outreach</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Pencapaian Target</span>
            <Target className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">0%</div>
          <p className="text-[10px] text-slate-400 mt-1">Target bulanan yang ditetapkan Owner</p>
        </div>
      </div>

      {/* Daftar Tugas Outreach Hari Ini */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">
          Antrean Follow-up & Outreach WhatsApp Hari Ini
        </h2>
        <div className="text-center py-8 text-xs text-slate-500">
          Belum ada jadwal outreach yang jatuh tempo hari ini.
        </div>
      </div>
    </div>
  );
}
