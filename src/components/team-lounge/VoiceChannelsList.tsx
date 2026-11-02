"use client";

import React from "react";
import { Volume2, MicOff, Users, Loader2 } from "lucide-react";
import { VoiceChannel, VoiceParticipant } from "@/modules/team-lounge/types";

interface VoiceChannelsListProps {
  channels: VoiceChannel[];
  activeChannelId: string | null;
  participants: VoiceParticipant[];
  speakingUsers: Set<string>;
  isConnecting: boolean;
  onSelectChannel: (channelId: string) => void;
}

export function VoiceChannelsList({
  channels,
  activeChannelId,
  participants,
  speakingUsers,
  isConnecting,
  onSelectChannel,
}: VoiceChannelsListProps) {
  return (
    <div className="space-y-1">
      <div className="px-2 py-1 text-[11px] font-mono uppercase tracking-wider font-bold text-slate-500 flex items-center justify-between">
        <span>Saluran Suara (Voice)</span>
        <Volume2 className="w-3.5 h-3.5 text-slate-400" />
      </div>

      <div className="space-y-1">
        {channels.map((ch) => {
          const isCurrentActive = activeChannelId === ch.id;
          const channelParticipants = participants.filter((p) => p.channelId === ch.id);

          return (
            <div key={ch.id} className="space-y-1">
              <button
                type="button"
                onClick={() => onSelectChannel(ch.id)}
                disabled={isConnecting}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer text-left ${
                  isCurrentActive
                    ? "bg-slate-900 text-white font-semibold"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {isConnecting && isCurrentActive ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  ) : (
                    <Volume2
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isCurrentActive ? "text-emerald-400" : "text-slate-400"
                      }`}
                    />
                  )}
                  <span className="truncate">{ch.name}</span>
                </div>

                {channelParticipants.length > 0 && (
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      isCurrentActive
                        ? "bg-slate-800 text-slate-200"
                        : "bg-slate-200/80 text-slate-700"
                    }`}
                  >
                    <Users className="w-2.5 h-2.5" />
                    <span>{channelParticipants.length}</span>
                  </span>
                )}
              </button>

              {/* Tampilkan partisipan yang sedang ada di dalam channel ini */}
              {channelParticipants.length > 0 && (
                <div className="pl-6 pr-2 space-y-1 pb-1">
                  {channelParticipants.map((p) => {
                    const isSpeaking = speakingUsers.has(p.userId) || p.isSpeaking;

                    return (
                      <div
                        key={p.userId}
                        className={`flex items-center justify-between px-2 py-1 rounded text-[11px] transition-colors ${
                          isSpeaking ? "bg-emerald-50/80 text-slate-900" : "text-slate-600"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className="relative shrink-0">
                            <div
                              className={`w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[9px] overflow-hidden border transition-all ${
                                isSpeaking
                                  ? "border-emerald-500 ring-2 ring-emerald-500/30"
                                  : "border-slate-300"
                              }`}
                            >
                              {p.avatarUrl ? (
                                <img
                                  src={p.avatarUrl}
                                  alt={p.userName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                p.userName.charAt(0).toUpperCase()
                              )}
                            </div>
                          </div>
                          <span className="truncate">{p.userName}</span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {p.isMuted && (
                            <span title="Mikrofon Mati">
                              <MicOff className="w-3 h-3 text-rose-500" />
                            </span>
                          )}
                          {isSpeaking && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
