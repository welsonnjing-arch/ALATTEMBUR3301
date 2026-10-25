import { Briefcase, FolderPlus, Clock, CheckCircle2 } from "lucide-react";

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Project Operations & Delivery
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Workspace pengerjaan proyek, pelacakan deliverables, milestone, dan handoff deal
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <FolderPlus className="w-4 h-4" />
          Inisialisasi Project Baru
        </button>
      </div>

      {/* Projects Table Placeholder */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
        <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-800">
          Belum ada proyek aktif
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Project Workspace diaktifkan setelah kesepakatan deal diterima dan invoice dibuat sesuai ketentuan bisnis.
        </p>
      </div>
    </div>
  );
}
