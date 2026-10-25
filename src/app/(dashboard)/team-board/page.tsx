import { Kanban, Megaphone, FileText, Lightbulb } from "lucide-react";

export default function TeamBoardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Team Board & Koordinasi Internal
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Pengumuman perusahaan, SOP operasional, target tim, dan ruang diskusi lintas fungsi
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm mb-3">
            <Megaphone className="w-4 h-4" />
            Pengumuman Perusahaan
          </div>
          <p className="text-xs text-slate-500">Belum ada pengumuman baru dari manajemen.</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm mb-3">
            <FileText className="w-4 h-4" />
            SOP & Business Rules
          </div>
          <p className="text-xs text-slate-500">Aturan operasional dan SOP dikonfigurasi melalui Settings.</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm mb-3">
            <Lightbulb className="w-4 h-4" />
            Ide & Hambatan Bersama
          </div>
          <p className="text-xs text-slate-500">Ruang koordinasi umum non-chat untuk tim Fynux.</p>
        </div>
      </div>
    </div>
  );
}
