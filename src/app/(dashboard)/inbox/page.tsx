import { getAllConversations } from "@/modules/inbox/inbox.service";
import { getWhatsAppSession } from "@/modules/whatsapp/whatsapp.service";
import { getAllProspects } from "@/modules/crm/crm.service";
import { WhatsAppInboxView } from "@/components/inbox/WhatsAppInboxView";
import { getSessionCookie } from "@/modules/auth/session";
import { getAllUsers } from "@/modules/auth/user.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  searchParams?: {
    prospectId?: string;
    phone?: string;
  };
}

export default async function WhatsAppInboxPage({ searchParams }: PageProps) {
  const [conversations, session, prospects, currentUser, allUsers] = await Promise.all([
    getAllConversations(),
    getWhatsAppSession(),
    getAllProspects(),
    getSessionCookie(),
    getAllUsers(),
  ]);

  const activeTeamMembers = allUsers
    .filter((u) => u.status === "ACTIVE")
    .map((u) => ({
      id: u.id,
      name: u.fullName,
      role: u.role,
      email: u.email,
    }));

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col overflow-hidden">
      <WhatsAppInboxView
        initialConversations={conversations}
        initialSession={session}
        prospects={prospects}
        currentUser={currentUser}
        initialProspectId={searchParams?.prospectId}
        initialPhone={searchParams?.phone}
        teamMembers={activeTeamMembers}
      />
    </div>
  );
}
