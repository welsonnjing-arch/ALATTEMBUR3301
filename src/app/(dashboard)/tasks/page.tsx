import { CheckSquare, Plus, Clock, AlertTriangle } from "lucide-react";

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Universal To-Do & Task Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manajemen pekerjaan tim: tepat 1 PIC utama per task, collaborator, dan status blocker
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Task Baru
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
        <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-800">
          Belum ada task dalam antrean
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Setiap task berdiri sendiri tanpa dependensi otomatis, memiliki satu PIC yang bertanggung jawab, serta tenggat waktu jelas.
        </p>
      </div>
    </div>
  );
}
