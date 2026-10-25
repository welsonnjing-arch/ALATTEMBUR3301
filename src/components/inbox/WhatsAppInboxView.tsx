"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search,
  Send,
  Paperclip,
  Smile,
  Mic,
  MoreVertical,
  CheckCheck,
  Check,
  Smartphone,
  Plus,
  Building2,
  Phone,
  Sparkles,
  RefreshCw,
  X,
  MessageSquare,
  ArrowLeft,
  ChevronDown,
  UserCheck,
} from "lucide-react";
import { ConversationThread, ChatMessage } from "@/modules/inbox/types";
import { WhatsAppSessionInfo } from "@/modules/whatsapp/types";
import { Prospect } from "@/modules/crm/types";
import {
  sendWhatsAppMessageAction,
  simulateIncomingWhatsAppMessageAction,
} from "@/modules/whatsapp/whatsapp.actions";
import { WhatsAppPairingModal } from "@/components/whatsapp/WhatsAppPairingModal";
import { formatDateTimeWIB } from "@/lib/date";

interface WhatsAppInboxViewProps {
  initialConversations: ConversationThread[];
  initialSession: WhatsAppSessionInfo;
  prospects: Prospect[];
}

export function WhatsAppInboxView({
  initialConversations,
  initialSession,
  prospects,
}: WhatsAppInboxViewProps) {
  const [conversations, setConversations] = useState<ConversationThread[]>(initialConversations);
  const [activeConvId, setActiveConvId] = useState<string>(
    initialConversations[0]?.id || ""
  );
  const [session, setSession] = useState<WhatsAppSessionInfo>(initialSession);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"ALL" | "UNREAD" | "CRM">("ALL");

  // State Pesan Aktif
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // Modals
  const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

  // Auto scroll ke pesan terbawah
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConvId);

  // Cari data prospek CRM yang bersesuaian dengan percakapan aktif
  const activeProspect = activeConv
    ? prospects.find(
        (p) =>
          p.whatsappNumber.replace(/\D/g, "") ===
          activeConv.whatsappNumber.replace(/\D/g, "")
      )
    : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages]);

  // Real-time auto-sync percakapan dari server setiap 2 detik
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      try {
        const res = await fetch("/api/whatsapp/conversations", { cache: "no-store" });
        if (res.ok) {
          const latest: ConversationThread[] = await res.json();
          setConversations((prev) => {
            const hasChange =
              prev.length !== latest.length ||
              latest.some((c) => {
                const prevItem = prev.find((p) => p.id === c.id);
                return (
                  !prevItem ||
                  prevItem.messages.length !== c.messages.length ||
                  prevItem.lastMessageSnippet !== c.lastMessageSnippet ||
                  prevItem.unreadCount !== c.unreadCount
                );
              });
            return hasChange ? latest : prev;
          });
        }
      } catch (err) {
        // Abaikan error polling background
      }
    }, 2000);

    return () => clearInterval(syncInterval);
  }, []);

  // Filter daftar percakapan
  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      c.companyName.toLowerCase().includes(q) ||
      c.contactName.toLowerCase().includes(q) ||
      c.whatsappNumber.includes(q) ||
      c.lastMessageSnippet.toLowerCase().includes(q);

    if (!matchSearch) return false;

    if (filterTab === "UNREAD") return c.unreadCount > 0;
    if (filterTab === "CRM") return !!c.prospectId;
    return true;
  });

  // Kirim Pesan
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeConv || isSending) return;

    const textToSend = inputText.trim();
    setInputText("");
    setIsSending(true);

    // Optimistic UI update
    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversationId: activeConv.id,
      sender: "SALES",
      text: textToSend,
      isDraft: false,
      timestamp: new Date().toISOString(),
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConv.id) {
          return {
            ...c,
            lastMessageSnippet: textToSend.slice(0, 80),
            lastMessageAt: optimisticMsg.timestamp,
            messages: [...c.messages, optimisticMsg],
          };
        }
        return c;
      })
    );

    // Panggil Server Action pengiriman pesan & sinkronisasi CRM
    await sendWhatsAppMessageAction({
      whatsappNumber: activeConv.whatsappNumber,
      text: textToSend,
      prospectId: activeConv.prospectId,
    });

    setIsSending(false);
  };

  // Simulasi pesan masuk dari klien (untuk menguji pemicu panggung CRM ke RESPONDED)
  const handleSimulateClientReply = async () => {
    if (!activeConv || isSimulating) return;

    const sampleReplies = [
      "Halo mas, terima kasih infonya. Boleh minta proposal dan rincian harga untuk paket website-nya?",
      "Siang, kami tertarik dengan penawaran ini. Apakah bisa dijadwalkan demo singkat via Google Meet?",
      "Halo Mas Budi, apakah ada diskon khusus jika kami memesan paket business website bulan ini?",
      "Terima kasih atas follow-up-nya, kami pelajari dulu dengan tim direksi ya.",
    ];

    const randomReply =
      sampleReplies[Math.floor(Math.random() * sampleReplies.length)];

    setIsSimulating(true);

    // Optimistic UI
    const incomingMsg: ChatMessage = {
      id: `sim-${Date.now()}`,
      conversationId: activeConv.id,
      sender: "PROSPECT",
      text: randomReply,
      isDraft: false,
      timestamp: new Date().toISOString(),
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConv.id) {
          return {
            ...c,
            lastMessageSnippet: randomReply.slice(0, 80),
            lastMessageAt: incomingMsg.timestamp,
            unreadCount: c.unreadCount + 1,
            messages: [...c.messages, incomingMsg],
          };
        }
        return c;
      })
    );

    await simulateIncomingWhatsAppMessageAction(
      activeConv.whatsappNumber,
      randomReply
    );

    setIsSimulating(false);
  };

  // Warna badge status panggung CRM
  const getStageBadge = (stage?: string) => {
    switch (stage) {
      case "NEW":
        return "bg-slate-100 text-slate-700 border-slate-300";
      case "CONTACTED":
        return "bg-sky-50 text-sky-700 border-sky-300";
      case "RESPONDED":
        return "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold";
      case "ENGAGED":
        return "bg-indigo-50 text-indigo-700 border-indigo-300 font-bold";
      case "QUALIFIED":
        return "bg-purple-50 text-purple-700 border-purple-300 font-bold";
      case "NEGOTIATION":
        return "bg-amber-50 text-amber-700 border-amber-300 font-bold";
      case "PENDING":
        return "bg-orange-50 text-orange-700 border-orange-300";
      case "CLOSED_WON":
        return "bg-emerald-600 text-white font-bold border-emerald-600";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="flex h-full w-full bg-[#f0f2f5] overflow-hidden border border-[#d1d7db] shadow-xl rounded-xl">
      {/* ======================================================== */}
      {/* 1. SIDEBAR KIRI: DAFTAR CHAT (1:1 WHATSAPP WEB STYLE)   */}
      {/* ======================================================== */}
      <div className="w-full md:w-[380px] lg:w-[420px] bg-white flex flex-col border-r border-[#e9edef] flex-shrink-0">
        {/* Header Sidebar Khas WhatsApp Web */}
        <div className="h-16 bg-[#f0f2f5] px-4 py-2.5 flex items-center justify-between border-b border-[#e9edef]">
          {/* Avatar & Identitas */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-[#00a884] text-white font-bold flex items-center justify-center text-sm shadow-sm">
                FN
              </div>
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                  session.status === "CONNECTED"
                    ? "bg-[#25d366]"
                    : "bg-amber-400 animate-pulse"
                }`}
              />
            </div>
            <div>
              <div className="text-xs font-bold text-[#111b21] leading-tight">
                Fynux WhatsApp
              </div>
              <div className="text-[11px] text-[#667781] leading-tight">
                {session.status === "CONNECTED"
                  ? `+${session.phoneNumber}`
                  : "Perangkat Belum Tertaut"}
              </div>
            </div>
          </div>

          {/* Action Icons: Pairing & New Chat */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsPairingModalOpen(true)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                session.status === "CONNECTED"
                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                  : "bg-[#00a884] text-white hover:bg-[#008f6f] shadow-sm animate-pulse"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>
                {session.status === "CONNECTED" ? "Terhubung" : "Tautkan WA"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsNewChatModalOpen(true)}
              title="Mulai Chat Prospek Baru"
              className="p-2 text-[#54656f] hover:bg-slate-200/60 rounded-full transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Kolom Pencarian WhatsApp Web */}
        <div className="p-2 border-b border-[#f0f2f5] bg-white">
          <div className="relative flex items-center bg-[#f0f2f5] rounded-lg px-3 py-1.5 focus-within:bg-white focus-within:ring-1 focus-within:ring-[#00a884] transition-all">
            <Search className="w-4 h-4 text-[#54656f] mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="Cari atau mulai chat baru"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-[#111b21] placeholder-[#667781] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 mt-2 px-1">
            <button
              type="button"
              onClick={() => setFilterTab("ALL")}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
                filterTab === "ALL"
                  ? "bg-[#e7fce3] text-[#008069] font-bold"
                  : "bg-[#f0f2f5] text-[#54656f] hover:bg-slate-200/60"
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("UNREAD")}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
                filterTab === "UNREAD"
                  ? "bg-[#e7fce3] text-[#008069] font-bold"
                  : "bg-[#f0f2f5] text-[#54656f] hover:bg-slate-200/60"
              }`}
            >
              Belum Dibaca
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("CRM")}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
                filterTab === "CRM"
                  ? "bg-[#e7fce3] text-[#008069] font-bold"
                  : "bg-[#f0f2f5] text-[#54656f] hover:bg-slate-200/60"
              }`}
            >
              Prospek CRM
            </button>
          </div>
        </div>

        {/* Daftar Chat List (WhatsApp Web Item List) */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#f0f2f5]">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((c) => {
              const isSelected = c.id === activeConvId;
              const prospect = prospects.find(
                (p) =>
                  p.whatsappNumber.replace(/\D/g, "") ===
                  c.whatsappNumber.replace(/\D/g, "")
              );

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setActiveConvId(c.id);
                    // Mark as read
                    if (c.unreadCount > 0) {
                      setConversations((prev) =>
                        prev.map((item) =>
                          item.id === c.id ? { ...item, unreadCount: 0 } : item
                        )
                      );
                    }
                  }}
                  className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[#f0f2f5]"
                      : "hover:bg-[#f5f6f6] bg-white"
                  }`}
                >
                  {/* Round Avatar */}
                  <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-sm flex-shrink-0 shadow-inner">
                    {c.companyName.substring(0, 2).toUpperCase()}
                  </div>

                  {/* Konten Chat Item */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-[#111b21] truncate">
                        {c.contactName}
                      </h4>
                      <span className="text-[10px] text-[#667781] flex-shrink-0">
                        {c.lastMessageAt
                          ? new Date(c.lastMessageAt).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-indigo-700 font-medium truncate max-w-[150px]">
                        {c.companyName}
                      </span>
                      {prospect && (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold ${getStageBadge(
                            prospect.stage
                          )}`}
                        >
                          {prospect.stage}
                        </span>
                      )}
                    </div>

                    {/* Snippet Pesan & Double Check */}
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1 text-[11px] text-[#667781] truncate">
                        <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] flex-shrink-0" />
                        <span className="truncate">{c.lastMessageSnippet}</span>
                      </div>

                      {c.unreadCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-[#25d366] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 ml-1">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-[#667781]">
              Tidak ada percakapan ditemukan.
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. RUANG CHAT AKTIF (1:1 WHATSAPP WEB CHAT WINDOW)       */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col h-full bg-[#efeae2] relative">
        {activeConv ? (
          <>
            {/* Header Ruang Chat */}
            <div className="h-16 bg-[#f0f2f5] px-4 py-2.5 flex items-center justify-between border-b border-[#d1d7db] z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-300 text-slate-700 font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
                  {activeConv.companyName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-[#111b21]">
                      {activeConv.contactName}
                    </h3>
                    {activeProspect && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${getStageBadge(
                          activeProspect.stage
                        )}`}
                      >
                        CRM: {activeProspect.stage}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#667781] flex items-center gap-1">
                    <span>{activeConv.companyName}</span>
                    <span>·</span>
                    <span>+{activeConv.whatsappNumber}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons di Header Chat */}
              <div className="flex items-center gap-2">
                {/* Tombol Simulasi Balasan Klien */}
                <button
                  type="button"
                  onClick={handleSimulateClientReply}
                  disabled={isSimulating}
                  title="Simulasi pesan masuk dari prospek ini untuk memicu status CRM ke RESPONDED"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 shadow-sm transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>{isSimulating ? "Menerima..." : "Simulasi Klien Balas"}</span>
                </button>

                <button
                  type="button"
                  className="p-2 text-[#54656f] hover:bg-slate-200/60 rounded-full transition-colors"
                >
                  <Search className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="p-2 text-[#54656f] hover:bg-slate-200/60 rounded-full transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bubble Messages Area (Wallpaper WhatsApp) */}
            <div
              className="flex-1 overflow-y-auto p-4 md:px-8 space-y-2.5"
              style={{
                backgroundImage: `radial-gradient(#d3cbbd 0.8px, transparent 0.8px)`,
                backgroundSize: "16px 16px",
              }}
            >
              {/* Tanggal Separator WhatsApp */}
              <div className="flex justify-center my-3">
                <span className="bg-white/90 text-[#54656f] text-[10px] font-bold px-3 py-1 rounded-lg shadow-sm border border-slate-200/60 uppercase tracking-wider">
                  Hari Ini
                </span>
              </div>

              {/* Daftar Pesan Bubble */}
              {activeConv.messages.map((m) => {
                const isSales = m.sender === "SALES";

                return (
                  <div
                    key={m.id}
                    className={`flex ${isSales ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`relative max-w-[85%] md:max-w-[70%] px-3.5 py-2 rounded-lg text-xs shadow-sm ${
                        isSales
                          ? "bg-[#d9fdd3] text-[#111b21] rounded-tr-none"
                          : "bg-white text-[#111b21] rounded-tl-none border border-slate-200/40"
                      }`}
                    >
                      {/* Teks Pesan */}
                      <p className="whitespace-pre-wrap leading-relaxed pr-14 text-xs">
                        {m.text}
                      </p>

                      {/* Micro Timestamp & Centang Pengiriman */}
                      <div className="absolute bottom-1 right-2 flex items-center gap-1 select-none">
                        <span className="text-[9px] text-[#667781]">
                          {new Date(m.timestamp).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {isSales && (
                          <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Bar: Kolom Input Pesan 1:1 WhatsApp Web */}
            <div className="bg-[#f0f2f5] px-4 py-2.5 flex items-center gap-2 border-t border-[#d1d7db] z-10">
              <button
                type="button"
                className="p-2 text-[#54656f] hover:bg-slate-200/60 rounded-full transition-colors"
              >
                <Smile className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="p-2 text-[#54656f] hover:bg-slate-200/60 rounded-full transition-colors"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* Input Form Pill */}
              <form onSubmit={handleSendMessage} className="flex-1 flex items-center">
                <input
                  type="text"
                  placeholder="Ketik pesan WhatsApp..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={isSending}
                  className="w-full bg-white px-4 py-2 text-xs text-[#111b21] rounded-lg border border-transparent focus:outline-none focus:ring-1 focus:ring-[#00a884] placeholder-[#667781] shadow-sm"
                />
              </form>

              {/* Tombol Kirim / Mic */}
              {inputText.trim() ? (
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={isSending}
                  className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white flex items-center justify-center transition-transform active:scale-95 shadow-md"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              ) : (
                <button
                  type="button"
                  className="p-2 text-[#54656f] hover:bg-slate-200/60 rounded-full transition-colors"
                >
                  <Mic className="w-5 h-5" />
                </button>
              )}
            </div>
          </>
        ) : (
          /* Empty State (WhatsApp Web Style) */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#f0f2f5]">
            <div className="w-20 h-20 rounded-full bg-[#00a884]/10 text-[#00a884] flex items-center justify-center mb-4">
              <MessageSquare className="w-10 h-10" />
            </div>
            <h3 className="text-base font-bold text-[#111b21]">
              WhatsApp Web untuk Fynux OS
            </h3>
            <p className="text-xs text-[#667781] max-w-sm mt-1 leading-relaxed">
              Kirim dan terima pesan WhatsApp langsung dari dashboard. Setiap pesan terkirim atau dibalas otomatis memperbarui panggung prospek di CRM.
            </p>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 3. MODALS (PAIRING & NEW OUTREACH CHAT)                  */}
      {/* ======================================================== */}
      <WhatsAppPairingModal
        isOpen={isPairingModalOpen}
        onClose={() => setIsPairingModalOpen(false)}
        session={session}
        onSessionUpdated={(updated) => setSession(updated)}
      />

      {/* Modal Mulai Chat Baru dari Daftar Prospek CRM */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-[#00a884] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Mulai Chat WhatsApp Prospek Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsNewChatModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto divide-y divide-slate-100">
              <p className="text-[11px] text-slate-500 mb-2">
                Pilih prospek dari database CRM untuk membuka ruang obrolan:
              </p>
              {prospects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    const cleanPhone = p.whatsappNumber.replace(/\D/g, "");
                    const existing = conversations.find(
                      (c) => c.whatsappNumber.replace(/\D/g, "") === cleanPhone
                    );

                    if (existing) {
                      setActiveConvId(existing.id);
                    } else {
                      const newThread: ConversationThread = {
                        id: `conv-${Date.now()}`,
                        prospectId: p.id,
                        companyName: p.companyName,
                        contactName: p.contactName,
                        whatsappNumber: p.whatsappNumber,
                        unreadCount: 0,
                        lastMessageSnippet: "Ruang obrolan baru dimulai",
                        lastMessageAt: new Date().toISOString(),
                        researchNotes: p.researchNotes,
                        messages: [],
                      };
                      setConversations((prev) => [newThread, ...prev]);
                      setActiveConvId(newThread.id);
                    }
                    setIsNewChatModalOpen(false);
                  }}
                  className="py-2.5 px-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors flex items-center justify-between"
                >
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">
                      {p.contactName}
                    </h5>
                    <div className="text-[11px] text-slate-500">
                      {p.companyName} · +{p.whatsappNumber}
                    </div>
                  </div>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded font-bold border ${getStageBadge(
                      p.stage
                    )}`}
                  >
                    {p.stage}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
