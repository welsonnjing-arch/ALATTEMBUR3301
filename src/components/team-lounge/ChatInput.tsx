"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Smile } from "lucide-react";

interface ChatInputProps {
  channelName: string;
  onSendMessage: (content: string) => Promise<void>;
  disabled?: boolean;
}

const QUICK_EMOJIS = ["👍", "❤️", "🔥", "🚀", "🙌", "😂", "✨", "🎉"];

export function ChatInput({
  channelName,
  onSendMessage,
  disabled = false,
}: ChatInputProps) {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea height based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        140
      )}px`;
    }
  }, [content]);

  // Click outside to close emoji picker
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setIsEmojiOpen(false);
      }
    };
    if (isEmojiOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEmojiOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || isSending || disabled) return;

    setIsSending(true);
    try {
      await onSendMessage(trimmed);
      setContent("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInsertEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
    setIsEmojiOpen(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="p-3 border-t border-slate-200/90 bg-white relative">
      {/* Quick Emoji Popover */}
      {isEmojiOpen && (
        <div
          ref={emojiRef}
          className="absolute bottom-full mb-2 left-4 bg-white border border-slate-200 rounded-lg p-2 shadow-lg flex items-center gap-1 z-20 animate-ios-fade"
        >
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleInsertEmoji(emoji)}
              className="p-1.5 hover:bg-slate-100 rounded text-base transition-colors cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
        <div className="flex-1 bg-slate-50 border border-slate-200/90 focus-within:border-slate-400 focus-within:bg-white rounded-lg transition-colors p-2 flex items-end gap-2 shadow-2xs">
          <textarea
            ref={textareaRef}
            rows={1}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Kirim pesan ke #${channelName}... (Tekan Enter untuk kirim)`}
            disabled={disabled || isSending}
            className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none max-h-36 py-1"
          />

          <button
            type="button"
            onClick={() => setIsEmojiOpen((prev) => !prev)}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors shrink-0 cursor-pointer"
            title="Pilih Emoji"
          >
            <Smile className="w-4 h-4" />
          </button>
        </div>

        <button
          type="submit"
          disabled={!content.trim() || isSending || disabled}
          className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 shadow-2xs cursor-pointer"
          title="Kirim Pesan"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
