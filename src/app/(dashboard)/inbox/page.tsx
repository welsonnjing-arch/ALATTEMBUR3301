import { getAllConversations } from "@/modules/inbox/inbox.service";
import { WhatsAppInboxView } from "@/components/inbox/WhatsAppInboxView";

export default async function WhatsAppInboxPage() {
  const conversations = await getAllConversations();

  return (
    <div className="space-y-4">
      <WhatsAppInboxView initialConversations={conversations} />
    </div>
  );
}
