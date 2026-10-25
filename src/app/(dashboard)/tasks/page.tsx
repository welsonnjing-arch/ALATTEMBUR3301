import { getAllProjects, getAllTasks } from "@/modules/projects/projects.service";
import { getSessionCookie } from "@/modules/auth/session";
import { TaskManagerView } from "@/components/tasks/TaskManagerView";
import { CheckSquare } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const session = await getSessionCookie();
  const tasks = await getAllTasks();
  const projects = await getAllProjects();

  const projectsList = projects.map((p) => ({ id: p.id, name: p.name }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-indigo-600" />
            Universal To-Do & Task Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manajemen pekerjaan tim: tepat 1 PIC utama per task, collaborator opsional, dan status blocker transparan.
          </p>
        </div>
      </div>

      <TaskManagerView
        initialTasks={tasks}
        projectsList={projectsList}
        currentUserId={session?.id}
      />
    </div>
  );
}
