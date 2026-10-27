import { getAllConversations } from "@/modules/inbox/inbox.service";
import { getWhatsAppSession } from "@/modules/whatsapp/whatsapp.service";
import { getAllProspects } from "@/modules/crm/crm.service";
import { WhatsAppInboxView } from "@/components/inbox/WhatsAppInboxView";
import { getSessionCookie } from "@/modules/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  searchParams?: {
    prospectId?: string;
    phone?: string;
  };
}

export default async function WhatsAppInboxPage({ searchParams }: PageProps) {
  const [conversations, session, prospects, currentUser] = await Promise.all([
    getAllConversations(),
    getWhatsAppSession(),
    getAllProspects(),
    getSessionCookie(),
  ]);

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8 h-[calc(100vh-65px)]">
      <WhatsAppInboxView
        initialConversations={conversations}
        initialSession={session}
        prospects={prospects}
        currentUser={currentUser}
        initialProspectId={searchParams?.prospectId}
        initialPhone={searchParams?.phone}
      />
    </div>
  );
}
