import { getTeamBoardItems } from "@/modules/projects/projects.service";
import { getSessionCookie } from "@/modules/auth/session";
import { TeamBoardCanvasView } from "@/components/team-board/TeamBoardCanvasView";

export const dynamic = "force-dynamic";

export default async function TeamBoardPage() {
  const session = await getSessionCookie();
  const items = await getTeamBoardItems();

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Team Board & Interactive Canvas Kanban
          </h1>
          <p className="text-xs text-slate-500">
            Papan kerja kanvas interaktif: drag-and-drop bentuk kotak bebas, zoom in/out, pan geser, dan preview dokumen terlampir.
          </p>
        </div>
      </div>

      <TeamBoardCanvasView
        initialItems={items}
        currentUserRole={session?.role}
      />
    </div>
  );
}
