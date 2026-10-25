import { getAllProjects } from "@/modules/projects/projects.service";
import { getSessionCookie } from "@/modules/auth/session";
import { ProjectListTable } from "@/components/projects/ProjectListTable";
import { FolderGit2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const session = await getSessionCookie();
  const isOwner = session?.role === "OWNER";
  const projects = await getAllProjects();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FolderGit2 className="w-6 h-6 text-indigo-600" />
            Project Operations & Delivery
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Workspace operasional delivery, pelacakan deliverables, milestone progress, tautan Google Drive / repo, dan chat koordinasi tim internal.
          </p>
        </div>
      </div>

      <ProjectListTable
        initialProjects={projects}
        userRole={session?.role}
        isOwner={isOwner}
      />
    </div>
  );
}
