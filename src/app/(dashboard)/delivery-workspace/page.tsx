import { getAllProjects, getAllTasks } from "@/modules/projects/projects.service";
import { getSessionCookie } from "@/modules/auth/session";
import { TaskManagerView } from "@/components/tasks/TaskManagerView";
import { Code2, CheckSquare, Clock, AlertTriangle, ExternalLink } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DeliveryWorkspacePage() {
  const session = await getSessionCookie();
  const userId = session?.id || "";
  const isOwner = session?.role === "OWNER";

  const allProjects = await getAllProjects();
  const allTasks = await getAllTasks();

  const userProjects = isOwner
    ? allProjects
    : allProjects.filter((p) => p.assignedMemberIds.includes(userId));

  const userTasks = isOwner
    ? allTasks
    : allTasks.filter((t) => t.primaryPicId === userId || t.collaboratorIds.includes(userId));

  const myPicTasks = allTasks.filter((t) => t.primaryPicId === userId || isOwner);

  // Deadline within 7 days
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const deadlineThisWeek = userTasks.filter((t) => {
    if (!t.deadline || t.status === "DONE") return false;
    const d = new Date(t.deadline);
    return d >= now && d <= in7Days;
  });

  const blockedTasks = userTasks.filter((t) => t.status === "BLOCKED");

  const projectsList = allProjects.map((p) => ({ id: p.id, name: p.name }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Code2 className="w-6 h-6 text-indigo-600" />
            Delivery & Developer Workspace
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Area kerja terpadu tim developer: eksekusi proyek aktif, kontrol to-do mandiri, dan penyelesaian kendala.
          </p>
        </div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
        >
          Lihat Semua Proyek <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Proyek Terkait</span>
            <Code2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{userProjects.length}</div>
          <p className="text-[10px] text-slate-400 mt-1">Proyek aktif dalam tanggung jawab</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Task Tanggung Jawab (PIC)</span>
            <CheckSquare className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{myPicTasks.length}</div>
          <p className="text-[10px] text-slate-400 mt-1">Anda sebagai PIC Utama</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Deadline Minggu Ini</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">{deadlineThisWeek.length}</div>
          <p className="text-[10px] text-slate-400 mt-1">Tenggat waktu dalam 7 hari</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Task Blocked</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600">{blockedTasks.length}</div>
          <p className="text-[10px] text-slate-400 mt-1">Memerlukan bantuan atau data klien</p>
        </div>
      </div>

      {/* Proyek Aktif Ringkas */}
      {userProjects.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center justify-between">
            <span>Proyek Aktif Yang Ditugaskan</span>
            <span className="text-xs font-normal text-slate-500">{userProjects.length} proyek</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {userProjects.map((proj) => (
              <div key={proj.id} className="p-3.5 border border-slate-200 rounded-lg hover:border-indigo-300 transition-colors">
                <div className="flex items-start justify-between">
                  <h3 className="text-xs font-bold text-slate-900">{proj.name}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {proj.progressPercent}%
                  </span>
                </div>
                <div className="text-[11px] text-indigo-600 font-semibold mt-0.5">{proj.clientName}</div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${proj.progressPercent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task Board */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <TaskManagerView
          initialTasks={userTasks}
          projectsList={projectsList}
          currentUserId={userId}
        />
      </div>
    </div>
  );
}
