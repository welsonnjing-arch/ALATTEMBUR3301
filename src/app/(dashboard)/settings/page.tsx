import { Settings, Users, Calendar, Sliders, Shield } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Sistem & Business Rules Configuration
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Pengaturan operasional terpusat Owner: distribusi prospek, jadwal follow-up, SOP, dan permission pengguna
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Aturan Follow-up */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm">
            <Calendar className="w-4 h-4" />
            Jadwal Interval Follow-Up (Hari Kalender)
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Follow-Up #1:</span>
              <span className="font-semibold text-slate-900">+1 Hari setelah Initial Reach</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Follow-Up #2:</span>
              <span className="font-semibold text-slate-900">+3 Hari setelah FU #1</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Follow-Up #3:</span>
              <span className="font-semibold text-slate-900">+5 Hari setelah FU #2</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-600">Penetapan Status Failed:</span>
              <span className="font-semibold text-slate-900">+10 Hari setelah FU #3 tanpa respon</span>
            </div>
          </div>
        </div>

        {/* Manajemen Pengguna & Role */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm">
            <Users className="w-4 h-4" />
            Manajemen Pengguna & Custom Permissions
          </div>
          <p className="text-xs text-slate-500">
            Tiga peran baku: Owner, Sales, Developer. Owner dapat memberikan custom permission individual (misal: view margin, create invoice, edit all projects).
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-medium hover:text-indigo-800 cursor-pointer">
              <Shield className="w-3.5 h-3.5" />
              Kelola Pengguna Internal
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
