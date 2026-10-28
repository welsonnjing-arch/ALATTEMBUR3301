"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Search,
  Send,
  Paperclip,
  Smile,
  Mic,
  MoreVertical,
  CheckCheck,
  Check,
  Clock,
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
  Users,
  ShieldAlert,
  Trash2,
  Download,
  FileText,
  FolderPlus,
  CheckSquare,
  Info,
  Tag,
} from "lucide-react";
import { ConversationThread, ChatMessage, MessageStatus } from "@/modules/inbox/types";
import { WhatsAppSessionInfo } from "@/modules/whatsapp/types";
import { Prospect } from "@/modules/crm/types";
import { UserSessionData } from "@/modules/auth/types";
import {
  sendWhatsAppMessageAction,
  simulateIncomingWhatsAppMessageAction,
  markConversationAsReadAction,
  simulateRecipientReadMessagesAction,
  updateMessageStatusAction,
} from "@/modules/whatsapp/whatsapp.actions";
import { WhatsAppPairingModal } from "@/components/whatsapp/WhatsAppPairingModal";
import { WhatsAppCreateProjectModal } from "./WhatsAppCreateProjectModal";
import { WhatsAppCreateTaskModal } from "./WhatsAppCreateTaskModal";
import { WhatsAppEmojiPicker } from "./WhatsAppEmojiPicker";
import { WhatsAppContactDetailsDrawer } from "./WhatsAppContactDetailsDrawer";
import { formatDateTimeWIB } from "@/lib/date";

export function MessageStatusTick({
  status,
  size = "md",
}: {
  status?: MessageStatus;
  size?: "sm" | "md";
}) {
  const iconClass = size === "sm" ? "w-3.5 h-3.5 flex-shrink-0" : "w-4 h-4 flex-shrink-0";

  switch (status) {
    case "PENDING":
      return (
        <span title="Menunggu pengiriman...">
          <Clock className={`${iconClass} animate-pulse`} style={{ color: "#8696a0" }} />
        </span>
      );
    case "SENT":
      return (
        <span title="Terkirim ke server WhatsApp (Centang 1 abu-abu)">
          <Check className={`${iconClass}`} style={{ color: "#8696a0" }} />
        </span>
      );
    case "DELIVERED":
      return (
        <span title="Tersampaikan ke HP penerima - Belum dibaca (Centang 2 abu-abu)">
          <CheckCheck className={`${iconClass}`} style={{ color: "#8696a0" }} />
        </span>
      );
    case "READ":
      return (
        <span title="Telah dibaca oleh penerima (Centang 2 biru)">
          <CheckCheck
            className={`${iconClass} stroke-[2.4]`}
            style={{ color: "#53bdeb" }}
          />
        </span>
      );
    case "FAILED":
      return (
        <span className="text-rose-500 font-bold text-[10px]" title="Gagal terkirim">
          !
        </span>
      );
    default:
      return (
        <span title="Telah dibaca">
          <CheckCheck
            className={`${iconClass} stroke-[2.4]`}
            style={{ color: "#53bdeb" }}
          />
        </span>
      );
  }
}

export const SALES_TEAM = [
  { id: "22222222-2222-2222-2222-222222222222", name: "Budi Santoso (Sales 1)" },
  { id: "44444444-4444-4444-4444-444444444444", name: "Siti Rahma (Sales 2)" },
  { id: "55555555-5555-5555-5555-555555555555", name: "Dimas Anggara (Sales 3)" },
  { id: "66666666-6666-6666-6666-666666666666", name: "Anisa Putri (Sales 4)" },
  { id: "77777777-7777-7777-7777-777777777777", name: "Rian Hidayat (Sales 5)" },
  { id: "33333333-3333-3333-3333-333333333333", name: "Eko Pratama (Developer)" },
];

interface WhatsAppInboxViewProps {
  initialConversations: ConversationThread[];
  initialSession: WhatsAppSessionInfo;
  prospects: Prospect[];
  currentUser?: UserSessionData | null;
  initialProspectId?: string;
  initialPhone?: string;
}

export function WhatsAppInboxView({
  initialConversations,
  initialSession,
  prospects,
  currentUser,
  initialProspectId,
  initialPhone,
}: WhatsAppInboxViewProps) {
  // Jika diarahkan langsung dari URL / CRM (?prospectId=xxx atau ?phone=xxx)
  const initialMatchedConv = useMemo(() => {
    if (initialProspectId) {
      const byId = initialConversations.find((c) => c.prospectId === initialProspectId);
      if (byId) return byId;
      const matchedP = prospects.find((p) => p.id === initialProspectId);
      if (matchedP) {
        const clean = matchedP.whatsappNumber.replace(/\D/g, "");
        return initialConversations.find(
          (c) => c.whatsappNumber.replace(/\D/g, "") === clean
        );
      }
    }
    if (initialPhone) {
      const clean = initialPhone.replace(/\D/g, "");
      return initialConversations.find(
        (c) => c.whatsappNumber.replace(/\D/g, "") === clean
      );
    }
    return null;
  }, [initialProspectId, initialPhone, initialConversations, prospects]);

  const [conversations, setConversations] = useState<ConversationThread[]>(initialConversations);
  const [activeConvId, setActiveConvId] = useState<string>(
    initialMatchedConv?.id || initialConversations[0]?.id || ""
  );
  const [session, setSession] = useState<WhatsAppSessionInfo>(initialSession);
  const [searchQuery, setSearchQuery] = useState("");

  // Default: Jika ada initialMatchedConv, buka 'ALL'. Jika login sebagai SALES / DEVELOPER, buka 'MY_CHATS'
  const [filterTab, setFilterTab] = useState<"MY_CHATS" | "ALL" | "UNASSIGNED" | "CRM">(
    initialMatchedConv
      ? "ALL"
      : currentUser?.role === "SALES" || currentUser?.role === "DEVELOPER"
      ? "MY_CHATS"
      : "ALL"
  );
  const [selectedSalesAgent, setSelectedSalesAgent] = useState<string>("ALL");
  const [isAssignDropdownOpen, setIsAssignDropdownOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // State Pesan Aktif
  const chatInputRef = useRef<HTMLInputElement>(null);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  const handleSelectEmoji = (emoji: string) => {
    if (chatInputRef.current) {
      const start = chatInputRef.current.selectionStart ?? inputText.length;
      const end = chatInputRef.current.selectionEnd ?? inputText.length;
      const newText = inputText.substring(0, start) + emoji + inputText.substring(end);
      setInputText(newText);
      setTimeout(() => {
        if (chatInputRef.current) {
          chatInputRef.current.focus();
          const newPos = start + emoji.length;
          chatInputRef.current.setSelectionRange(newPos, newPos);
        }
      }, 0);
    } else {
      setInputText((prev) => prev + emoji);
    }
  };

  // Attachment & Media State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingAttachment, setPendingAttachment] = useState<{
    file: File;
    previewUrl: string;
    base64Data: string;
    fileName: string;
    fileSize: string;
    mimeType: string;
    isImage: boolean;
  } | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Modals & Project/Task Actions
  const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isContactInfoOpen, setIsContactInfoOpen] = useState(false);
  const [localProspects, setLocalProspects] = useState<Prospect[]>(prospects);

  useEffect(() => {
    setLocalProspects(prospects);
  }, [prospects]);

  const [actionFeedback, setActionFeedback] = useState<{
    type: "PROJECT" | "TASK";
    message: string;
    linkUrl: string;
    linkLabel: string;
  } | null>(null);

  // Auto scroll ke pesan terbawah
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-init percakapan dari CRM jika belum ada thread di Inbox
  useEffect(() => {
    if (initialProspectId && !initialMatchedConv) {
      const targetP = prospects.find((p) => p.id === initialProspectId);
      if (targetP) {
        fetch("/api/whatsapp/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prospectId: targetP.id,
            companyName: targetP.companyName,
            contactName: targetP.contactName,
            whatsappNumber: targetP.whatsappNumber,
            researchNotes: targetP.researchNotes,
            assignedSalesId: targetP.assignedSalesId || currentUser?.id,
            assignedSalesName: targetP.assignedSalesName || currentUser?.fullName,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.thread) {
              setConversations((prev) => [
                data.thread,
                ...prev.filter((c) => c.id !== data.thread.id),
              ]);
              setActiveConvId(data.thread.id);
              setFilterTab("ALL");
              setSelectedSalesAgent("ALL");
            }
          })
          .catch((err) => console.error("Gagal inisialisasi ruang obrolan:", err));
      }
    }
  }, [initialProspectId, initialMatchedConv, prospects, currentUser]);

  const activeConv = conversations.find((c) => c.id === activeConvId);

  // Cari data prospek CRM yang bersesuaian dengan percakapan aktif
  const activeProspect = activeConv
    ? localProspects.find(
        (p) =>
          (activeConv.prospectId && p.id === activeConv.prospectId) ||
          p.whatsappNumber.replace(/\D/g, "") ===
            activeConv.whatsappNumber.replace(/\D/g, "")
      )
    : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages]);

  // Real-time auto-sync percakapan dan status koneksi WhatsApp dari server setiap 1.2 detik
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      try {
        const res = await fetch("/api/whatsapp/conversations", { cache: "no-store" });
        if (res.ok) {
          const latest: ConversationThread[] = await res.json();
          setConversations((prev) => {
            const isDiff = JSON.stringify(prev) !== JSON.stringify(latest);
            return isDiff ? latest : prev;
          });
        }

        const sessionRes = await fetch("/api/whatsapp/session", { cache: "no-store" });
        if (sessionRes.ok) {
          const s = await sessionRes.json();
          setSession((prev) =>
            prev.status !== s.status || prev.phoneNumber !== s.phoneNumber ? s : prev
          );
        }
      } catch (err) {
        // Abaikan error polling background
      }
    }, 1200);

    return () => clearInterval(syncInterval);
  }, []);

  // Filter daftar percakapan (Memastikan chat antar sales tidak tercampur)
  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      c.companyName.toLowerCase().includes(q) ||
      c.contactName.toLowerCase().includes(q) ||
      c.whatsappNumber.includes(q) ||
      c.lastMessageSnippet.toLowerCase().includes(q) ||
      (c.tags && c.tags.some((t) => t.toLowerCase().includes(q)));

    if (!matchSearch) return false;

    // Filter Tab Utama
    if (filterTab === "MY_CHATS") {
      if (currentUser?.id) {
        if (c.assignedSalesId !== currentUser.id) return false;
      }
    } else if (filterTab === "UNASSIGNED") {
      if (c.assignedSalesId) return false;
    } else if (filterTab === "CRM") {
      if (!c.prospectId) return false;
    }

    // Filter Sekunder: Dropdown Sales Agent tertentu (untuk Owner/Supervisor)
    if (selectedSalesAgent !== "ALL") {
      if (c.assignedSalesId !== selectedSalesAgent) return false;
    }

    return true;
  });

  const isOwner = currentUser?.role === "OWNER";

  // Hitung jumlah chat untuk badge tab
  const myChatsCount = conversations.filter(
    (c) => c.assignedSalesId === currentUser?.id
  ).length;
  const unassignedCount = conversations.filter((c) => !c.assignedSalesId).length;

  // Menghapus percakapan dari Inbox
  const handleDeleteConversation = async () => {
    if (!activeConv) return;
    const confirmMsg = `Hapus ruang obrolan dengan "${activeConv.companyName}"?\n\nRiwayat pesan akan dihapus dari Inbox.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/whatsapp/conversations?id=${activeConv.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const remaining = conversations.filter((c) => c.id !== activeConv.id);
        setConversations(remaining);
        setActiveConvId(remaining[0]?.id || "");
      }
    } catch (err) {
      console.error("Gagal menghapus percakapan:", err);
    }
  };

  // Menugaskan percakapan ke sales tertentu (Hanya berhak dilakukan oleh Owner)
  const handleAssignSales = async (salesId: string, salesName: string) => {
    if (!isOwner) {
      alert("Hanya Owner yang memiliki hak untuk menugaskan kontak ini ke Sales.");
      return;
    }
    if (!activeConv || isAssigning) return;
    setIsAssigning(true);
    setIsAssignDropdownOpen(false);

    // Optimistic UI update
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConv.id
          ? { ...c, assignedSalesId: salesId, assignedSalesName: salesName }
          : c
      )
    );

    try {
      const res = await fetch("/api/whatsapp/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConv.id,
          salesId,
          salesName,
        }),
      });

      if (res.ok) {
        const convRes = await fetch("/api/whatsapp/conversations", { cache: "no-store" });
        if (convRes.ok) {
          const latest = await convRes.json();
          setConversations(latest);
        }
      }
    } catch (err) {
      console.error("Gagal menugaskan percakapan:", err);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 16 * 1024 * 1024) {
      alert("Ukuran file maksimal adalah 16 MB.");
      e.target.value = "";
      return;
    }

    const isImage = file.type.startsWith("image/");
    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(1)} KB`;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      const previewUrl = isImage ? URL.createObjectURL(file) : "";
      setPendingAttachment({
        file,
        previewUrl,
        base64Data,
        fileName: file.name,
        fileSize: sizeStr,
        mimeType: file.type || (isImage ? "image/jpeg" : "application/octet-stream"),
        isImage,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Kirim Pesan
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !pendingAttachment) || !activeConv || isSending) return;

    const textToSend = inputText.trim();
    const attachmentToSend = pendingAttachment;

    setInputText("");
    setPendingAttachment(null);
    setIsSending(true);

    const senderName =
      currentUser?.fullName ||
      (currentUser?.role === "DEVELOPER" ? "Eko Pratama (Developer)" : "Sales Operator");
    const senderId = currentUser?.id || "team-operator";

    const attachmentPayload = attachmentToSend
      ? {
          fileName: attachmentToSend.fileName,
          fileSize: attachmentToSend.fileSize,
          mimeType: attachmentToSend.mimeType,
          base64Data: attachmentToSend.base64Data,
        }
      : undefined;

    // Optimistic UI update
    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversationId: activeConv.id,
      sender: "SALES",
      sentByUserId: senderId,
      sentByUserName: senderName,
      text: textToSend,
      isDraft: false,
      timestamp: new Date().toISOString(),
      status: "SENT",
      attachment: attachmentToSend
        ? {
            fileName: attachmentToSend.fileName,
            fileSize: attachmentToSend.fileSize,
            mimeType: attachmentToSend.mimeType,
            url: attachmentToSend.previewUrl || "",
          }
        : undefined,
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConv.id) {
          const snippet =
            textToSend.slice(0, 80) ||
            (attachmentToSend ? `📎 ${attachmentToSend.fileName}` : "Pesan terkirim");
          return {
            ...c,
            lastMessageSnippet: snippet,
            lastMessageAt: optimisticMsg.timestamp,
            messages: [...c.messages, optimisticMsg],
          };
        }
        return c;
      })
    );

    // Kirim pesan langsung ke API socket WhatsApp
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsappNumber: activeConv.whatsappNumber,
          text: textToSend,
          prospectId: activeConv.prospectId,
          actorUserId: senderId,
          actorUserName: senderName,
          attachment: attachmentPayload,
        }),
      });

      if (res.ok) {
        const sendData = await res.json();
        if (sendData?.warning) {
          alert(sendData.warning);
          setIsPairingModalOpen(true);
        }
        const createdId = sendData?.messageId || optimisticMsg.id;

        // Transisi status ke DELIVERED (centang 2 abu-abu) setelah 1.5 detik jika lawan belum membaca
        setTimeout(() => {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === activeConv.id) {
                return {
                  ...c,
                  messages: c.messages.map((m) =>
                    (m.id === optimisticMsg.id || m.id === createdId) && m.status === "SENT"
                      ? { ...m, status: "DELIVERED" }
                      : m
                  ),
                };
              }
              return c;
            })
          );
          updateMessageStatusAction(createdId, "DELIVERED").catch(() => {});
        }, 1500);

        const convRes = await fetch("/api/whatsapp/conversations", {
          cache: "no-store",
        });
        if (convRes.ok) {
          const latest = await convRes.json();
          setConversations(latest);
        }
      }
    } catch (err) {
      console.error("Gagal mengirim pesan via WhatsApp:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Simulasi pesan masuk dari klien (untuk menguji pemicu panggung CRM ke RESPONDED & centang biru)
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

    // Optimistic UI: ubah seluruh pesan sales sebelumnya menjadi READ (centang 2 biru)
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
          const updatedMessages = c.messages.map((m) =>
            m.sender === "SALES" || m.sender === "AI"
              ? { ...m, status: "READ" as MessageStatus }
              : m
          );
          return {
            ...c,
            lastMessageSnippet: randomReply.slice(0, 80),
            lastMessageAt: incomingMsg.timestamp,
            unreadCount: c.unreadCount + 1,
            messages: [...updatedMessages, incomingMsg],
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

  // Simulasi penerima membuka dan membaca pesan (Centang 2 Biru)
  const handleSimulateRecipientRead = async () => {
    if (!activeConv) return;

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConv.id) {
          const updated = c.messages.map((m) =>
            m.sender === "SALES" || m.sender === "AI"
              ? { ...m, status: "READ" as MessageStatus }
              : m
          );
          return {
            ...c,
            messages: updated,
          };
        }
        return c;
      })
    );

    await simulateRecipientReadMessagesAction(activeConv.id);
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
      case "PROPOSAL_MADE":
        return "bg-amber-50 text-amber-700 border-amber-300 font-bold";
      case "NEGOTIATION":
        return "bg-orange-50 text-orange-700 border-orange-300 font-bold";
      case "CLOSED_WON":
        return "bg-emerald-600 text-white border-emerald-600 font-bold";
      case "CLOSED_LOST":
        return "bg-rose-50 text-rose-700 border-rose-300 line-through";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  // Cek apakah ada potensi collision (Sales / Developer sedang membuka chat yang ditugaskan ke anggota tim lain)
  const isAssignedToOther =
    (currentUser?.role === "SALES" || currentUser?.role === "DEVELOPER") &&
    activeConv?.assignedSalesId &&
    currentUser?.id &&
    activeConv.assignedSalesId !== currentUser.id;

  return (
    <div className="flex h-full w-full bg-[#f0f2f5] overflow-hidden rounded-xl border border-slate-300/80 shadow-md">
      {/* ======================================================== */}
      {/* 1. SIDEBAR DAFTAR CHAT (1:1 WHATSAPP WEB LEFT PANEL)     */}
      {/* ======================================================== */}
      <div className="w-80 md:w-96 flex flex-col h-full bg-white border-r border-[#d1d7db] flex-shrink-0">
        {/* Header Profil WhatsApp Web & Status Sesi */}
        <div className="h-16 bg-[#f0f2f5] px-4 py-2.5 flex items-center justify-between border-b border-[#d1d7db]">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                F
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
                Fynux Shared WhatsApp
              </div>
              <div className="text-[11px] text-[#667781] leading-tight">
                {session.status === "CONNECTED"
                  ? `+${session.phoneNumber} · 1 Nomor (5 Sales)`
                  : "Sesi Belum Tertaut"}
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

          {/* Multi-Agent Filter Chips */}
          <div className="flex items-center gap-1.5 mt-2 px-1 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setFilterTab("MY_CHATS")}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors flex items-center gap-1 whitespace-nowrap ${
                filterTab === "MY_CHATS"
                  ? "bg-[#e7fce3] text-[#008069] font-bold shadow-xs"
                  : "bg-[#f0f2f5] text-[#54656f] hover:bg-slate-200/60"
              }`}
            >
              <span>Chat Saya</span>
              <span className="text-[10px] opacity-80">({myChatsCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab("ALL")}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors flex items-center gap-1 whitespace-nowrap ${
                filterTab === "ALL"
                  ? "bg-[#e7fce3] text-[#008069] font-bold shadow-xs"
                  : "bg-[#f0f2f5] text-[#54656f] hover:bg-slate-200/60"
              }`}
            >
              <span>Semua Tim</span>
              <span className="text-[10px] opacity-80">({conversations.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab("UNASSIGNED")}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors flex items-center gap-1 whitespace-nowrap ${
                filterTab === "UNASSIGNED"
                  ? "bg-amber-100 text-amber-900 font-bold shadow-xs"
                  : "bg-[#f0f2f5] text-[#54656f] hover:bg-slate-200/60"
              }`}
            >
              <span>Belum Ditugaskan</span>
              {unassignedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[9px] font-bold">
                  {unassignedCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setFilterTab("CRM")}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap ${
                filterTab === "CRM"
                  ? "bg-[#e7fce3] text-[#008069] font-bold shadow-xs"
                  : "bg-[#f0f2f5] text-[#54656f] hover:bg-slate-200/60"
              }`}
            >
              Prospek CRM
            </button>
          </div>

          {/* Supervisor / Owner Dropdown: Filter Khusus per Sales (Hanya Akses Owner) */}
          {isOwner && (
            <div className="mt-2 px-1 flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 p-1.5 rounded-lg border border-slate-200/70">
              <span className="flex items-center gap-1 text-slate-600 font-medium">
                <Users className="w-3.5 h-3.5 text-indigo-600" /> Filter Agen (Owner):
              </span>
              <select
                value={selectedSalesAgent}
                onChange={(e) => setSelectedSalesAgent(e.target.value)}
                className="bg-white border border-slate-200 rounded px-2 py-0.5 text-[11px] font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">Semua Anggota Sales</option>
                {SALES_TEAM.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({conversations.filter((c) => c.assignedSalesId === s.id).length})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Daftar Chat List (WhatsApp Web Item List) */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#f0f2f5]">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((c) => {
              const isSelected = c.id === activeConvId;
              const prospect = localProspects.find(
                (p) =>
                  (c.prospectId && p.id === c.prospectId) ||
                  p.whatsappNumber.replace(/\D/g, "") ===
                    c.whatsappNumber.replace(/\D/g, "")
              );

              const isMine = c.assignedSalesId === currentUser?.id;

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setActiveConvId(c.id);
                    if (c.unreadCount > 0) {
                      setConversations((prev) =>
                        prev.map((item) =>
                          item.id === c.id ? { ...item, unreadCount: 0 } : item
                        )
                      );
                      markConversationAsReadAction(c.id).catch(console.error);
                    }
                  }}
                  className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[#f0f2f5]"
                      : "hover:bg-[#f5f6f6] bg-white"
                  }`}
                >
                  {/* Round Avatar Kontak WhatsApp */}
                  {c.avatarUrl ? (
                    <img
                      src={c.avatarUrl}
                      alt={c.contactName}
                      className="w-12 h-12 rounded-full object-cover shadow-inner flex-shrink-0 border border-slate-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-sm flex-shrink-0 shadow-inner">
                      {c.companyName.substring(0, 2).toUpperCase()}
                    </div>
                  )}

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
                      <span className="text-[10px] text-indigo-700 font-medium truncate max-w-[130px]">
                        {c.companyName}
                      </span>

                      {/* Tag Kepemilikan Sales */}
                      {c.assignedSalesName ? (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-medium flex items-center gap-0.5 ${
                            isMine
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          <UserCheck className="w-2.5 h-2.5" />
                          <span>
                            {isMine
                              ? "Chat Saya"
                              : c.assignedSalesName.replace(/\s*\(.*\)/, "")}
                          </span>
                        </span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                          ⚠️ Belum Ada Sales
                        </span>
                      )}

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

                    {/* Tags List */}
                    {c.tags && c.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        {c.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-medium border border-indigo-200"
                          >
                            #{tag}
                          </span>
                        ))}
                        {c.tags.length > 3 && (
                          <span className="text-[9px] text-slate-400 font-medium">
                            +{c.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Snippet Pesan & Check Ticks */}
                    {(() => {
                      const lastMsg = c.messages[c.messages.length - 1];
                      const isOutgoing =
                        lastMsg && (lastMsg.sender === "SALES" || lastMsg.sender === "AI");

                      return (
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-1 text-[11px] text-[#667781] truncate">
                            {isOutgoing && (
                              <MessageStatusTick status={lastMsg?.status} size="sm" />
                            )}
                            <span className="truncate">{c.lastMessageSnippet}</span>
                          </div>

                          {c.unreadCount > 0 && (
                            <span className="w-4 h-4 rounded-full bg-[#25d366] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 ml-1">
                              {c.unreadCount}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-[#667781]">
              Tidak ada percakapan ditemukan pada filter ini.
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. RUANG CHAT AKTIF (1:1 WHATSAPP WEB CHAT WINDOW)       */}
      {/* ======================================================== */}
      <div className="flex-1 flex h-full overflow-hidden relative">
        <div className="flex-1 flex flex-col h-full bg-[#efeae2] relative min-w-0">
          {activeConv ? (
            <>
              {/* Header Ruang Chat */}
              <div className="h-16 bg-[#f0f2f5] px-4 py-2.5 flex items-center justify-between border-b border-[#d1d7db] z-10 gap-3">
                {/* Info Kontak & Profil (Kiri) */}
                <div
                  onClick={() => setIsContactInfoOpen((prev) => !prev)}
                  className="flex items-center gap-3 cursor-pointer p-1 -m-1 rounded-lg hover:bg-slate-200/60 transition-colors group select-none min-w-0"
                  title="Klik untuk membuka Info Kontak, Tags & Riset CRM"
                >
                  {/* Round Avatar Header */}
                  {activeConv.avatarUrl ? (
                    <img
                      src={activeConv.avatarUrl}
                      alt={activeConv.contactName}
                      className="w-10 h-10 rounded-full object-cover shadow-xs flex-shrink-0 border border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-300 group-hover:bg-indigo-200 text-slate-700 group-hover:text-indigo-800 font-bold flex items-center justify-center text-sm shadow-xs flex-shrink-0 transition-colors">
                      {activeConv.companyName.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#111b21] group-hover:text-indigo-600 transition-colors truncate max-w-[180px] sm:max-w-[260px]">
                        {activeConv.contactName}
                      </h3>
                      {activeProspect && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border font-bold flex-shrink-0 ${getStageBadge(
                            activeProspect.stage
                          )}`}
                        >
                          CRM: {activeProspect.stage}
                        </span>
                      )}
                      {/* Tags */}
                      {activeConv.tags && activeConv.tags.length > 0 && (
                        <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
                          {activeConv.tags.slice(0, 2).map((t) => (
                            <span
                              key={t}
                              className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 font-medium border border-indigo-200"
                            >
                              #{t}
                            </span>
                          ))}
                          {activeConv.tags.length > 2 && (
                            <span className="text-[9px] text-slate-400 font-medium">
                              +{activeConv.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-[11px] text-[#667781] flex items-center gap-1.5 mt-0.5 truncate">
                      <span className="truncate max-w-[140px] sm:max-w-[200px] font-medium text-slate-600">
                        {activeConv.companyName}
                      </span>
                      <span>·</span>
                      <span className="font-mono">+{activeConv.whatsappNumber}</span>
                      <span className="text-indigo-600 hover:text-indigo-800 text-[10px] font-semibold bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 px-1.5 py-0.2 rounded flex items-center gap-1 transition-colors flex-shrink-0">
                        <Info className="w-2.5 h-2.5" />
                        Riset & Info
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons di Header Chat (Kanan) */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                  {/* Multi-Agent Assignment: Hanya Owner yang Berhak Mengatur/Memindahkan */}
                  {isOwner ? (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsAssignDropdownOpen((prev) => !prev)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors shadow-xs ${
                          activeConv.assignedSalesName
                            ? "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
                            : "bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 animate-pulse"
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="max-w-[130px] truncate">
                          {activeConv.assignedSalesName
                            ? activeConv.assignedSalesName.replace(/\s*\(.*\)/, "")
                            : "Tugaskan Sales"}
                        </span>
                        <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      </button>

                      {/* Dropdown Menu untuk Transfer / Assignment (Khusus Owner) */}
                      {isAssignDropdownOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-20"
                            onClick={() => setIsAssignDropdownOpen(false)}
                          />
                          <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Tugaskan Kontak Ini Ke (Owner):
                            </div>
                            <div className="max-h-56 overflow-y-auto">
                              {SALES_TEAM.map((sales) => (
                                <button
                                  key={sales.id}
                                  type="button"
                                  onClick={() => {
                                    handleAssignSales(sales.id, sales.name);
                                    setIsAssignDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                                    activeConv.assignedSalesId === sales.id
                                      ? "font-bold text-[#00a884] bg-[#e7fce3]/40"
                                      : "text-slate-700"
                                  }`}
                                >
                                  <span>{sales.name}</span>
                                  {activeConv.assignedSalesId === sales.id && (
                                    <Check className="w-3.5 h-3.5 text-[#00a884]" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    /* Tampilan Read-Only untuk Sales / Non-Owner */
                    <div
                      title="Hanya Owner yang berhak mengatur atau mengubah penugasan kontak"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-white text-slate-700 border-slate-200 select-none shadow-xs"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="max-w-[130px] truncate">
                        {activeConv.assignedSalesName
                          ? `Sales: ${activeConv.assignedSalesName.replace(/\s*\(.*\)/, "")}`
                          : "Menunggu Penugasan"}
                      </span>
                    </div>
                  )}

                  {/* Tombol Info Kontak & Riset CRM */}
                  <button
                    type="button"
                    onClick={() => setIsContactInfoOpen((prev) => !prev)}
                    title={isContactInfoOpen ? "Tutup Info Kontak & Riset CRM" : "Buka Info Kontak & Riset CRM"}
                    className={`p-2 rounded-full transition-colors ${
                      isContactInfoOpen
                        ? "bg-indigo-100 text-indigo-700 shadow-xs"
                        : "text-[#54656f] hover:bg-slate-200/60"
                    }`}
                  >
                    <Info className="w-4 h-4" />
                  </button>

                  {/* Tombol Search dalam Chat */}
                  <button
                    type="button"
                    className="p-2 text-[#54656f] hover:bg-slate-200/60 rounded-full transition-colors"
                    title="Cari dalam percakapan ini"
                  >
                    <Search className="w-4 h-4" />
                  </button>

                  {/* Menu Opsi Lainnya (More) */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsMoreMenuOpen((prev) => !prev)}
                      title="Menu Lainnya"
                      className={`p-2 rounded-full transition-colors ${
                        isMoreMenuOpen
                          ? "bg-slate-200/80 text-slate-800"
                          : "text-[#54656f] hover:bg-slate-200/60"
                      }`}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {isMoreMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-20"
                          onClick={() => setIsMoreMenuOpen(false)}
                        />
                        <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100 text-slate-700">
                          {/* Aksi Bisnis */}
                          <div className="py-1">
                            <button
                              type="button"
                              onClick={() => {
                                setIsMoreMenuOpen(false);
                                setIsCreateProjectModalOpen(true);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 hover:bg-slate-50 transition-colors"
                            >
                              <FolderPlus className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              <span>Tambah Proyek (/projects)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsMoreMenuOpen(false);
                                setIsCreateTaskModalOpen(true);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 hover:bg-slate-50 transition-colors"
                            >
                              <CheckSquare className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                              <span>Tambah Task To Do (/tasks)</span>
                            </button>
                          </div>

                          {/* Aksi Testing & Simulasi */}
                          <div className="py-1">
                            <button
                              type="button"
                              onClick={() => {
                                setIsMoreMenuOpen(false);
                                handleSimulateClientReply();
                              }}
                              disabled={isSimulating}
                              className="w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 text-purple-700 hover:bg-purple-50 transition-colors"
                            >
                              <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0" />
                              <span>{isSimulating ? "Menerima..." : "Simulasi Balasan Klien"}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsMoreMenuOpen(false);
                                handleSimulateRecipientRead();
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 text-sky-700 hover:bg-sky-50 transition-colors"
                            >
                              <CheckCheck className="w-4 h-4 text-[#53bdeb] flex-shrink-0" />
                              <span>Simulasi Dibaca (Centang Biru)</span>
                            </button>
                          </div>

                          {/* Aksi Hapus Chat */}
                          <div className="py-1">
                            <button
                              type="button"
                              onClick={() => {
                                setIsMoreMenuOpen(false);
                                handleDeleteConversation();
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-rose-500 flex-shrink-0" />
                              <span>Hapus Percakapan</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

            {/* Feedback Notifikasi Sukses Pembuatan Proyek / Task */}
            {actionFeedback && (
              <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 flex items-center justify-between text-xs text-emerald-900 z-10 animate-in fade-in duration-150 shadow-xs">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="font-medium">{actionFeedback.message}</span>
                  <a
                    href={actionFeedback.linkUrl}
                    className="inline-flex items-center gap-1 font-bold underline text-emerald-700 hover:text-emerald-900 ml-1"
                  >
                    {actionFeedback.linkLabel} &rarr;
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => setActionFeedback(null)}
                  className="p-1 hover:bg-emerald-100 rounded-full text-emerald-700 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Agent Collision Warning Banner (Jika Sales membuka chat rekannya) */}
            {isAssignedToOther && (
              <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-xs text-amber-900 z-10">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>
                    Perhatian: Percakapan ini ditugaskan kepada{" "}
                    <strong>{activeConv.assignedSalesName || "Anggota Tim Lain"}</strong>.
                    Anda sedang melihat dalam mode kolaborasi tim (hanya Owner yang berhak memindahkan penugasan kontak).
                  </span>
                </div>
              </div>
            )}

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
                  Riwayat Tersimpan Permanen
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
                      {/* Atribusi Pengirim Pesan Tim */}
                      {isSales && m.sentByUserName && (
                        <div className="text-[10px] font-semibold text-emerald-800 mb-0.5 flex items-center gap-1 opacity-90 select-none">
                          <span>💬 {m.sentByUserName}</span>
                        </div>
                      )}

                      {/* Tampilan Lampiran File / Gambar */}
                      {m.attachment && (
                        <div className="mb-2">
                          {m.attachment.mimeType.startsWith("image/") ||
                          /\.(jpg|jpeg|png|webp|gif)$/i.test(m.attachment.fileName) ? (
                            <div
                              onClick={() => setLightboxUrl(m.attachment!.url || null)}
                              className="cursor-pointer overflow-hidden rounded-md border border-black/5 hover:opacity-95 transition-opacity max-w-[280px]"
                            >
                              <img
                                src={m.attachment.url}
                                alt={m.attachment.fileName}
                                className="w-full max-h-60 object-cover rounded-md"
                                loading="lazy"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2.5 p-2 rounded-md bg-black/5 border border-black/10 max-w-[280px]">
                              <div className="w-9 h-9 bg-white rounded flex items-center justify-center flex-shrink-0 text-[#00a884] shadow-xs">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0 pr-1">
                                <p
                                  className="text-xs font-medium text-[#111b21] truncate"
                                  title={m.attachment.fileName}
                                >
                                  {m.attachment.fileName}
                                </p>
                                <p className="text-[10px] text-[#667781]">{m.attachment.fileSize}</p>
                              </div>
                              {m.attachment.url && (
                                <a
                                  href={m.attachment.url}
                                  download={m.attachment.fileName}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 hover:bg-white text-slate-600 rounded-full transition-colors flex-shrink-0"
                                  title="Unduh berkas"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Teks Pesan */}
                      {m.text && (
                        <p className="whitespace-pre-wrap leading-relaxed pr-14 text-xs">
                          {m.text}
                        </p>
                      )}

                      {/* Micro Timestamp & Centang Pengiriman */}
                      <div className="absolute bottom-1 right-2 flex items-center gap-1 select-none">
                        <span className="text-[9px] text-[#667781]">
                          {new Date(m.timestamp).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {isSales && (
                          <MessageStatusTick status={m.status} size="sm" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Warning Banner jika WhatsApp belum terhubung ke perangkat */}
            {session.status !== "CONNECTED" && (
              <div className="bg-amber-50 border-t border-amber-200 px-4 py-2 flex items-center justify-between text-xs text-amber-900 z-10 shadow-xs">
                <span className="flex items-center gap-1.5 font-medium">
                  <Smartphone className="w-4 h-4 text-amber-600 animate-pulse flex-shrink-0" />
                  Perangkat WhatsApp belum terhubung. Pesan tidak akan terkirim ke ponsel prospek.
                </span>
                <button
                  type="button"
                  onClick={() => setIsPairingModalOpen(true)}
                  className="px-2.5 py-1 bg-[#00a884] hover:bg-[#008f6f] text-white font-bold rounded text-[11px] transition-colors flex items-center gap-1 shadow-xs flex-shrink-0"
                >
                  Tautkan WA Sekarang &rarr;
                </button>
              </div>
            )}

            {/* Hidden File Input untuk Unggah Berkas & Gambar */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt,.csv"
            />

            {/* Bilah Pratinjau Lampiran Siap Kirim */}
            {pendingAttachment && (
              <div className="bg-slate-100 border-t border-slate-200 px-4 py-2 flex items-center justify-between gap-3 animate-in fade-in duration-150 z-10">
                <div className="flex items-center gap-3 overflow-hidden">
                  {pendingAttachment.isImage ? (
                    <img
                      src={pendingAttachment.previewUrl}
                      alt={pendingAttachment.fileName}
                      className="w-12 h-12 object-cover rounded-md border border-slate-300 shadow-xs flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-white rounded-md border border-slate-300 flex flex-col items-center justify-center text-[#00a884] flex-shrink-0 shadow-xs">
                      <FileText className="w-6 h-6" />
                      <span className="text-[8px] font-bold uppercase text-slate-500 mt-0.5">
                        {pendingAttachment.fileName.split(".").pop()?.slice(0, 4)}
                      </span>
                    </div>
                  )}
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {pendingAttachment.fileName}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {pendingAttachment.fileSize} •{" "}
                      {pendingAttachment.isImage
                        ? "Gambar siap dikirim"
                        : "Dokumen siap dikirim"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (pendingAttachment.previewUrl) {
                      URL.revokeObjectURL(pendingAttachment.previewUrl);
                    }
                    setPendingAttachment(null);
                  }}
                  className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full transition-colors flex-shrink-0"
                  title="Batal lampiran"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Bottom Bar: Kolom Input Pesan 1:1 WhatsApp Web */}
            <div className="bg-[#f0f2f5] px-4 py-2.5 flex items-center gap-2 border-t border-[#d1d7db] z-10 relative">
              {/* Menu Popup Emoji Picker */}
              <WhatsAppEmojiPicker
                isOpen={isEmojiPickerOpen}
                onClose={() => setIsEmojiPickerOpen(false)}
                onSelectEmoji={handleSelectEmoji}
              />

              <button
                type="button"
                onClick={() => setIsEmojiPickerOpen((prev) => !prev)}
                className={`p-2 rounded-full transition-colors ${
                  isEmojiPickerOpen
                    ? "text-[#00a884] bg-[#00a884]/15"
                    : "text-[#54656f] hover:bg-slate-200/60"
                }`}
                title="Pilih Emoji"
              >
                <Smile className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`p-2 rounded-full transition-colors ${
                  pendingAttachment
                    ? "text-[#00a884] bg-[#00a884]/15"
                    : "text-[#54656f] hover:bg-slate-200/60"
                }`}
                title="Lampirkan File atau Foto"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* Form Input Teks */}
              <form
                onSubmit={handleSendMessage}
                className="flex-1 flex items-center"
              >
                <input
                  ref={chatInputRef}
                  type="text"
                  placeholder={
                    pendingAttachment
                      ? "Tambahkan keterangan / caption (opsional)..."
                      : isAssignedToOther
                      ? `Ketik balasan atas nama ${currentUser?.fullName || "Tim Sales"}...`
                      : "Ketik pesan..."
                  }
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={isSending}
                  className="w-full bg-white rounded-lg px-4 py-2 text-xs text-[#111b21] placeholder-[#667781] focus:outline-none focus:ring-1 focus:ring-[#00a884] shadow-xs"
                />
              </form>

              {inputText.trim() || pendingAttachment ? (
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={isSending}
                  className="p-2 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-full transition-colors shadow-sm"
                  title="Kirim Pesan"
                >
                  <Send className="w-4 h-4" />
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
              WhatsApp Web Multi-Device untuk Fynux OS
            </h3>
            <p className="text-xs text-[#667781] max-w-sm mt-1 leading-relaxed">
              1 Nomor WhatsApp kantor dipakai bersama oleh 5 tim sales. Setiap sales fokus pada daftar 100 prospek miliknya tanpa tertukar, dan riwayat pesan tetap tersimpan permanen di server meskipun koneksi terputus.
            </p>
          </div>
        )}
        </div>

        {/* Drawer Info Kontak & Riset Bisnis CRM */}
        {activeConv && (
          <WhatsAppContactDetailsDrawer
            isOpen={isContactInfoOpen}
            onClose={() => setIsContactInfoOpen(false)}
            conversation={activeConv}
            prospect={activeProspect || null}
            currentUser={currentUser}
            onOpenCreateProject={() => setIsCreateProjectModalOpen(true)}
            onOpenCreateTask={() => setIsCreateTaskModalOpen(true)}
            onUpdated={(updated) => {
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === activeConv.id
                    ? {
                        ...c,
                        tags: updated.tags,
                        researchNotes: updated.researchNotes,
                        avatarUrl: updated.avatarUrl !== undefined ? updated.avatarUrl : c.avatarUrl,
                        bio: updated.bio !== undefined ? updated.bio : c.bio,
                      }
                    : c
                )
              );
              setLocalProspects((prev) =>
                prev.map((p) => {
                  const isMatch =
                    (activeConv.prospectId && p.id === activeConv.prospectId) ||
                    p.whatsappNumber.replace(/\D/g, "") ===
                      activeConv.whatsappNumber.replace(/\D/g, "");
                  if (isMatch) {
                    return {
                      ...p,
                      tags: updated.tags,
                      industry: updated.industry ?? p.industry,
                      painPoints: updated.painPoints ?? p.painPoints,
                      researchNotes: updated.researchNotes,
                      avatarUrl: updated.avatarUrl !== undefined ? updated.avatarUrl : p.avatarUrl,
                      bio: updated.bio !== undefined ? updated.bio : p.bio,
                    };
                  }
                  return p;
                })
              );
            }}
          />
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
              {localProspects.map((p) => (
                <div
                  key={p.id}
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/whatsapp/conversations", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          prospectId: p.id,
                          companyName: p.companyName,
                          contactName: p.contactName,
                          whatsappNumber: p.whatsappNumber,
                          researchNotes: p.researchNotes,
                          assignedSalesId: p.assignedSalesId || currentUser?.id,
                          assignedSalesName: p.assignedSalesName || currentUser?.fullName,
                        }),
                      });

                      if (res.ok) {
                        const data = await res.json();
                        if (data.thread) {
                          setConversations((prev) => [
                            data.thread,
                            ...prev.filter((c) => c.id !== data.thread.id),
                          ]);
                          setActiveConvId(data.thread.id);
                          setFilterTab("ALL");
                          setSelectedSalesAgent("ALL");
                        }
                      }
                    } catch (err) {
                      console.error("Gagal membuka ruang obrolan:", err);
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

      {/* Lightbox Modal untuk Pratinjau Gambar Ukuran Penuh */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setLightboxUrl(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxUrl}
              alt="Pratinjau Foto WhatsApp"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="mt-3 flex items-center gap-3">
              <a
                href={lightboxUrl}
                download="whatsapp-image"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold backdrop-blur-sm transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Unduh Gambar
              </a>
              <button
                type="button"
                onClick={() => setLightboxUrl(null)}
                className="px-3 py-1.5 bg-white text-slate-800 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors shadow-sm"
              >
                Tutup
              </button>
            </div>
            <button
              type="button"
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-3 -right-3 p-2 bg-white text-slate-800 rounded-full shadow-lg hover:bg-slate-100 transition-colors"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Tambahkan Proyek ke /projects dari WhatsApp */}
      {activeConv && (
        <WhatsAppCreateProjectModal
          isOpen={isCreateProjectModalOpen}
          onClose={() => setIsCreateProjectModalOpen(false)}
          conversation={activeConv}
          currentUser={currentUser}
          onSuccess={(project, noteText) => {
            const newChatMsg: ChatMessage = {
              id: `msg-sys-${Date.now()}`,
              conversationId: activeConv.id,
              sender: "SALES",
              sentByUserId: currentUser?.id,
              sentByUserName: currentUser?.fullName || "Sistem Fynux",
              text: noteText,
              isDraft: false,
              timestamp: new Date().toISOString(),
            };

            setConversations((prev) =>
              prev.map((c) =>
                c.id === activeConv.id
                  ? {
                      ...c,
                      lastMessageSnippet: `🚀 Proyek: ${project.name}`,
                      lastMessageAt: newChatMsg.timestamp,
                      messages: [...c.messages, newChatMsg],
                    }
                  : c
              )
            );

            setActionFeedback({
              type: "PROJECT",
              message: `Proyek "${project.name}" berhasil dibuat dan masuk ke chat & /projects!`,
              linkUrl: "/projects",
              linkLabel: "Buka /projects",
            });
          }}
        />
      )}

      {/* Modal Tambah Task To Do ke /tasks dari WhatsApp */}
      {activeConv && (
        <WhatsAppCreateTaskModal
          isOpen={isCreateTaskModalOpen}
          onClose={() => setIsCreateTaskModalOpen(false)}
          conversation={activeConv}
          currentUser={currentUser}
          onSuccess={(task, noteText) => {
            const newChatMsg: ChatMessage = {
              id: `msg-sys-${Date.now()}`,
              conversationId: activeConv.id,
              sender: "SALES",
              sentByUserId: currentUser?.id,
              sentByUserName: currentUser?.fullName || "Sistem Fynux",
              text: noteText,
              isDraft: false,
              timestamp: new Date().toISOString(),
            };

            setConversations((prev) =>
              prev.map((c) =>
                c.id === activeConv.id
                  ? {
                      ...c,
                      lastMessageSnippet: `📌 Task: ${task.title}`,
                      lastMessageAt: newChatMsg.timestamp,
                      messages: [...c.messages, newChatMsg],
                    }
                  : c
              )
            );

            setActionFeedback({
              type: "TASK",
              message: `Task To Do "${task.title}" berhasil ditambahkan ke chat & /tasks!`,
              linkUrl: "/tasks",
              linkLabel: "Buka /tasks",
            });
          }}
        />
      )}
    </div>
  );
}
