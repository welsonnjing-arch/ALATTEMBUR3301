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
  syncWhatsAppContactProfileAction,
} from "@/modules/whatsapp/whatsapp.actions";
import { WhatsAppPairingModal } from "@/components/whatsapp/WhatsAppPairingModal";
import { WhatsAppCreateProjectModal } from "./WhatsAppCreateProjectModal";
import { WhatsAppCreateTaskModal } from "./WhatsAppCreateTaskModal";
import { WhatsAppEmojiPicker } from "./WhatsAppEmojiPicker";
import { WhatsAppContactDetailsDrawer } from "./WhatsAppContactDetailsDrawer";
import { formatDateTimeWIB } from "@/lib/date";
import { ModalPortal } from "@/components/common/ModalPortal";

export function formatChatTimestamp(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    }
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return "Kemarin";
    }
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "numeric", year: "2-digit" });
  } catch {
    return "";
  }
}

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
          <Clock className={iconClass} style={{ color: "#8696a0" }} />
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

  // Otomatis memuat foto profil dan bio asli dari WhatsApp saat user membuka ruang percakapan (roomchat)
  const syncedConvTimestampsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!activeConvId) return;

    const targetConv = conversations.find((c) => c.id === activeConvId);
    if (!targetConv) return;

    const targetPhone = targetConv.whatsappNumber.replace(/\D/g, "");
    const targetProspectId = targetConv.prospectId;

    const now = Date.now();
    const lastSynced = syncedConvTimestampsRef.current.get(activeConvId) || 0;
    const hasFullProfile = Boolean(targetConv.avatarUrl && targetConv.bio);
    const isWithinCooldown = now - lastSynced < 120_000; // 2 menit cooldown jika data sudah terisi penuh

    if (hasFullProfile && isWithinCooldown) {
      return;
    }

    syncedConvTimestampsRef.current.set(activeConvId, now);

    let isMounted = true;
    async function autoLoadWhatsAppProfile() {
      try {
        const res = await syncWhatsAppContactProfileAction(activeConvId);
        if (isMounted && res.success && (res.avatarUrl || res.bio)) {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === activeConvId
                ? {
                    ...c,
                    avatarUrl: res.avatarUrl || c.avatarUrl,
                    bio: res.bio || c.bio,
                  }
                : c
            )
          );

          setLocalProspects((prev) =>
            prev.map((p) => {
              const isMatch =
                (targetProspectId && p.id === targetProspectId) ||
                p.whatsappNumber.replace(/\D/g, "") === targetPhone;
              if (isMatch) {
                return {
                  ...p,
                  avatarUrl: res.avatarUrl || p.avatarUrl,
                  bio: res.bio || p.bio,
                };
              }
              return p;
            })
          );
        }
      } catch (err) {
        // Silent fail jika koneksi WhatsApp offline
      }
    }

    autoLoadWhatsAppProfile();

    return () => {
      isMounted = false;
    };
  }, [activeConvId]);

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
  const crmCount = conversations.filter((c) => Boolean(c.prospectId)).length;

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
            (attachmentToSend ? `[Lampiran] ${attachmentToSend.fileName}` : "Pesan terkirim");
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
    <div className="flex h-full w-full bg-[#f0f2f5] overflow-hidden rounded-none border-0 shadow-none">
      {/* ======================================================== */}
      {/* 1. SIDEBAR DAFTAR CHAT (1:1 WHATSAPP WEB LEFT PANEL)     */}
      {/* ======================================================== */}
      <div
        className={`${
          activeConvId ? "hidden md:flex" : "flex"
        } w-full md:w-80 lg:w-96 flex-col h-full bg-white border-r border-[#d1d7db] flex-shrink-0`}
      >
        {/* Header Profil WhatsApp Web & Status Sesi */}
        <div className="h-16 bg-[#f0f2f5] px-4 py-2.5 flex items-center justify-between border-b border-[#d1d7db]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-md bg-emerald-700 text-white font-bold flex items-center justify-center text-xs shadow-2xs border border-emerald-600/50">
                F
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#f0f2f5] ${
                  session.status === "CONNECTED"
                    ? "bg-emerald-500"
                    : session.status === "CONNECTING" || session.status === "SCANNING_QR"
                    ? "bg-amber-500"
                    : "bg-slate-400"
                }`}
                title={
                  session.status === "CONNECTED"
                    ? "Status: Terhubung (Online)"
                    : session.status === "CONNECTING" || session.status === "SCANNING_QR"
                    ? "Status: Sedang Menghubungkan..."
                    : "Status: Belum Tertaut"
                }
              />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-semibold text-[#111b21] leading-tight block truncate">
                WhatsApp
              </span>
              <span className="text-[11px] text-[#667781] leading-tight block mt-0.5 font-mono truncate">
                {session.status === "CONNECTED"
                  ? session.phoneNumber
                    ? session.phoneNumber.startsWith("+")
                      ? session.phoneNumber
                      : `+${session.phoneNumber}`
                    : "Terhubung"
                  : session.status === "CONNECTING" || session.status === "SCANNING_QR"
                  ? "Menghubungkan..."
                  : "Sesi Belum Tertaut"}
              </span>
            </div>
          </div>

          {/* Action Icons: Pairing & New Chat */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsPairingModalOpen(true)}
              title={
                session.status === "CONNECTED"
                  ? `Kelola Sesi WhatsApp (${session.phoneNumber ? (session.phoneNumber.startsWith("+") ? session.phoneNumber : `+${session.phoneNumber}`) : "Aktif"})`
                  : session.status === "CONNECTING" || session.status === "SCANNING_QR"
                  ? "Sedang Menghubungkan WhatsApp (Klik untuk kelola / pindai QR)"
                  : "Tautkan Akun WhatsApp (Pindai QR)"
              }
              aria-label="Kelola Sesi WhatsApp"
              className="relative w-8 h-8 rounded-md flex items-center justify-center text-[#54656f] hover:text-[#111b21] hover:bg-slate-200/70 transition-colors"
            >
              <Smartphone className="w-4 h-4" />
              {session.status !== "CONNECTED" && (
                <span
                  className={`absolute top-1 right-1 w-2 h-2 rounded-full ring-2 ring-[#f0f2f5] ${
                    session.status === "CONNECTING" || session.status === "SCANNING_QR"
                      ? "bg-amber-500 animate-pulse"
                      : "bg-rose-500"
                  }`}
                />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsNewChatModalOpen(true)}
              title="Mulai Chat Prospek Baru"
              aria-label="Mulai Chat Prospek Baru"
              className="w-8 h-8 rounded-md flex items-center justify-center text-[#54656f] hover:text-[#111b21] hover:bg-slate-200/70 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Kolom Pencarian WhatsApp Web */}
        <div className="p-2 border-b border-[#f0f2f5] bg-white">
          <div className="relative flex items-center bg-[#f0f2f5] rounded-md px-3 py-1.5 focus-within:bg-white focus-within:ring-1 focus-within:ring-emerald-600 border border-transparent focus-within:border-emerald-600 transition-all">
            <Search className="w-4 h-4 text-[#54656f] mr-2 shrink-0" />
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
                className="text-slate-400 hover:text-slate-600 p-0.5"
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
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                filterTab === "MY_CHATS"
                  ? "bg-[#e7fce3] text-[#008069] font-bold border border-emerald-200/80"
                  : "bg-[#f0f2f5] text-[#54656f] hover:bg-slate-200/60"
              }`}
            >
              <span>Chat Saya</span>
              <span className="text-[10px] font-mono opacity-80">({myChatsCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab("ALL")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                filterTab === "ALL"
                  ? "bg-[#e7fce3] text-[#008069] font-bold border border-emerald-200/80"
                  : "bg-[#f0f2f5] text-[#54656f] hover:bg-slate-200/60"
              }`}
            >
              <span>Semua Tim</span>
              <span className="text-[10px] font-mono opacity-80">({conversations.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab("UNASSIGNED")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                filterTab === "UNASSIGNED"
                  ? "bg-amber-100 text-amber-900 font-bold border border-amber-200/80"
                  : "bg-[#f0f2f5] text-[#54656f] hover:bg-slate-200/60"
              }`}
            >
              <span>Belum Ditugaskan</span>
              {unassignedCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-bold font-mono">
                  {unassignedCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setFilterTab("CRM")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                filterTab === "CRM"
                  ? "bg-[#e7fce3] text-[#008069] font-bold border border-emerald-200/80"
                  : "bg-[#f0f2f5] text-[#54656f] hover:bg-slate-200/60"
              }`}
            >
              <span>Prospek CRM</span>
              <span className="text-[10px] font-mono opacity-80">({crmCount})</span>
            </button>
          </div>

          {/* Supervisor / Owner Dropdown: Filter Khusus per Sales (Hanya Akses Owner) */}
          {isOwner && (
            <div className="mt-2 px-1 flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 p-1.5 rounded-md border border-slate-200/70">
              <span className="flex items-center gap-1 text-slate-600 font-medium">
                <Users className="w-3.5 h-3.5 text-slate-600" /> Filter Agen:
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
                  className={`px-3.5 py-3 flex items-start gap-3 cursor-pointer transition-colors ${
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
                      className="w-11 h-11 rounded-full object-cover shrink-0 border border-slate-200/90 shadow-2xs mt-0.5"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-slate-200 text-slate-700 font-semibold flex items-center justify-center text-xs shrink-0 shadow-2xs mt-0.5 border border-slate-300/50">
                      {c.companyName.substring(0, 2).toUpperCase()}
                    </div>
                  )}

                  {/* Konten Chat Item (Single-Line Guaranteed, No Multi-line Stacking) */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    {/* Baris 1: Nama Kontak & Perusahaan + Waktu */}
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden flex-nowrap">
                        <h4 className="text-xs font-semibold text-slate-900 truncate whitespace-nowrap min-w-0 shrink">
                          {c.contactName || c.companyName || "Kontak WhatsApp"}
                        </h4>
                        {c.companyName && c.companyName !== c.contactName && (
                          <span className="text-[11px] text-slate-500 font-normal truncate whitespace-nowrap min-w-0 shrink max-w-[55%]">
                            · {c.companyName}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0 whitespace-nowrap tabular-nums ml-1">
                        {formatChatTimestamp(c.lastMessageAt)}
                      </span>
                    </div>

                    {/* Baris 2: Snippet Pesan & Indikator Centang / Unread */}
                    {(() => {
                      const lastMsg = c.messages[c.messages.length - 1];
                      const isOutgoing =
                        lastMsg && (lastMsg.sender === "SALES" || lastMsg.sender === "AI");

                      return (
                        <div className="flex items-center justify-between gap-2 mt-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 min-w-0 flex-1 overflow-hidden flex-nowrap">
                            {isOutgoing && (
                              <MessageStatusTick status={lastMsg?.status} size="sm" />
                            )}
                            <span className="truncate whitespace-nowrap min-w-0 flex-1">
                              {c.lastMessageSnippet || "Belum ada pesan"}
                            </span>
                          </div>

                          {c.unreadCount > 0 && (
                            <span className="h-4 min-w-[16px] px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 font-mono">
                              {c.unreadCount}
                            </span>
                          )}
                        </div>
                      );
                    })()}

                    {/* Baris 3: Status Sales, Stage CRM & Tag (Single-line chips horizontal) */}
                    <div className="flex items-center gap-1.5 mt-1.5 min-w-0 overflow-hidden flex-nowrap">
                      {c.assignedSalesName ? (
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium shrink-0 whitespace-nowrap ${
                            isMine
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold"
                              : "bg-slate-100 text-slate-600 border border-slate-200/70"
                          }`}
                        >
                          <UserCheck className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate max-w-[85px]">
                            {isMine
                              ? "Chat Saya"
                              : c.assignedSalesName.replace(/\s*\(.*\)/, "")}
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-50 text-amber-700 border border-amber-200/80 shrink-0 whitespace-nowrap">
                          <ShieldAlert className="w-2.5 h-2.5 shrink-0" />
                          <span>Belum Ada Sales</span>
                        </span>
                      )}

                      {prospect && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded border font-mono font-semibold shrink-0 whitespace-nowrap ${getStageBadge(
                            prospect.stage
                          )}`}
                        >
                          {prospect.stage}
                        </span>
                      )}

                      {c.tags && c.tags.length > 0 && (
                        <div className="flex items-center gap-1 min-w-0 overflow-hidden shrink">
                          {c.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono border border-slate-200/60 shrink-0 whitespace-nowrap truncate max-w-[80px]"
                            >
                              #{tag}
                            </span>
                          ))}
                          {c.tags.length > 2 && (
                            <span className="text-[9px] text-slate-400 font-mono shrink-0">
                              +{c.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
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
      <div
        className={`${
          !activeConvId ? "hidden md:flex" : "flex"
        } flex-1 flex h-full overflow-hidden relative`}
      >
        <div className="flex-1 flex flex-col h-full bg-[#efeae2] relative min-w-0">
          {activeConv ? (
            <>
              {/* Header Ruang Chat */}
              <div className="h-16 bg-[#f0f2f5] px-4 py-2.5 flex items-center justify-between border-b border-[#d1d7db] z-10 gap-2 sm:gap-3">
                {/* Mobile Back Button to Conversation List */}
                <button
                  type="button"
                  onClick={() => setActiveConvId("")}
                  className="md:hidden p-1.5 -ml-1 text-slate-600 hover:bg-slate-200/70 rounded-md transition-colors shrink-0"
                  title="Kembali ke daftar percakapan"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {/* Info Kontak & Profil (Kiri - Single-Line Guaranteed) */}
                <div
                  onClick={() => setIsContactInfoOpen((prev) => !prev)}
                  className="flex items-center gap-2.5 sm:gap-3 cursor-pointer p-1 -m-1 rounded-md hover:bg-slate-200/60 transition-colors group select-none min-w-0 flex-1"
                  title="Klik untuk membuka Info Kontak, Tags & Riset CRM"
                >
                  {/* Round Avatar Header */}
                  {activeConv.avatarUrl ? (
                    <img
                      src={activeConv.avatarUrl}
                      alt={activeConv.contactName || activeConv.companyName}
                      className="w-10 h-10 rounded-full object-cover shadow-2xs shrink-0 border border-slate-200/90"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 group-hover:bg-slate-300 text-slate-700 font-semibold flex items-center justify-center text-xs shadow-2xs shrink-0 transition-colors border border-slate-300/50">
                      {(activeConv.companyName || activeConv.contactName || "WA").substring(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    {/* Baris 1 Header: Nama Kontak + Perusahaan + CRM Stage */}
                    <div className="flex items-center gap-2 min-w-0 flex-nowrap overflow-hidden">
                      <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate whitespace-nowrap min-w-0 shrink">
                        {activeConv.contactName || activeConv.companyName || "Kontak WhatsApp"}
                      </h3>
                      {activeConv.companyName && activeConv.companyName !== activeConv.contactName && (
                        <span className="text-xs text-slate-500 font-normal truncate whitespace-nowrap min-w-0 shrink max-w-[160px] hidden sm:inline">
                          ({activeConv.companyName})
                        </span>
                      )}
                      {activeProspect && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono border font-semibold shrink-0 whitespace-nowrap ${getStageBadge(
                            activeProspect.stage
                          )}`}
                        >
                          CRM: {activeProspect.stage}
                        </span>
                      )}
                      {activeConv.tags && activeConv.tags.length > 0 && (
                        <div className="hidden xl:flex items-center gap-1 shrink-0">
                          {activeConv.tags.slice(0, 2).map((t) => (
                            <span
                              key={t}
                              className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-slate-100 text-slate-600 font-medium border border-slate-200/70 shrink-0"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Baris 2 Header: Nomor WA + Bio/Status WA + PIC Sales */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 min-w-0 flex-nowrap whitespace-nowrap overflow-hidden">
                      <span className="font-mono text-[11px] text-slate-600 shrink-0">
                        +{activeConv.whatsappNumber}
                      </span>
                      {activeConv.bio ? (
                        <>
                          <span className="text-slate-300 shrink-0">·</span>
                          <span className="text-slate-500 truncate text-[11px] italic min-w-0 shrink max-w-[180px]">
                            &ldquo;{activeConv.bio}&rdquo;
                          </span>
                        </>
                      ) : activeConv.companyName && activeConv.companyName !== activeConv.contactName ? (
                        <>
                          <span className="text-slate-300 shrink-0 sm:hidden">·</span>
                          <span className="text-slate-500 truncate text-[11px] min-w-0 shrink sm:hidden">
                            {activeConv.companyName}
                          </span>
                        </>
                      ) : null}
                      {activeConv.assignedSalesName && (
                        <>
                          <span className="text-slate-300 shrink-0">·</span>
                          <span className="text-slate-500 text-[11px] shrink-0 font-medium">
                            Sales: {activeConv.assignedSalesName.replace(/\s*\(.*\)/, "")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons di Header Chat (Kanan) */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {/* Multi-Agent Assignment: Hanya Owner yang Berhak Mengatur/Memindahkan */}
                  {isOwner ? (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsAssignDropdownOpen((prev) => !prev)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors shadow-2xs ${
                          activeConv.assignedSalesName
                            ? "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
                            : "bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300"
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="max-w-[120px] truncate">
                          {activeConv.assignedSalesName
                            ? activeConv.assignedSalesName.replace(/\s*\(.*\)/, "")
                            : "Tugaskan Sales"}
                        </span>
                        <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                      </button>

                      {/* Dropdown Menu untuk Transfer / Assignment (Khusus Owner) */}
                      {isAssignDropdownOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-20"
                            onClick={() => setIsAssignDropdownOpen(false)}
                          />
                          <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-lg shadow-lg border border-slate-200/90 py-1.5 z-30 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                              Tugaskan Kontak Ini Ke:
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
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border bg-white text-slate-700 border-slate-200 select-none shadow-2xs"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="max-w-[120px] truncate">
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
                    className={`p-1.5 rounded-md transition-colors ${
                      isContactInfoOpen
                        ? "bg-slate-200 text-slate-800 shadow-2xs"
                        : "text-[#54656f] hover:bg-slate-200/70"
                    }`}
                  >
                    <Info className="w-4 h-4" />
                  </button>

                  {/* Tombol Search dalam Chat */}
                  <button
                    type="button"
                    className="p-1.5 text-[#54656f] hover:bg-slate-200/70 rounded-md transition-colors"
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
                      className={`p-1.5 rounded-md transition-colors ${
                        isMoreMenuOpen
                          ? "bg-slate-200/80 text-slate-800"
                          : "text-[#54656f] hover:bg-slate-200/70"
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
                        <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-lg shadow-lg border border-slate-200/90 py-1 z-30 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100 text-slate-700">
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
                              <FolderPlus className="w-4 h-4 text-slate-600 shrink-0" />
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
                              <CheckSquare className="w-4 h-4 text-slate-600 shrink-0" />
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
                              className="w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              <Sparkles className="w-4 h-4 text-slate-500 shrink-0" />
                              <span>{isSimulating ? "Menerima..." : "Simulasi Balasan Klien"}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsMoreMenuOpen(false);
                                handleSimulateRecipientRead();
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              <CheckCheck className="w-4 h-4 text-[#53bdeb] shrink-0" />
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
                              <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
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
                          <span className="font-mono text-emerald-700">@</span>
                          <span>{m.sentByUserName}</span>
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
                  <Smartphone className="w-4 h-4 text-amber-600 flex-shrink-0" />
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
                      {pendingAttachment.fileSize} /{" "}
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
                  className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-md transition-colors flex-shrink-0"
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
                className={`p-2 rounded-md transition-colors ${
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
                className={`p-2 rounded-md transition-colors ${
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
                  className="w-full bg-white rounded-md px-3.5 py-2 text-xs text-[#111b21] placeholder-[#667781] focus:outline-none focus:ring-1 focus:ring-emerald-600 border border-slate-200 shadow-2xs"
                />
              </form>

              {inputText.trim() || pendingAttachment ? (
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={isSending}
                  className="p-2 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-md transition-colors shadow-2xs shrink-0"
                  title="Kirim Pesan"
                >
                  <Send className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  className="p-2 text-[#54656f] hover:bg-slate-200/60 rounded-md transition-colors shrink-0"
                >
                  <Mic className="w-5 h-5" />
                </button>
              )}
            </div>
          </>
        ) : (
          /* Empty State (WhatsApp Web Style) */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#f0f2f5]">
            <div className="w-16 h-16 rounded-full bg-[#00a884]/10 text-[#00a884] flex items-center justify-center mb-4 border border-[#00a884]/20">
              <MessageSquare className="w-8 h-8" />
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
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] modal-backdrop-clean flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-ios-fade">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200/90 w-full max-w-md max-h-[88vh] flex flex-col overflow-hidden animate-ios-scale relative">
            <div className="shrink-0 bg-white px-5 py-3.5 border-b border-slate-200/80 flex items-center justify-between text-slate-900">
              <h3 className="text-sm font-semibold text-slate-900">
                Mulai Chat WhatsApp Prospek
              </h3>
              <button
                type="button"
                onClick={() => setIsNewChatModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3 divide-y divide-slate-100">
              <p className="text-[11px] text-slate-500 mb-2.5">
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
                  className="py-2.5 px-2 hover:bg-slate-50 rounded-md cursor-pointer transition-colors flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate whitespace-nowrap min-w-0">
                      {p.contactName || p.companyName || "Prospek CRM"}
                    </h5>
                    <div className="text-[11px] text-slate-500 truncate whitespace-nowrap mt-0.5 font-mono min-w-0 flex items-center gap-1.5">
                      {p.companyName && p.companyName !== p.contactName && (
                        <>
                          <span className="truncate max-w-[160px]">{p.companyName}</span>
                          <span className="text-slate-300 shrink-0">·</span>
                        </>
                      )}
                      <span className="shrink-0">+{p.whatsappNumber}</span>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded font-mono font-semibold border shrink-0 whitespace-nowrap ${getStageBadge(
                      p.stage
                    )}`}
                  >
                    {p.stage}
                  </span>
                </div>
              ))}
            </div>

            {/* Sticky Action Footer */}
            <div className="shrink-0 px-5 py-3 border-t border-slate-200/80 bg-slate-50/90 rounded-b-xl flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsNewChatModalOpen(false)}
                className="px-3.5 py-1.5 border border-slate-200 text-slate-700 text-xs font-semibold rounded-md bg-white hover:bg-slate-100 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Lightbox Modal untuk Pratinjau Gambar Ukuran Penuh */}
      {lightboxUrl && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[10000] modal-backdrop-clean flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150"
            onClick={() => setLightboxUrl(null)}
          >
            <div
              className="relative max-w-4xl max-h-[90vh] flex flex-col items-center animate-ios-scale"
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
        </ModalPortal>
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
                      lastMessageSnippet: `Proyek: ${project.name}`,
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
                      lastMessageSnippet: `Task: ${task.title}`,
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
