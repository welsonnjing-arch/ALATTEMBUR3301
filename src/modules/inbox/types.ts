export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: "SALES" | "PROSPECT" | "AI";
  text: string;
  isDraft: boolean;
  timestamp: string;
  sentByUserId?: string;
  sentByUserName?: string;
  attachment?: {
    fileName: string;
    fileSize: string;
    mimeType: string;
  };
}

export interface ConversationThread {
  id: string;
  prospectId: string;
  companyName: string;
  contactName: string;
  whatsappNumber: string;
  remoteJid?: string;
  assignedSalesId?: string;
  assignedSalesName?: string;
  unreadCount: number;
  lastMessageSnippet: string;
  lastMessageAt: string;
  researchNotes: string;
  messages: ChatMessage[];
}
