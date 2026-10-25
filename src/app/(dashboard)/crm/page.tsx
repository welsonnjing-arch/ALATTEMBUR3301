import { Users, Filter, Plus, Search } from "lucide-react";

export default function CRMPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            CRM & Prospect Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Database prospek berbasis riset bisnis, status pipeline, dan penugasan sales
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Input Prospek Riset
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama bisnis, kontak, nomor WhatsApp..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
          >
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            Filter Stage
          </button>
        </div>
      </div>

      {/* Prospect Table Placeholder */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800">
            Belum ada data prospek
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Mulai dengan mencatat hasil riset bisnis, masalah yang ditemukan, dan nomor WhatsApp kontak.
          </p>
        </div>
      </div>
    </div>
  );
}
