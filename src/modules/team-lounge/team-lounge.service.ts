import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { UserRole } from "@/types/roles";
import {
  ChatMessage,
  SignalingMessage,
  TeamLoungeStore,
  TextChannel,
  VoiceChannel,
  VoiceParticipant,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "team-lounge.json");

// Default initial seeds if store file does not exist
const DEFAULT_TEXT_CHANNELS: TextChannel[] = [
  {
    id: "tc-general",
    name: "general",
    topic: "Ruang obrolan umum seluruh tim Fynux OS",
    createdAt: new Date().toISOString(),
  },
  {
    id: "tc-dev",
    name: "dev-talk",
    topic: "Diskusi teknikal arsitektur, bug fixing, dan deliverable",
    createdAt: new Date().toISOString(),
  },
  {
    id: "tc-sales",
    name: "sales-war-room",
    topic: "Koordinasi pipeline leads, follow up prospek, dan closing",
    createdAt: new Date().toISOString(),
  },
  {
    id: "tc-announcements",
    name: "pengumuman",
    topic: "Informasi resmi internal perusahaan & milestone",
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_VOICE_CHANNELS: VoiceChannel[] = [
  {
    id: "vc-lounge",
    name: "Lounge Utama",
    description: "Ruang santai & diskusi terbuka seluruh anggota tim",
    maxParticipants: 20,
    createdAt: new Date().toISOString(),
  },
  {
    id: "vc-dev-standup",
    name: "Dev Standup",
    description: "Daily standup meeting & pair programming teknikal",
    maxParticipants: 10,
    createdAt: new Date().toISOString(),
  },
  {
    id: "vc-sales-closing",
    name: "War Room Sales",
    description: "Ruang koordinasi cepat penawaran & closing client",
    maxParticipants: 10,
    createdAt: new Date().toISOString(),
  },
];

// Persistent Store Loader
export function loadStore(): TeamLoungeStore {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(STORE_FILE)) {
      const initial: TeamLoungeStore = {
        textChannels: DEFAULT_TEXT_CHANNELS,
        voiceChannels: DEFAULT_VOICE_CHANNELS,
        messages: [
          {
            id: "msg-welcome-1",
            channelId: "tc-general",
            userId: "system",
            userName: "Fynux System",
            userRole: "OWNER",
            content: "Selamat datang di Fynux Team Lounge! Gunakan saluran ini untuk koordinasi real-time dan saluran suara di samping untuk panggilan langsung ala Discord.",
            createdAt: new Date().toISOString(),
          },
        ],
      };
      fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }

    const content = fs.readFileSync(STORE_FILE, "utf-8");
    const parsed = JSON.parse(content);
    return {
      textChannels: parsed.textChannels || DEFAULT_TEXT_CHANNELS,
      voiceChannels: parsed.voiceChannels || DEFAULT_VOICE_CHANNELS,
      messages: parsed.messages || [],
    };
  } catch (err) {
    console.error("[TEAM_LOUNGE] Gagal membaca store:", err);
    return {
      textChannels: DEFAULT_TEXT_CHANNELS,
      voiceChannels: DEFAULT_VOICE_CHANNELS,
      messages: [],
    };
  }
}

export function saveStore(store: TeamLoungeStore): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.error("[TEAM_LOUNGE] Gagal menyimpan store:", err);
  }
}

// In-Memory Real-time State
// Persists across HTTP calls in Node.js runtime
interface LoungeRuntimeState {
  participants: Map<string, VoiceParticipant>; // userId -> VoiceParticipant
  signalBuffers: Map<string, SignalingMessage[]>; // userId -> SignalingMessage[]
}

const globalForLounge = globalThis as unknown as {
  __fynuxLoungeState?: LoungeRuntimeState;
};

if (!globalForLounge.__fynuxLoungeState) {
  globalForLounge.__fynuxLoungeState = {
    participants: new Map<string, VoiceParticipant>(),
    signalBuffers: new Map<string, SignalingMessage[]>(),
  };
}

const runtimeState = globalForLounge.__fynuxLoungeState;

// Prune inactive participants (no ping within 25s)
export function pruneStaleParticipants(): void {
  const now = Date.now();
  const timeoutMs = 25000;
  const staleUserIds: string[] = [];

  runtimeState.participants.forEach((p, userId) => {
    if (now - p.lastPing > timeoutMs) {
      staleUserIds.push(userId);
    }
  });

  staleUserIds.forEach((userId) => {
    const p = runtimeState.participants.get(userId);
    runtimeState.participants.delete(userId);
    if (p) {
      // Broadcast leave signal
      queueSignal({
        id: crypto.randomUUID(),
        fromUserId: userId,
        channelId: p.channelId,
        type: "leave",
        payload: { userId },
        timestamp: now,
      });
    }
  });
}

// Channels & Chat Actions
export function getTextChannels(): TextChannel[] {
  return loadStore().textChannels;
}

export function getVoiceChannels(): VoiceChannel[] {
  return loadStore().voiceChannels;
}

export function getMessages(channelId: string, limit = 100): ChatMessage[] {
  const store = loadStore();
  return store.messages
    .filter((m) => m.channelId === channelId)
    .slice(-limit);
}

export function createMessage(
  channelId: string,
  user: { id: string; fullName: string; role: UserRole; avatarUrl?: string },
  content: string
): ChatMessage {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error("Pesan tidak boleh kosong.");
  }

  const store = loadStore();
  const newMsg: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    channelId,
    userId: user.id,
    userName: user.fullName,
    userRole: user.role,
    avatarUrl: user.avatarUrl,
    content: trimmed,
    createdAt: new Date().toISOString(),
  };

  store.messages.push(newMsg);
  // Cap at 2000 total messages to keep file lightweight
  if (store.messages.length > 2000) {
    store.messages = store.messages.slice(-1500);
  }

  saveStore(store);
  return newMsg;
}

export function toggleReaction(
  messageId: string,
  userId: string,
  emoji: string
): ChatMessage | null {
  const store = loadStore();
  const msg = store.messages.find((m) => m.id === messageId);
  if (!msg) return null;

  if (!msg.reactions) {
    msg.reactions = {};
  }

  const currentUsers = msg.reactions[emoji] || [];
  const idx = currentUsers.indexOf(userId);
  if (idx > -1) {
    currentUsers.splice(idx, 1);
    if (currentUsers.length === 0) {
      delete msg.reactions[emoji];
    } else {
      msg.reactions[emoji] = currentUsers;
    }
  } else {
    currentUsers.push(userId);
    msg.reactions[emoji] = currentUsers;
  }

  saveStore(store);
  return msg;
}

// Voice Channels & WebRTC Signaling Engine
export function joinVoiceChannel(
  channelId: string,
  user: { id: string; fullName: string; role: UserRole; avatarUrl?: string },
  initialState?: { isMuted?: boolean; isDeafened?: boolean }
): VoiceParticipant {
  pruneStaleParticipants();

  // If already in another room, leave it first
  const existing = runtimeState.participants.get(user.id);
  if (existing && existing.channelId !== channelId) {
    leaveVoiceChannel(user.id);
  }

  const participant: VoiceParticipant = {
    userId: user.id,
    userName: user.fullName,
    userRole: user.role,
    avatarUrl: user.avatarUrl,
    channelId,
    joinedAt: new Date().toISOString(),
    isMuted: initialState?.isMuted || false,
    isDeafened: initialState?.isDeafened || false,
    isSpeaking: false,
    lastPing: Date.now(),
  };

  runtimeState.participants.set(user.id, participant);

  // Broadcast join signal to others in this voice channel
  queueSignal({
    id: crypto.randomUUID(),
    fromUserId: user.id,
    channelId,
    type: "join",
    payload: {
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      avatarUrl: user.avatarUrl,
      isMuted: participant.isMuted,
      isDeafened: participant.isDeafened,
    },
    timestamp: Date.now(),
  });

  return participant;
}

export function leaveVoiceChannel(userId: string): void {
  const current = runtimeState.participants.get(userId);
  if (!current) return;

  runtimeState.participants.delete(userId);

  // Broadcast leave signal
  queueSignal({
    id: crypto.randomUUID(),
    fromUserId: userId,
    channelId: current.channelId,
    type: "leave",
    payload: { userId },
    timestamp: Date.now(),
  });
}

export function updateVoiceState(
  userId: string,
  state: {
    isMuted?: boolean;
    isDeafened?: boolean;
    isSpeaking?: boolean;
    pingOnly?: boolean;
  }
): VoiceParticipant | null {
  pruneStaleParticipants();

  const current = runtimeState.participants.get(userId);
  if (!current) return null;

  current.lastPing = Date.now();

  let changed = false;
  if (state.isMuted !== undefined && current.isMuted !== state.isMuted) {
    current.isMuted = state.isMuted;
    changed = true;
  }
  if (state.isDeafened !== undefined && current.isDeafened !== state.isDeafened) {
    current.isDeafened = state.isDeafened;
    changed = true;
  }
  if (state.isSpeaking !== undefined && current.isSpeaking !== state.isSpeaking) {
    current.isSpeaking = state.isSpeaking;
    changed = true;
  }

  if (changed && !state.pingOnly) {
    queueSignal({
      id: crypto.randomUUID(),
      fromUserId: userId,
      channelId: current.channelId,
      type: "state_change",
      payload: {
        userId,
        isMuted: current.isMuted,
        isDeafened: current.isDeafened,
        isSpeaking: current.isSpeaking,
      },
      timestamp: Date.now(),
    });
  }

  return current;
}

export function getVoiceParticipants(channelId?: string): VoiceParticipant[] {
  pruneStaleParticipants();
  const all = Array.from(runtimeState.participants.values());
  if (channelId) {
    return all.filter((p) => p.channelId === channelId);
  }
  return all;
}

// Queue WebRTC signal to target recipient or broadcast to channel
export function queueSignal(signal: SignalingMessage): void {
  pruneStaleParticipants();

  if (signal.toUserId) {
    // Direct unicast signal
    const buf = runtimeState.signalBuffers.get(signal.toUserId) || [];
    buf.push(signal);
    runtimeState.signalBuffers.set(signal.toUserId, buf);
  } else {
    // Broadcast signal to everyone else in this voice channel
    const peers = getVoiceParticipants(signal.channelId).filter(
      (p) => p.userId !== signal.fromUserId
    );
    for (const peer of peers) {
      const buf = runtimeState.signalBuffers.get(peer.userId) || [];
      buf.push({ ...signal, toUserId: peer.userId });
      runtimeState.signalBuffers.set(peer.userId, buf);
    }
  }
}

// Read and drain signals for a specific user
export function consumeSignals(userId: string): SignalingMessage[] {
  const current = runtimeState.participants.get(userId);
  if (current) {
    current.lastPing = Date.now();
  }

  const buf = runtimeState.signalBuffers.get(userId) || [];
  runtimeState.signalBuffers.set(userId, []); // drain queue
  return buf;
}
