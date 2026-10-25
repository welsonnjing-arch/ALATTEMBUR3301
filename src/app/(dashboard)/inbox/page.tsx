import { getAllConversations } from "@/modules/inbox/inbox.service";
import { getWhatsAppSession } from "@/modules/whatsapp/whatsapp.service";
import { getAllProspects } from "@/modules/crm/crm.service";
import { WhatsAppInboxView } from "@/components/inbox/WhatsAppInboxView";

export default async function WhatsAppInboxPage() {
  const [conversations, session, prospects] = await Promise.all([
    getAllConversations(),
    getWhatsAppSession(),
    getAllProspects(),
  ]);

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8 h-[calc(100vh-65px)]">
      <WhatsAppInboxView
        initialConversations={conversations}
        initialSession={session}
        prospects={prospects}
      />
    </div>
  );
}
