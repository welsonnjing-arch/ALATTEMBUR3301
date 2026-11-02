"use client";

import React from "react";
import { Hash, MessageSquare } from "lucide-react";
import { TextChannel } from "@/modules/team-lounge/types";

interface TextChannelsListProps {
  channels: TextChannel[];
  activeChannelId: string;
  onSelectChannel: (channelId: string) => void;
}

export function TextChannelsList({
  channels,
  activeChannelId,
  onSelectChannel,
}: TextChannelsListProps) {
  return (
    <div className="space-y-1">
      <div className="px-2 py-1 text-[11px] font-mono uppercase tracking-wider font-bold text-slate-500 flex items-center justify-between">
        <span>Saluran Teks (Chat)</span>
        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
      </div>

      <div className="space-y-0.5">
        {channels.map((ch) => {
          const isSelected = activeChannelId === ch.id;

          return (
            <button
              key={ch.id}
              type="button"
              onClick={() => onSelectChannel(ch.id)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer text-left ${
                isSelected
                  ? "bg-slate-200/90 text-slate-900 font-semibold"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Hash
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isSelected ? "text-slate-900" : "text-slate-400"
                  }`}
                />
                <span className="truncate">{ch.name}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
