"use client";

import { useState, useEffect, useMemo } from "react";
import { X, CheckSquare, Calendar, User, AlertCircle, Layers } from "lucide-react";
import { ConversationThread } from "@/modules/inbox/types";
import { UserSessionData } from "@/modules/auth/types";
import { createTaskAction, fetchProjectsAction } from "@/modules/projects/projects.actions";
import { addConversationNoteAction } from "@/modules/whatsapp/whatsapp.actions";
import { ModalPortal } from "@/components/common/ModalPortal";
import { CreateTaskInput, Task } from "@/modules/projects/types";
import { TaskPriority } from "@/types/enums";
import { useToast } from "@/components/common/Toast";

export interface TaskTeamMember {
  id: string;
  name: string;
  role?: string;
}

interface WhatsAppCreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: ConversationThread;
  currentUser?: UserSessionData | null;
  teamMembers?: TaskTeamMember[];
  onSuccess: (task: Task, noteText: string) => void;
}

export function WhatsAppCreateTaskModal({
  isOpen,
  onClose,
  conversation,
  currentUser,
  teamMembers = [],
  onSuccess,
}: WhatsAppCreateTaskModalProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [projectsList, setProjectsList] = useState<Array<{ id: string; name: string }>>([]);

  const availableMembers = useMemo(() => {
    if (teamMembers && teamMembers.length > 0) {
      return teamMembers;
    }
    if (currentUser) {
      return [{ id: currentUser.id, name: currentUser.fullName, role: currentUser.role }];
    }
    return [];
  }, [teamMembers, currentUser]);

  const [primaryPicId, setPrimaryPicId] = useState<string>(
    currentUser?.id || (availableMembers[0]?.id || "")
  );
  const [priority, setPriority] = useState<TaskPriority>("HIGH");
  const [deadline, setDeadline] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && conversation) {
      setTitle(`Buat demo website untuk ${conversation.companyName}`);
      setDescription(
        `Permintaan demo/prototipe dari prospek ${conversation.companyName} via WhatsApp.\nKontak: ${conversation.contactName} (+${conversation.whatsappNumber}).\nHarap siapkan preview landing page / wireframe demo.`
      );
      // Default deadline: 3 hari dari sekarang
      const d = new Date(Date.now() + 86400000 * 3);
      setDeadline(d.toISOString().split("T")[0]);
      setPriority("HIGH");
      setErrorMsg(null);

      // Ambil daftar project aktif untuk dropdown
      fetchProjectsAction().then((projs) => {
        if (projs && Array.isArray(projs)) {
          setProjectsList(projs.map((p) => ({ id: p.id, name: p.name })));
          // Cek apakah ada project yang namanya cocok dengan perusahaan ini
          const matched = projs.find((p) =>
            p.name.toLowerCase().includes(conversation.companyName.toLowerCase()) ||
            p.clientName.toLowerCase().includes(conversation.companyName.toLowerCase())
          );
          if (matched) {
            setProjectId(matched.id);
          } else {
            setProjectId("");
          }
        }
      });
    }
  }, [isOpen, conversation]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Judul task to-do wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const input: CreateTaskInput = {
      title: title.trim(),
      description: description.trim(),
      projectId: projectId || undefined,
      primaryPicId: primaryPicId,
      priority,
      deadline,
    };

    try {
      const res = await createTaskAction(
        input,
        currentUser?.id,
        currentUser?.fullName
      );

      if (res.success && res.task) {
        const noteText = `[TASK TO DO DIBUAT]\n• Judul: ${res.task.title}\n• PIC Utama: ${res.task.primaryPicName}\n• Prioritas: ${res.task.priority}\n• Deadline: ${res.task.deadline || "-"}\nTask telah terdaftar di menu /tasks.`;

        await addConversationNoteAction(
          conversation.id,
          noteText,
          currentUser?.id,
          currentUser?.fullName
        );

        setIsSubmitting(false);
        toast.success(`Task "${res.task.title}" berhasil dibuat`);
        onSuccess(res.task, noteText);
        onClose();
      } else {
        setErrorMsg(res.error || "Gagal membuat task to-do.");
        setIsSubmitting(false);
      }
    } catch (err: unknown) {
      console.error("Gagal membuat task dari WhatsApp:", err);
      setErrorMsg("Terjadi kesalahan saat memproses penambahan task.");
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
              <CheckSquare className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Tambah Task To Do ke /tasks
              </h3>
              <p className="text-[11px] text-slate-500">
                Pekerjaan langsung terdaftar pada papan Task Management tim
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
                Judul Task To Do <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Buat demo website untuk PT Rudal Ajaib"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 shadow-2xs"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  PIC Utama (Penanggung Jawab) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={primaryPicId}
                  onChange={(e) => setPrimaryPicId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white shadow-2xs"
                >
                  {availableMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prioritas Task
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white font-semibold shadow-2xs"
                >
                  <option value="URGENT" className="text-rose-600 font-bold">URGENT (Mendesak)</option>
                  <option value="HIGH" className="text-amber-600 font-bold">HIGH (Tinggi - Demo)</option>
                  <option value="MEDIUM" className="text-slate-800">MEDIUM (Standar)</option>
                  <option value="LOW" className="text-slate-500">LOW (Rendah)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tautkan ke Proyek (Opsional)
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white shadow-2xs"
                >
                  <option value="">-- Tanpa Proyek Khusus --</option>
                  {projectsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Batas Waktu (Deadline)
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deskripsi & Catatan Pekerjaan
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Instruksi pengerjaan demo, link referensi, dll..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 resize-none leading-relaxed shadow-2xs"
              />
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
              <CheckSquare className="w-4 h-4" />
              <span>{isSubmitting ? "Menyimpan..." : "Simpan Task To Do"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
}
