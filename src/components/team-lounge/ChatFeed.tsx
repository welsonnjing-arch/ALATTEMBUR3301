"use client";

import React, { useEffect, useRef } from "react";
import { Smile, Hash } from "lucide-react";
import { ChatMessage } from "@/modules/team-lounge/types";

interface ChatFeedProps {
  messages: ChatMessage[];
  currentUserId: string;
  channelName: string;
  channelTopic?: string;
  onReact: (messageId: string, emoji: string) => void;
}

const COMMON_REACTIONS = ["👍", "❤️", "🔥", "🚀", "👀", "🎉"];

export function ChatFeed({
  messages,
  currentUserId,
  channelName,
  channelTopic,
  onReact,
}: ChatFeedProps) {
  const feedEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Channel Header Welcome Banner */}
      <div className="border-b border-slate-200/80 pb-4 mb-2">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 mb-2 border border-slate-200">
          <Hash className="w-5 h-5" />
        </div>
        <h2 className="text-base font-bold text-slate-900">
          Selamat datang di #{channelName}!
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {channelTopic || "Ini adalah awal dari riwayat saluran ini."}
        </p>
      </div>

      {messages.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">
          Belum ada pesan di saluran ini. Mulai percakapan sekarang!
        </div>
      ) : (
        messages.map((msg, index) => {
          const isSameSenderAsPrev =
            index > 0 &&
            messages[index - 1].userId === msg.userId &&
            new Date(msg.createdAt).getTime() -
              new Date(messages[index - 1].createdAt).getTime() <
              5 * 60 * 1000;

          const dateObj = new Date(msg.createdAt);
          const timeFormatted = dateObj.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div
              key={msg.id}
              className={`group flex items-start gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50/80 relative ${
                isSameSenderAsPrev ? "pt-0.5" : "pt-2"
              }`}
            >
              {/* Avatar column */}
              {!isSameSenderAsPrev ? (
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-slate-300 mt-0.5">
                  {msg.avatarUrl ? (
                    <img
                      src={msg.avatarUrl}
                      alt={msg.userName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    msg.userName.charAt(0).toUpperCase()
                  )}
                </div>
              ) : (
                <div className="w-8 shrink-0 text-right opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 font-mono select-none">
                  {timeFormatted}
                </div>
              )}

              {/* Message Content column */}
              <div className="flex-1 min-w-0">
                {!isSameSenderAsPrev && (
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-xs text-slate-900 leading-tight">
                      {msg.userName}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      {msg.userRole}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {timeFormatted} WIB
                    </span>
                  </div>
                )}

                <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
                  {msg.content}
                </div>

                {/* Reactions display */}
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    {Object.entries(msg.reactions).map(([emoji, userIds]) => {
                      const hasReacted = userIds.includes(currentUserId);
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => onReact(msg.id, emoji)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border transition-colors cursor-pointer ${
                            hasReacted
                              ? "bg-blue-50 border-blue-300 text-blue-700 font-medium"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <span>{emoji}</span>
                          <span className="font-mono text-[10px]">{userIds.length}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Hover Quick Reaction Bar */}
              <div className="absolute right-2 -top-3.5 hidden group-hover:flex items-center gap-0.5 p-0.5 bg-white border border-slate-200 rounded-md shadow-xs z-10">
                {COMMON_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => onReact(msg.id, emoji)}
                    className="p-1 hover:bg-slate-100 rounded text-xs transition-colors cursor-pointer"
                    title={`Beri reaksi ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          );
        })
      )}

      <div ref={feedEndRef} />
    </div>
  );
}
