import { getSessionCookie } from "@/modules/auth/session";
import { redirect } from "next/navigation";
import { TeamLoungeView } from "@/components/team-lounge/TeamLoungeView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Team Lounge | Fynux OS",
  description: "Live Voice Call & Team Chat Collaboration HQ",
};

export default async function TeamLoungePage() {
  const session = await getSessionCookie();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="w-full">
      <TeamLoungeView session={session} />
    </div>
  );
}
