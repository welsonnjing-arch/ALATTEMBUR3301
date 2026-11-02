"use client";

import React from "react";
import { Volume2, MicOff, Headphones, PhoneOff, Users } from "lucide-react";
import { VoiceParticipant } from "@/modules/team-lounge/types";

interface VoiceRoomStageProps {
  channelName: string;
  participants: VoiceParticipant[];
  speakingUsers: Set<string>;
  currentUserId: string;
  onDisconnect: () => void;
}

export function VoiceRoomStage({
  channelName,
  participants,
  speakingUsers,
  currentUserId,
  onDisconnect,
}: VoiceRoomStageProps) {
  return (
    <div className="bg-slate-900 text-slate-100 rounded-lg p-3 sm:p-4 border border-slate-800 shadow-sm space-y-3">
      {/* Header Stage */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white">{channelName}</h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                <Users className="w-2.5 h-2.5" />
                <span>{participants.length} Terhubung</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Koneksi suara peer-to-peer terenkripsi latensi rendah aktif
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDisconnect}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          <PhoneOff className="w-3.5 h-3.5" />
          <span>Tinggalkan Room</span>
        </button>
      </div>

      {/* Grid Partisipan Suara (Discord-Style Stage Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {participants.map((p) => {
          const isSpeaking = speakingUsers.has(p.userId) || p.isSpeaking;
          const isSelf = p.userId === currentUserId;

          return (
            <div
              key={p.userId}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all duration-150 ${
                isSpeaking
                  ? "bg-slate-800 border-emerald-500/80 shadow-xs shadow-emerald-500/20"
                  : "bg-slate-950/70 border-slate-800/80"
              }`}
            >
              <div className="relative mb-2">
                <div
                  className={`w-14 h-14 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-base overflow-hidden border-2 transition-all duration-150 ${
                    isSpeaking
                      ? "border-emerald-400 ring-4 ring-emerald-400/30 scale-105"
                      : "border-slate-700"
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

                {/* Status Badges di Avatar */}
                <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5">
                  {p.isMuted && (
                    <span
                      className="w-4 h-4 rounded-full bg-rose-600 flex items-center justify-center text-white border border-slate-900 shadow-2xs"
                      title="Mikrofon Mati"
                    >
                      <MicOff className="w-2.5 h-2.5" />
                    </span>
                  )}
                  {p.isDeafened && (
                    <span
                      className="w-4 h-4 rounded-full bg-rose-700 flex items-center justify-center text-white border border-slate-900 shadow-2xs"
                      title="Headset Mati"
                    >
                      <Headphones className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
              </div>

              <div className="w-full truncate">
                <div className="text-xs font-semibold text-slate-100 truncate">
                  {p.userName} {isSelf && <span className="text-slate-400 font-normal">(Anda)</span>}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {isSpeaking ? (
                    <span className="text-emerald-400 font-sans font-medium flex items-center justify-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Berbicara...
                    </span>
                  ) : (
                    p.userRole
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
