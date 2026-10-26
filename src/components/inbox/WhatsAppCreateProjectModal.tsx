"use client";

import { useState, useEffect } from "react";
import { X, FolderPlus, Calendar, Building2, Link2, AlertCircle, CheckCircle2 } from "lucide-react";
import { ConversationThread } from "@/modules/inbox/types";
import { UserSessionData } from "@/modules/auth/types";
import { createProjectAction } from "@/modules/projects/projects.actions";
import { addConversationNoteAction } from "@/modules/whatsapp/whatsapp.actions";
import { CreateProjectInput, Project } from "@/modules/projects/types";

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
        const noteText = `🚀 [PROYEK DELIVERY DIBUAT]\n• Nama Proyek: ${res.project.name}\n• Klien: ${res.project.clientName}\n• Target Deadline: ${res.project.deadline || "-"}\n• Lingkup: ${res.project.scopeDescription}\nData telah tersimpan permanen di menu /projects.`;

        await addConversationNoteAction(
          conversation.id,
          noteText,
          currentUser?.id,
          currentUser?.fullName
        );

        setIsSubmitting(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-6 animate-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-lg">
              <FolderPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold">
                Tambahkan Proyek ke /projects
              </h3>
              <p className="text-[11px] text-blue-100">
                Otomatis menghubungkan prospek {conversation.companyName} ke Delivery Workspace
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Info Badge Prospek */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Sumber Percakapan WhatsApp:
              </div>
              <div className="text-xs font-bold text-slate-800 mt-0.5">
                {conversation.companyName}
              </div>
              <div className="text-[11px] text-slate-500">
                PIC: {conversation.contactName} · +{conversation.whatsappNumber}
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 bg-emerald-100 text-emerald-800 rounded-md">
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
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none leading-relaxed"
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
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              <FolderPlus className="w-4 h-4" />
              <span>{isSubmitting ? "Menyimpan..." : "Simpan & Buat Proyek"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
