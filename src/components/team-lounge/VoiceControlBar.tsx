"use client";

import React from "react";
import { Mic, MicOff, Headphones, PhoneOff, Signal } from "lucide-react";
import { UserRole } from "@/types/roles";

interface VoiceControlBarProps {
  userName: string;
  userRole: UserRole;
  avatarUrl?: string;
  activeChannelName?: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onDisconnect: () => void;
}

export function VoiceControlBar({
  userName,
  userRole,
  avatarUrl,
  activeChannelName,
  isMuted,
  isDeafened,
  isSpeaking,
  onToggleMute,
  onToggleDeafen,
  onDisconnect,
}: VoiceControlBarProps) {
  return (
    <div className="border-t border-slate-200/80 bg-slate-900 text-slate-100 p-2.5 rounded-b-lg">
      {/* Jika sedang terkoneksi ke voice channel, tampilkan status connection bar */}
      {activeChannelName && (
        <div className="flex items-center justify-between px-1.5 pb-2 mb-2 border-b border-slate-800 text-[11px]">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <Signal className="w-3.5 h-3.5 animate-pulse" />
            <div className="truncate max-w-[130px]">
              <span className="text-slate-400 text-[10px] block leading-none">Voice Connected</span>
              <span className="font-semibold text-slate-200">{activeChannelName}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onDisconnect}
            className="p-1.5 rounded-md bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
            title="Putus Panggilan Suara"
          >
            <PhoneOff className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Baris User Info & Kontrol Audio */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          <div className="relative shrink-0">
            <div
              className={`w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border transition-all ${
                isSpeaking
                  ? "border-emerald-400 ring-2 ring-emerald-400/40"
                  : "border-slate-700"
              }`}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
              ) : (
                userName.charAt(0).toUpperCase()
              )}
            </div>
            {isMuted && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-rose-600 flex items-center justify-center text-white border border-slate-900">
                <MicOff className="w-2 h-2" />
              </span>
            )}
          </div>

          <div className="truncate min-w-0">
            <div className="text-xs font-semibold text-slate-200 truncate leading-tight">
              {userName}
            </div>
            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
              <span>{userRole}</span>
              {isSpeaking && <span className="text-emerald-400 font-sans">• Berbicara</span>}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onToggleMute}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              isMuted
                ? "bg-rose-600/30 text-rose-400 hover:bg-rose-600 hover:text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
            title={isMuted ? "Nyalakan Mikrofon" : "Matikan Mikrofon"}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onToggleDeafen}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              isDeafened
                ? "bg-rose-600/30 text-rose-400 hover:bg-rose-600 hover:text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
            title={isDeafened ? "Nyalakan Audio Headset" : "Matikan Audio Headset (Deafen)"}
          >
            <Headphones className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
