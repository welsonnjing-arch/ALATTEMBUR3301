import { Code2, CheckSquare, Clock, AlertTriangle } from "lucide-react";

export default function DeliveryWorkspacePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Delivery Workspace
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Area kerja developer: eksekusi proyek, pengelolaan task, dan monitoring deadline
          </p>
        </div>
      </div>

      {/* Metrik Pengerjaan Developer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Proyek Terkait</span>
            <Code2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">0</div>
          <p className="text-[10px] text-slate-400 mt-1">Proyek yang ditugaskan kepada Anda</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Task Tanggung Jawab</span>
            <CheckSquare className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">0</div>
          <p className="text-[10px] text-slate-400 mt-1">Anda sebagai PIC Utama</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Deadline Minggu Ini</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">0</div>
          <p className="text-[10px] text-slate-400 mt-1">Mendekati tenggat serah terima</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Task Blocked</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">0</div>
          <p className="text-[10px] text-slate-400 mt-1">Memerlukan bantuan atau data client</p>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">
          Daftar Pekerjaan Aktif
        </h2>
        <div className="text-center py-8 text-xs text-slate-500">
          Belum ada task aktif yang ditugaskan kepada Anda saat ini.
        </div>
      </div>
    </div>
  );
}
