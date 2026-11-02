import { UserRole } from "@/types/roles";

export interface TextChannel {
  id: string;
  name: string;
  topic?: string;
  isPrivate?: boolean;
  allowedRoles?: UserRole[];
  createdAt: string;
}

export interface VoiceChannel {
  id: string;
  name: string;
  description?: string;
  maxParticipants?: number;
  allowedRoles?: UserRole[];
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  avatarUrl?: string;
  content: string;
  createdAt: string;
  reactions?: Record<string, string[]>; // emoji -> array of userIds
}

export interface VoiceParticipant {
  userId: string;
  userName: string;
  userRole: UserRole;
  avatarUrl?: string;
  channelId: string;
  joinedAt: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  lastPing: number;
}

export type SignalType = "join" | "leave" | "offer" | "answer" | "candidate" | "state_change";

export interface SignalingMessage {
  id: string;
  fromUserId: string;
  toUserId?: string; // empty means broadcast to entire channel
  channelId: string;
  type: SignalType;
  payload: any;
  timestamp: number;
}

export interface TeamLoungeStore {
  textChannels: TextChannel[];
  voiceChannels: VoiceChannel[];
  messages: ChatMessage[];
}
