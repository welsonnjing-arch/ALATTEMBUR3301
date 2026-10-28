"use client";

import { useState, useEffect } from "react";
import {
  X,
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Tag,
  Briefcase,
  AlertCircle,
  FileText,
  Save,
  Edit3,
  Plus,
  ExternalLink,
  Copy,
  Check,
  FolderPlus,
  CheckSquare,
  Sparkles,
  User,
  Clock,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import { ConversationThread } from "@/modules/inbox/types";
import { Prospect } from "@/modules/crm/types";
import { UserSessionData } from "@/modules/auth/types";
import {
  updateConversationCRMDetailsAction,
  syncWhatsAppContactProfileAction,
} from "@/modules/whatsapp/whatsapp.actions";

interface WhatsAppContactDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: ConversationThread;
  prospect?: Prospect | null;
  currentUser?: UserSessionData | null;
  onOpenCreateProject?: () => void;
  onOpenCreateTask?: () => void;
  onUpdated?: (updatedData: {
    tags: string[];
    researchNotes: string;
    painPoints?: string;
    industry?: string;
    avatarUrl?: string;
    bio?: string;
  }) => void;
}

const PRESET_TAGS = [
  "Hot Lead",
  "Website Demo",
  "Follow Up",
  "VIP Klien",
  "Prioritas",
  "Tender LPSE",
  "Closing",
  "Prospek Baru",
];

export function WhatsAppContactDetailsDrawer({
  isOpen,
  onClose,
  conversation,
  prospect,
  currentUser,
  onOpenCreateProject,
  onOpenCreateTask,
  onUpdated,
}: WhatsAppContactDetailsDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [isSyncingProfile, setIsSyncingProfile] = useState(false);

  // Form states
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [industry, setIndustry] = useState("");
  const [painPoints, setPainPoints] = useState("");
  const [researchNotes, setResearchNotes] = useState("");

  const handleSyncWhatsAppProfile = async () => {
    setIsSyncingProfile(true);
    try {
      const res = await syncWhatsAppContactProfileAction(conversation.id);
      if (res.success && (res.avatarUrl || res.bio)) {
        if (onUpdated) {
          onUpdated({
            tags,
            researchNotes: researchNotes.trim(),
            painPoints: painPoints.trim(),
            industry: industry.trim(),
            avatarUrl: res.avatarUrl,
            bio: res.bio,
          });
        }
      }
    } catch (err) {
      console.error("Gagal menyinkronkan profil WhatsApp:", err);
    } finally {
      setIsSyncingProfile(false);
    }
  };

  // Sinkronkan data saat drawer dibuka atau conversation/prospect berganti
  useEffect(() => {
    if (isOpen) {
      const initialTags =
        conversation.tags ||
        prospect?.tags ||
        [];
      setTags([...initialTags]);
      setIndustry(prospect?.industry || "");
      setPainPoints(prospect?.painPoints || "");
      setResearchNotes(
        conversation.researchNotes ||
        prospect?.researchNotes ||
        ""
      );
      setIsEditing(false);
      setSaveSuccess(false);
    }
  }, [isOpen, conversation, prospect]);

  if (!isOpen) return null;

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(conversation.whatsappNumber);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (!trimmed) return;
    if (tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) return;
    setTags((prev) => [...prev, trimmed]);
    setNewTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await updateConversationCRMDetailsAction(conversation.id, {
        tags,
        researchNotes: researchNotes.trim(),
        painPoints: painPoints.trim(),
        industry: industry.trim(),
      });

      if (res.success) {
        setSaveSuccess(true);
        setIsEditing(false);
        if (onUpdated) {
          onUpdated({
            tags,
            researchNotes: researchNotes.trim(),
            painPoints: painPoints.trim(),
            industry: industry.trim(),
          });
        }
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Gagal menyimpan detail kontak CRM:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Warna badge stage CRM
  const getStageBadgeColor = (stage?: string) => {
    switch (stage) {
      case "NEW":
        return "bg-slate-100 text-slate-700 border-slate-300";
      case "CONTACTED":
        return "bg-sky-50 text-sky-700 border-sky-300";
      case "RESPONDED":
        return "bg-emerald-50 text-emerald-700 border-emerald-300";
      case "MEETING_SCHEDULED":
        return "bg-purple-50 text-purple-700 border-purple-300";
      case "PROPOSAL_SENT":
        return "bg-amber-50 text-amber-700 border-amber-300";
      case "NEGOTIATION":
        return "bg-indigo-50 text-indigo-700 border-indigo-300";
      case "CLOSED_WON":
        return "bg-emerald-500 text-white border-emerald-600";
      case "CLOSED_LOST":
      case "FAILED":
        return "bg-rose-100 text-rose-700 border-rose-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  return (
    <div className="w-80 md:w-96 bg-white border-l border-slate-200 flex flex-col h-full shadow-lg z-20 animate-in slide-in-from-right duration-200 overflow-hidden flex-shrink-0">
      {/* Top Header Drawer */}
      <div className="h-16 px-4 py-3 bg-[#f0f2f5] border-b border-[#d1d7db] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-full transition-colors"
            title="Tutup info kontak"
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="font-semibold text-xs text-slate-800">
            Info Kontak & Riset CRM
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          <a
            href={`/crm?search=${conversation.whatsappNumber}`}
            title="Buka profil lengkap di menu /crm"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
          >
            <span>Buka di CRM</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Konten Scrollable */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {/* Feedback Sukses */}
        {saveSuccess && (
          <div className="bg-emerald-50 text-emerald-800 border-b border-emerald-200 px-4 py-2.5 text-xs flex items-center gap-2 font-medium animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Data riset bisnis dan tags berhasil diperbarui ke CRM!</span>
          </div>
        )}

        {/* 1. Header Profil Kontak */}
        <div className="p-5 flex flex-col items-center text-center bg-gradient-to-b from-slate-50 to-white">
          {/* Round Avatar Profil Kontak */}
          {conversation.avatarUrl ? (
            <img
              src={conversation.avatarUrl}
              alt={conversation.contactName}
              className="w-20 h-20 rounded-full object-cover shadow-md mb-3 border-2 border-white ring-2 ring-slate-100 flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-slate-200 text-slate-700 font-bold text-xl flex items-center justify-center shadow-inner mb-3 border-2 border-white flex-shrink-0">
              {conversation.companyName.substring(0, 2).toUpperCase()}
            </div>
          )}
          <h4 className="font-bold text-sm text-slate-900">
            {conversation.contactName}
          </h4>
          <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-semibold text-slate-800">
              {conversation.companyName}
            </span>
          </p>

          {/* Nomor WhatsApp */}
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-xs text-slate-700 font-mono">
            <Phone className="w-3 h-3 text-emerald-600" />
            <span>+{conversation.whatsappNumber}</span>
            <button
              type="button"
              onClick={handleCopyPhone}
              className="text-slate-400 hover:text-slate-600 ml-0.5"
              title="Salin nomor WhatsApp"
            >
              {copiedPhone ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>

          {/* Stage CRM & Sales Assigned */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
            {prospect && (
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold ${getStageBadgeColor(
                  prospect.stage
                )}`}
              >
                CRM: {prospect.stage}
              </span>
            )}
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium">
              Sales: {conversation.assignedSalesName || "Belum Ditugaskan"}
            </span>
          </div>
        </div>

        {/* BIO / STATUS WHATSAPP ASLI */}
        <div className="p-4 bg-slate-50 border-y border-slate-200/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              Bio / Info WhatsApp
            </span>
            <button
              type="button"
              onClick={handleSyncWhatsAppProfile}
              disabled={isSyncingProfile}
              title="Ambil foto profil dan bio terbaru langsung dari WhatsApp"
              className="text-[10px] text-emerald-700 hover:text-emerald-800 font-semibold hover:underline flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncingProfile ? "animate-spin text-emerald-600" : ""}`} />
              <span>{isSyncingProfile ? "Menyinkronkan..." : "Sinkronkan WA"}</span>
            </button>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
            <p className="text-xs text-slate-700 leading-relaxed">
              {conversation.bio || prospect?.bio ? (
                <span className="italic font-medium">&ldquo;{conversation.bio || prospect?.bio}&rdquo;</span>
              ) : (
                <span className="text-slate-400 italic">
                  Belum ada bio/status WhatsApp (atau disembunyikan oleh setelan privasi kontak).
                </span>
              )}
            </p>
          </div>
        </div>

        {/* 2. TAGS & LABEL KONTAK */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-600" />
              <span>Tags / Label Kontak ({tags.length})</span>
            </label>
          </div>

          {/* Daftar Tag Aktif */}
          <div className="flex flex-wrap gap-1.5 mb-3 min-h-[28px]">
            {tags.length > 0 ? (
              tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-600 transition-colors"
                    title={`Hapus tag ${tag}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">
                Belum ada tag. Pilih preset di bawah atau ketik tag baru.
              </span>
            )}
          </div>

          {/* Input Tag Baru */}
          <div className="flex items-center gap-1.5 mb-2.5">
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag(newTagInput);
                }
              }}
              placeholder="Ketik nama tag baru..."
              className="flex-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => handleAddTag(newTagInput)}
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </button>
          </div>

          {/* Saran Tag Cepat (Preset Tags) */}
          <div>
            <span className="text-[10px] font-medium text-slate-400 block mb-1">
              Pilihan Cepat (Klik untuk menambah):
            </span>
            <div className="flex flex-wrap gap-1">
              {PRESET_TAGS.map((pTag) => {
                const isSelected = tags.includes(pTag);
                return (
                  <button
                    key={pTag}
                    type="button"
                    onClick={() =>
                      isSelected ? handleRemoveTag(pTag) : handleAddTag(pTag)
                    }
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600 font-bold"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200"
                    }`}
                  >
                    {isSelected ? `✓ ${pTag}` : `+ ${pTag}`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. TIGA FIELD UTAMA CRM: INDUSTRI, PAIN POINTS, CATATAN RISET */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Data & Riset Bisnis (CRM)</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsEditing((prev) => !prev)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" />
              <span>{isEditing ? "Batal Edit" : "Edit Riset"}</span>
            </button>
          </div>

          {/* FIELD 1: Industri / Niche Bisnis */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-blue-600" />
              <span>Industri / Niche Bisnis</span>
            </label>
            {isEditing ? (
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="Contoh: Konstruksi, Pendidikan, F&B, dsb."
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            ) : (
              <div className="px-3 py-2 bg-blue-50/60 border border-blue-100 rounded-lg text-xs font-medium text-slate-800">
                {industry || (
                  <span className="text-slate-400 italic">
                    Belum ditentukan di CRM. Klik &quot;Edit Riset&quot; untuk mengisi.
                  </span>
                )}
              </div>
            )}
          </div>

          {/* FIELD 2: Masalah / Peluang Spesifik (Pain Points) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Masalah / Peluang Spesifik (Pain Points)</span>
            </label>
            {isEditing ? (
              <textarea
                rows={3}
                value={painPoints}
                onChange={(e) => setPainPoints(e.target.value)}
                placeholder="Jelaskan kebutuhan, masalah, atau peluang spesifik klien..."
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed"
              />
            ) : (
              <div className="px-3 py-2 bg-amber-50/60 border border-amber-200/70 rounded-lg text-xs text-slate-800 leading-relaxed">
                {painPoints ? (
                  <p className="whitespace-pre-wrap">{painPoints}</p>
                ) : (
                  <span className="text-slate-400 italic">
                    Belum ada catatan pain points. Klik &quot;Edit Riset&quot; untuk melengkapi.
                  </span>
                )}
              </div>
            )}
          </div>

          {/* FIELD 3: Catatan Hasil Riset Bisnis (Opsional) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>Catatan Hasil Riset Bisnis (Opsional)</span>
            </label>
            {isEditing ? (
              <textarea
                rows={4}
                value={researchNotes}
                onChange={(e) => setResearchNotes(e.target.value)}
                placeholder="Catatan bebas hasil riset prospek, profil, persyaratan tender, dsb."
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed"
              />
            ) : (
              <div className="px-3 py-2 bg-emerald-50/40 border border-emerald-100 rounded-lg text-xs text-slate-800 leading-relaxed">
                {researchNotes ? (
                  <p className="whitespace-pre-wrap">{researchNotes}</p>
                ) : (
                  <span className="text-slate-400 italic">
                    Belum ada catatan riset bisnis.
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Tombol Simpan Perubahan */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>
                {isSaving
                  ? "Menyimpan ke CRM..."
                  : "Simpan Perubahan ke CRM & Inbox"}
              </span>
            </button>
          </div>
        </div>

        {/* 4. DETAIL TAMBAHAN KONTAK (Email, Web, Lokasi) */}
        {prospect && (
          <div className="p-4 space-y-2 text-xs">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Informasi Kontak Lainnya
            </h4>
            {prospect.email && (
              <div className="flex items-center gap-2 text-slate-700">
                <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <a
                  href={`mailto:${prospect.email}`}
                  className="truncate text-indigo-600 hover:underline"
                >
                  {prospect.email}
                </a>
              </div>
            )}
            {prospect.website && (
              <div className="flex items-center gap-2 text-slate-700">
                <Globe className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <a
                  href={
                    prospect.website.startsWith("http")
                      ? prospect.website
                      : `https://${prospect.website}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <span>{prospect.website}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
            {prospect.location && (
              <div className="flex items-center gap-2 text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate">{prospect.location}</span>
              </div>
            )}
            {prospect.nextFollowUpDate && (
              <div className="flex items-center gap-2 text-slate-700">
                <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span>Follow Up: {prospect.nextFollowUpDate}</span>
              </div>
            )}
          </div>
        )}

        {/* 5. AKSI CEPAT PROYEK & TASK */}
        <div className="p-4 space-y-2 bg-slate-50">
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Aksi Terintegrasi
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onOpenCreateProject}
              className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-colors text-center"
            >
              <FolderPlus className="w-4 h-4 text-blue-600" />
              <span>Tambah Proyek</span>
            </button>
            <button
              type="button"
              onClick={onOpenCreateTask}
              className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-colors text-center"
            >
              <CheckSquare className="w-4 h-4 text-indigo-600" />
              <span>Task To Do</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
