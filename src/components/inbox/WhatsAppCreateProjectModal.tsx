"use client";

import { useState, useEffect } from "react";
import { X, FolderPlus, Calendar, Building2, Link2, AlertCircle, CheckCircle2 } from "lucide-react";
import { ConversationThread } from "@/modules/inbox/types";
import { UserSessionData } from "@/modules/auth/types";
import { createProjectAction } from "@/modules/projects/projects.actions";
import { addConversationNoteAction } from "@/modules/whatsapp/whatsapp.actions";
import { ModalPortal } from "@/components/common/ModalPortal";
import { CreateProjectInput, Project } from "@/modules/projects/types";
import { useToast } from "@/components/common/Toast";

interface WhatsAppCreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: ConversationThread;
  currentUser?: UserSessionData | null;
  onSuccess: (project: Project, noteText: string) => void;
}

export function WhatsAppCreateProjectModal({
  isOpen,
  onClose,
  conversation,
  currentUser,
  onSuccess,
}: WhatsAppCreateProjectModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [targetDeadline, setTargetDeadline] = useState("");
  const [scopeDescription, setScopeDescription] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Inisialisasi data otomatis dari percakapan prospek
  useEffect(() => {
    if (isOpen && conversation) {
      setName(`Website Demo - ${conversation.companyName}`);
      setClientName(conversation.companyName);
      // Default deadline: 7 hari dari sekarang
      const d = new Date(Date.now() + 86400000 * 7);
      setTargetDeadline(d.toISOString().split("T")[0]);
      setScopeDescription(
        `Inisialisasi pengerjaan demo website / prototipe untuk prospek ${conversation.companyName}.\nKontak PIC: ${conversation.contactName} (+${conversation.whatsappNumber}).\nCatatan riset: ${conversation.researchNotes || "Permintaan demo dari obrolan WhatsApp."}`
      );
      setDriveUrl("");
      setErrorMsg(null);
    }
  }, [isOpen, conversation]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !clientName.trim() || !scopeDescription.trim()) {
      setErrorMsg("Nama proyek, nama klien, dan lingkup pekerjaan wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const input: CreateProjectInput = {
      name: name.trim(),
      clientId: conversation.prospectId || `client-${Date.now()}`,
      clientName: clientName.trim(),
      targetDeadline,
      scopeDescription: scopeDescription.trim(),
      assignedMemberIds: currentUser?.id ? [currentUser.id] : [],
      externalLinks: driveUrl.trim()
        ? [
            {
              title: "Google Drive: Berkas Aset & Referensi Klien",
              url: driveUrl.trim(),
              category: "DOCUMENT",
            },
          ]
        : [],
    };

    try {
      const res = await createProjectAction(
        input,
        currentUser?.id,
        currentUser?.fullName
      );

      if (res.success && res.project) {
        const noteText = `[PROYEK DELIVERY DIBUAT]\n• Nama Proyek: ${res.project.name}\n• Klien: ${res.project.clientName}\n• Target Deadline: ${res.project.deadline || "-"}\n• Lingkup: ${res.project.scopeDescription}\nData telah tersimpan permanen di menu /projects.`;

        await addConversationNoteAction(
          conversation.id,
          noteText,
          currentUser?.id,
          currentUser?.fullName
        );

        setIsSubmitting(false);
        toast.success(`Proyek ${res.project.name} berhasil diinisialisasi`);
        onSuccess(res.project, noteText);
        onClose();
      } else {
        setErrorMsg(res.error || "Gagal membuat proyek.");
        setIsSubmitting(false);
      }
    } catch (err: unknown) {
      console.error("Gagal membuat proyek dari WhatsApp:", err);
      setErrorMsg("Terjadi kesalahan saat memproses pembuatan proyek.");
      setIsSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] modal-backdrop-clean flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-ios-fade">
        <div className="bg-white rounded-xl shadow-xl border border-slate-200/90 w-full max-w-lg max-h-[88vh] flex flex-col overflow-hidden animate-ios-scale relative">
        {/* Header Modal */}
        <div className="shrink-0 bg-white px-6 py-4 border-b border-slate-200/80 flex items-center justify-between text-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-md">
              <FolderPlus className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Tambahkan Proyek ke /projects
              </h3>
              <p className="text-[11px] text-slate-500">
                Hubungkan prospek {conversation.companyName} ke Delivery Workspace
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form wrapping body and sticky footer */}
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-md flex items-center gap-2 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Info Badge Prospek */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Sumber Percakapan WhatsApp:
                </div>
                <div className="text-xs font-semibold text-slate-900 mt-0.5 truncate whitespace-nowrap min-w-0">
                  {conversation.companyName}
                </div>
                <div className="text-[11px] text-slate-500 truncate whitespace-nowrap mt-0.5 font-mono min-w-0 flex items-center gap-1.5">
                  <span className="shrink-0">PIC:</span>
                  <span className="font-medium text-slate-700 truncate max-w-[150px]">
                    {conversation.contactName || conversation.companyName}
                  </span>
                  <span className="text-slate-300 shrink-0">·</span>
                  <span className="shrink-0">+{conversation.whatsappNumber}</span>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 bg-white text-slate-700 border border-slate-200 rounded-md shrink-0 shadow-2xs font-mono">
                WhatsApp Active
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Proyek <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Website Demo - PT Rudal Ajaib"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 shadow-2xs"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Klien / Perusahaan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Deadline <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={targetDeadline}
                  onChange={(e) => setTargetDeadline(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lingkup Pengerjaan (Scope of Work / Demo) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={scopeDescription}
                onChange={(e) => setScopeDescription(e.target.value)}
                placeholder="Jelaskan kebutuhan fitur demo atau materi yang diminta prospek..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 shadow-2xs resize-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Link Google Drive / Berkas Referensi (Opsional)
              </label>
              <div className="relative">
                <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="url"
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Sticky Action Footer */}
          <div className="shrink-0 px-6 py-4 border-t border-slate-200/80 bg-slate-50/90 rounded-b-xl flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-md bg-white hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md transition-colors shadow-2xs disabled:opacity-50 flex items-center gap-1.5"
            >
              <FolderPlus className="w-4 h-4" />
              <span>{isSubmitting ? "Menyimpan..." : "Simpan & Buat Proyek"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
}
