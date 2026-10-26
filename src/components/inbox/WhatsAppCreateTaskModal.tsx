"use client";

import { useState, useEffect } from "react";
import { X, CheckSquare, Calendar, User, AlertCircle, Layers } from "lucide-react";
import { ConversationThread } from "@/modules/inbox/types";
import { UserSessionData } from "@/modules/auth/types";
import { createTaskAction, fetchProjectsAction } from "@/modules/projects/projects.actions";
import { addConversationNoteAction } from "@/modules/whatsapp/whatsapp.actions";
import { CreateTaskInput, Task } from "@/modules/projects/types";
import { TaskPriority } from "@/types/enums";

interface WhatsAppCreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: ConversationThread;
  currentUser?: UserSessionData | null;
  onSuccess: (task: Task, noteText: string) => void;
}

const TEAM_MEMBERS = [
  { id: "33333333-3333-3333-3333-333333333333", name: "Eko Pratama (Developer)", role: "DEVELOPER" },
  { id: "11111111-1111-1111-1111-111111111111", name: "Faiz Aditama (Owner)", role: "OWNER" },
  { id: "22222222-2222-2222-2222-222222222222", name: "Budi Santoso (Sales 1)", role: "SALES" },
  { id: "44444444-4444-4444-4444-444444444444", name: "Siti Rahma (Sales 2)", role: "SALES" },
  { id: "55555555-5555-5555-5555-555555555555", name: "Dimas Anggara (Sales 3)", role: "SALES" },
  { id: "66666666-6666-6666-6666-666666666666", name: "Anisa Putri (Sales 4)", role: "SALES" },
  { id: "77777777-7777-7777-7777-777777777777", name: "Rian Hidayat (Sales 5)", role: "SALES" },
];

export function WhatsAppCreateTaskModal({
  isOpen,
  onClose,
  conversation,
  currentUser,
  onSuccess,
}: WhatsAppCreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [projectsList, setProjectsList] = useState<Array<{ id: string; name: string }>>([]);
  const [primaryPicId, setPrimaryPicId] = useState<string>(
    "33333333-3333-3333-3333-333333333333" // Default Developer
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
        const noteText = `📌 [TASK TO DO DIBUAT]\n• Judul: ${res.task.title}\n• PIC Utama: ${res.task.primaryPicName}\n• Prioritas: ${res.task.priority}\n• Deadline: ${res.task.deadline || "-"}\nTask telah terdaftar di menu /tasks.`;

        await addConversationNoteAction(
          conversation.id,
          noteText,
          currentUser?.id,
          currentUser?.fullName
        );

        setIsSubmitting(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-6 animate-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-lg">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold">
                Tambah Task To Do ke /tasks
              </h3>
              <p className="text-[11px] text-indigo-100">
                Pekerjaan langsung terdaftar pada papan Task Management tim
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
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
              >
                {TEAM_MEMBERS.map((m) => (
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
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-semibold"
              >
                <option value="URGENT" className="text-rose-600 font-bold">URGENT (Mendesak)</option>
                <option value="HIGH" className="text-amber-600 font-bold">HIGH (Tinggi - Demo)</option>
                <option value="MEDIUM" className="text-indigo-600">MEDIUM (Standar)</option>
                <option value="LOW" className="text-slate-600">LOW (Rendah)</option>
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
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
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
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none leading-relaxed"
            />
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
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckSquare className="w-4 h-4" />
              <span>{isSubmitting ? "Menyimpan..." : "Simpan Task To Do"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
