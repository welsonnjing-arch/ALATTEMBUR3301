import { getTeamBoardItems } from "@/modules/projects/projects.service";
import { getSessionCookie } from "@/modules/auth/session";
import { TeamBoardView } from "@/components/team-board/TeamBoardView";

export const dynamic = "force-dynamic";

export default async function TeamBoardPage() {
  const session = await getSessionCookie();
  const items = await getTeamBoardItems();

  return (
    <div className="space-y-6">
      <TeamBoardView
        initialItems={items}
        currentUserRole={session?.role}
      />
    </div>
  );
}
