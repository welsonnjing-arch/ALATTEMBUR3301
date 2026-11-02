"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Hash,
  Volume2,
  Users,
  AlertCircle,
  Menu,
  X,
  Radio,
} from "lucide-react";
import { UserSessionData } from "@/modules/auth/types";
import {
  ChatMessage,
  TextChannel,
  VoiceChannel,
} from "@/modules/team-lounge/types";
import { useWebRTCVoice } from "./hooks/useWebRTCVoice";
import { VoiceControlBar } from "./VoiceControlBar";
import { VoiceChannelsList } from "./VoiceChannelsList";
import { TextChannelsList } from "./TextChannelsList";
import { VoiceRoomStage } from "./VoiceRoomStage";
import { ChatFeed } from "./ChatFeed";
import { ChatInput } from "./ChatInput";
import { useToast } from "@/components/common/Toast";

interface TeamLoungeViewProps {
  session: UserSessionData;
}

export function TeamLoungeView({ session }: TeamLoungeViewProps) {
  const { toast } = useToast();

  const [textChannels, setTextChannels] = useState<TextChannel[]>([]);
  const [voiceChannels, setVoiceChannels] = useState<VoiceChannel[]>([]);
  const [activeTextChannelId, setActiveTextChannelId] = useState<string>("tc-general");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // WebRTC Voice Hook
  const voice = useWebRTCVoice({
    currentUserId: session.id,
    currentUserName: session.fullName,
    currentUserRole: session.role,
    currentUserAvatar: session.avatarUrl,
  });

  // Ambil daftar channel saat pertama kali mount
  useEffect(() => {
    async function fetchChannels() {
      try {
        const res = await fetch("/api/team-lounge/messages");
        const data = await res.json();
        if (data.success) {
          setTextChannels(data.textChannels || []);
          setVoiceChannels(data.voiceChannels || []);
          if (data.textChannels && data.textChannels.length > 0) {
            setActiveTextChannelId(data.textChannels[0].id);
          }
        }
      } catch (err) {
        console.error("Gagal mengambil daftar channel:", err);
      }
    }
    fetchChannels();
  }, []);

  // Ambil riwayat pesan saat activeTextChannelId berubah
  const fetchMessages = useCallback(async (channelId: string) => {
    try {
      setIsLoadingMessages(true);
      const res = await fetch(`/api/team-lounge/messages?channelId=${channelId}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Gagal mengambil pesan channel:", err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (activeTextChannelId) {
      fetchMessages(activeTextChannelId);
    }
  }, [activeTextChannelId, fetchMessages]);

  // Polling pembaruan pesan baru setiap 2.5 detik
  useEffect(() => {
    if (!activeTextChannelId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/team-lounge/messages?channelId=${activeTextChannelId}`
        );
        const data = await res.json();
        if (data.success && data.messages) {
          setMessages((prev) => {
            // Hindari re-render tidak perlu jika jumlah dan ID pesan terakhir sama
            if (
              prev.length === data.messages.length &&
              prev[prev.length - 1]?.id ===
                data.messages[data.messages.length - 1]?.id
            ) {
              return prev;
            }
            return data.messages;
          });
        }
      } catch {}
    }, 2500);

    return () => clearInterval(interval);
  }, [activeTextChannelId]);

  // Kirim pesan baru
  const handleSendMessage = async (content: string) => {
    try {
      const res = await fetch("/api/team-lounge/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: activeTextChannelId,
          content,
        }),
      });
      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
      } else {
        toast.error(data.error || "Gagal mengirim pesan.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengirim pesan.");
    }
  };

  // Reaksi emoji
  const handleReact = async (messageId: string, emoji: string) => {
    try {
      // Optimistic update
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const reactions = { ...(m.reactions || {}) };
          const users = [...(reactions[emoji] || [])];
          const idx = users.indexOf(session.id);
          if (idx > -1) {
            users.splice(idx, 1);
            if (users.length === 0) delete reactions[emoji];
            else reactions[emoji] = users;
          } else {
            users.push(session.id);
            reactions[emoji] = users;
          }
          return { ...m, reactions };
        })
      );

      await fetch("/api/team-lounge/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, emoji }),
      });
    } catch {
      fetchMessages(activeTextChannelId);
    }
  };

  // Handler bergabung / pindah voice channel
  const handleSelectVoiceChannel = (channelId: string) => {
    if (voice.activeVoiceChannelId === channelId) {
      // Sudah ada di room yang sama
      return;
    }
    voice.joinVoiceChannel(channelId);
  };

  const currentTextChannel = textChannels.find(
    (c) => c.id === activeTextChannelId
  );
  const activeVoiceChannel = voiceChannels.find(
    (c) => c.id === voice.activeVoiceChannelId
  );
  const activeVoiceParticipants = voice.allParticipants.filter(
    (p) => p.channelId === voice.activeVoiceChannelId
  );

  return (
    <div className="flex h-[calc(100vh-5rem)] rounded-xl border border-slate-200/90 bg-white overflow-hidden shadow-xs relative">
      {/* Mobile Drawer Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-30 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Kolom Kiri: Sidebar Channels (Discord-Style) */}
      <aside
        className={`w-64 bg-slate-50/90 border-r border-slate-200/90 flex flex-col justify-between shrink-0 transition-transform duration-200 z-40 md:static md:translate-x-0 ${
          isMobileSidebarOpen
            ? "fixed inset-y-0 left-0 translate-x-0 shadow-2xl"
            : "fixed inset-y-0 left-0 -translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex-1 overflow-y-auto p-3 space-y-5">
          {/* Header Lounge */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div>
                <h1 className="font-bold text-xs text-slate-900 leading-tight">
                  Team Lounge HQ
                </h1>
                <span className="text-[10px] text-slate-500 font-mono">
                  Live Voice & Chat
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-1 md:hidden text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Saluran Suara (Voice Channels) */}
          <VoiceChannelsList
            channels={voiceChannels}
            activeChannelId={voice.activeVoiceChannelId}
            participants={voice.allParticipants}
            speakingUsers={voice.speakingUsers}
            isConnecting={voice.isConnecting}
            onSelectChannel={handleSelectVoiceChannel}
          />

          {/* Saluran Teks (Text Channels) */}
          <TextChannelsList
            channels={textChannels}
            activeChannelId={activeTextChannelId}
            onSelectChannel={(id) => {
              setActiveTextChannelId(id);
              setIsMobileSidebarOpen(false);
            }}
          />
        </div>

        {/* User Voice Control Bar (Bawah Kiri seperti Discord) */}
        <VoiceControlBar
          userName={session.fullName}
          userRole={session.role}
          avatarUrl={session.avatarUrl}
          activeChannelName={activeVoiceChannel?.name}
          isMuted={voice.isMuted}
          isDeafened={voice.isDeafened}
          isSpeaking={voice.isLocalSpeaking}
          onToggleMute={voice.toggleMute}
          onToggleDeafen={voice.toggleDeafen}
          onDisconnect={voice.leaveVoiceChannel}
        />
      </aside>

      {/* Area Tengah: Chat Feed & Panggung Voice */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Header Saluran Teks */}
        <header className="h-13 px-4 border-b border-slate-200/90 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-1.5 md:hidden text-slate-500 hover:text-slate-700 rounded-md hover:bg-slate-100"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 truncate">
              <Hash className="w-4 h-4 text-slate-400 shrink-0" />
              <h2 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                {currentTextChannel?.name || "general"}
              </h2>
            </div>

            {currentTextChannel?.topic && (
              <span className="hidden sm:inline-block text-xs text-slate-400 border-l border-slate-200 pl-2 truncate">
                {currentTextChannel.topic}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {voice.activeVoiceChannelId && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
                <Volume2 className="w-3 h-3" />
                <span>Panggilan Suara Aktif</span>
              </span>
            )}
          </div>
        </header>

        {/* Error Notification Banner jika ada */}
        {voice.error && (
          <div className="p-3 mx-4 mt-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{voice.error}</span>
          </div>
        )}

        {/* Panggung Voice Stage (Jika sedang terhubung ke Voice Channel) */}
        {voice.activeVoiceChannelId && activeVoiceChannel && (
          <div className="p-4 pb-0">
            <VoiceRoomStage
              channelName={activeVoiceChannel.name}
              participants={activeVoiceParticipants}
              speakingUsers={voice.speakingUsers}
              currentUserId={session.id}
              onDisconnect={voice.leaveVoiceChannel}
            />
          </div>
        )}

        {/* Chat Feed */}
        <ChatFeed
          messages={messages}
          currentUserId={session.id}
          channelName={currentTextChannel?.name || "general"}
          channelTopic={currentTextChannel?.topic}
          onReact={handleReact}
        />

        {/* Chat Input */}
        <ChatInput
          channelName={currentTextChannel?.name || "general"}
          onSendMessage={handleSendMessage}
        />
      </main>
    </div>
  );
}
