"use client";

import { useState } from "react";
import {
  MessageSquare,
  Bot,
  Sparkles,
  ExternalLink,
  Send,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Plus,
  FileText,
} from "lucide-react";
import { ConversationThread } from "@/modules/inbox/types";
import { AIChatAnalysisOutput } from "@/modules/ai-agent/types";
import { pasteIncomingChatAction } from "@/modules/inbox/inbox.actions";
import { analyzeConversationAction } from "@/modules/ai-agent/ai-agent.actions";
import { formatDateTimeWIB } from "@/lib/date";

interface WhatsAppInboxViewProps {
  initialConversations: ConversationThread[];
}

export function WhatsAppInboxView({ initialConversations }: WhatsAppInboxViewProps) {
  const [conversations, setConversations] = useState<ConversationThread[]>(initialConversations);
  const [activeConvId, setActiveConvId] = useState<string>(
    initialConversations[0]?.id || ""
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIChatAnalysisOutput | null>(null);
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pastedChat, setPastedChat] = useState("");
  const [copiedDraft, setCopiedDraft] = useState(false);

  const activeConv = conversations.find((c) => c.id === activeConvId);

  const handleSelectConv = (id: string) => {
    setActiveConvId(id);
    setAiAnalysis(null);
  };

  const handleAnalyzeChat = async () => {
    if (!activeConv) return;
    setIsAnalyzing(true);
    const res = await analyzeConversationAction(activeConv.id);
    if (res.success && res.analysis) {
      setAiAnalysis(res.analysis);
    }
    setIsAnalyzing(false);
  };

  const handlePasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedChat.trim() || !activeConv) return;

    await pasteIncomingChatAction(activeConv.id, pastedChat);
    setPastedChat("");
    setPasteModalOpen(false);

    // Update local state for immediate feedback
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConv.id) {
          return {
            ...c,
            lastMessageSnippet: pastedChat.slice(0, 80),
            messages: [
              ...c.messages,
              {
                id: `msg-${Date.now()}`,
                conversationId: c.id,
                sender: "PROSPECT",
                text: pastedChat,
                isDraft: false,
                timestamp: new Date().toISOString(),
              },
            ],
          };
        }
        return c;
      })
    );
  };

  const handleCopyDraft = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  const handleOpenWhatsAppWeb = (draftText?: string) => {
    if (!activeConv) return;
    const text = draftText || "";
    const url = `https://wa.me/${activeConv.whatsappNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[600px]">
      {/* 1. KOLOM KIRI: DAFTAR PERCAKAPAN (4 Kolom) */}
      <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              WhatsApp Shared Inbox
            </h2>
            <p className="text-[11px] text-slate-500">Percakapan terhubung ke kontak CRM</p>
          </div>
          <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
            {conversations.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {conversations.map((c) => {
            const isSelected = c.id === activeConvId;

            return (
              <div
                key={c.id}
                onClick={() => handleSelectConv(c.id)}
                className={`p-4 transition-colors cursor-pointer flex flex-col gap-1 ${
                  isSelected ? "bg-indigo-50/80 border-l-4 border-indigo-600" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs truncate">
                    {c.companyName}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {formatDateTimeWIB(c.lastMessageAt).split(",")[1]}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 font-medium truncate">
                  {c.contactName}
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                  {c.lastMessageSnippet}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. KOLOM TENGAH: THREAD CHAT AKTIF (5 Kolom) */}
      <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {activeConv ? (
          <>
            {/* Header Thread */}
            <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  {activeConv.companyName}
                </h3>
                <div className="text-[11px] text-slate-500">
                  {activeConv.contactName} · +{activeConv.whatsappNumber}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPasteModalOpen(true)}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 transition-colors"
                >
                  + Paste Chat WA
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenWhatsAppWeb()}
                  title="Buka Chat di WhatsApp Web"
                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bubble Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
              {activeConv.messages.map((m) => {
                const isSales = m.sender === "SALES";
                const isAI = m.sender === "AI";

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${
                      isSales ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm ${
                        isSales
                          ? "bg-indigo-600 text-white rounded-br-sm"
                          : isAI
                          ? "bg-amber-50 text-slate-800 border-2 border-amber-300 rounded-bl-sm"
                          : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm"
                      }`}
                    >
                      {isAI && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1">
                          <Bot className="w-3 h-3 text-amber-600" />
                          Draf Rekomendasi AI
                        </div>
                      )}
                      <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 px-1">
                      {isSales ? "Sales" : isAI ? "AI Draft" : activeConv.contactName} ·{" "}
                      {formatDateTimeWIB(m.timestamp)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Quick Action Footer */}
            <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
              <span className="text-[11px] text-slate-500 italic flex-1">
                Gunakan asisten AI di panel kanan untuk menyusun balasan cerdas.
              </span>
              <button
                type="button"
                onClick={() => handleOpenWhatsAppWeb()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Buka WhatsApp Web
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
            Pilih percakapan untuk membaca riwayat pesan.
          </div>
        )}
      </div>

      {/* 3. KOLOM KANAN: AI SALES AGENT ASSISTANT (GEMINI) (3 Kolom) */}
      <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2 text-indigo-700">
          <Bot className="w-4 h-4" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            AI Sales Agent (Gemini)
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeConv ? (
            <>
              {/* Konteks Riset Prospek */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Konteks Riset Bisnis
                </span>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed line-clamp-3">
                  {activeConv.researchNotes}
                </p>
              </div>

              {/* Tombol Analisis AI */}
              <button
                type="button"
                onClick={handleAnalyzeChat}
                disabled={isAnalyzing}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {isAnalyzing ? "Gemini Menganalisis..." : "Analisis Percakapan dengan AI"}
              </button>

              {/* Hasil Analisis Gemini AI */}
              {aiAnalysis && (
                <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Warning jika butuh persetujuan Owner */}
                  {aiAnalysis.requiresCommercialApproval && (
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-rose-900">
                        <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        Persetujuan Owner Diperlukan
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        Terdeteksi permintaan komersial: {aiAnalysis.commercialApprovalDetails?.description}. Tiket otomatis diteruskan ke <strong>Approval Queue</strong>.
                      </p>
                    </div>
                  )}

                  {/* Ringkasan & Sentimen */}
                  <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-100 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900">
                        Rekomendasi Stage
                      </span>
                      <span className="font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded text-[10px]">
                        {aiAnalysis.suggestedStage}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-[11px]">
                      {aiAnalysis.summary}
                    </p>
                  </div>

                  {/* Draf Balasan Siap Kirim */}
                  <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                      <span>Draf Balasan Siap Kirim</span>
                      <button
                        type="button"
                        onClick={() => handleCopyDraft(aiAnalysis.suggestedDraftReply)}
                        className="text-[10px] text-amber-700 hover:text-amber-900 flex items-center gap-1"
                      >
                        {copiedDraft ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Tersalin
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Salin Draf
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-slate-800 bg-white p-3 rounded-lg border border-amber-200 leading-relaxed whitespace-pre-wrap">
                      {aiAnalysis.suggestedDraftReply}
                    </p>

                    <button
                      type="button"
                      onClick={() => handleOpenWhatsAppWeb(aiAnalysis.suggestedDraftReply)}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors mt-2"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Kirim via WhatsApp Web
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-xs text-slate-400">
              Pilih percakapan untuk mengaktifkan AI Sales Agent.
            </div>
          )}
        </div>
      </div>

      {/* DIALOG PASTE RAW WHATSAPP CHAT */}
      {pasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Paste Pesan Masuk dari WhatsApp Web
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Salin teks balasan yang Anda terima di WhatsApp Web dan tempelkan di sini agar riwayat tersimpan dan dapat dianalisis AI.
            </p>
            <form onSubmit={handlePasteSubmit} className="space-y-4">
              <textarea
                required
                rows={4}
                placeholder="Tempelkan pesan client di sini..."
                value={pastedChat}
                onChange={(e) => setPastedChat(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPasteModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Simpan Pesan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
