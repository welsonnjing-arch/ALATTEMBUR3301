"use client";

import { useState } from "react";
import { X, Briefcase, Calendar, FolderPlus } from "lucide-react";
import { CreateProjectInput, Project } from "@/modules/projects/types";
import { createProjectAction } from "@/modules/projects/projects.actions";
import { ModalPortal } from "@/components/common/ModalPortal";
import { useToast } from "@/components/common/Toast";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProject?: Project) => void;
}

export function CreateProjectModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateProjectModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [targetDeadline, setTargetDeadline] = useState(
    new Date(Date.now() + 86400000 * 21).toISOString().split("T")[0]
  );
  const [scopeDescription, setScopeDescription] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !clientName.trim() || !scopeDescription.trim()) {
      setErrorMsg("Seluruh field wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const input: CreateProjectInput = {
      name,
      clientId: `client-${Date.now()}`,
      clientName,
      targetDeadline,
      scopeDescription,
      assignedMemberIds: [],
      externalLinks: driveUrl.trim()
        ? [
            {
              title: "Google Drive: Berkas Aset & Materi Proyek",
              url: driveUrl.trim(),
              category: "DOCUMENT",
            },
          ]
        : [],
    };

    const res = await createProjectAction(input);

    if (res.success) {
      setIsSubmitting(false);
      toast.success(`Proyek ${name} berhasil diinisialisasi`);
      onSuccess(res.project);
      onClose();
    } else {
      setErrorMsg(res.error || "Gagal menginisialisasi proyek.");
      setIsSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] modal-backdrop-clean flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-ios-fade">
      <div className="w-full max-w-lg max-h-[88vh] flex flex-col bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Inisialisasi Project Delivery Baru
              </h3>
              <p className="text-xs text-slate-500">
                Handoff kesepakatan deal diterima menuju workspace pengerjaan developer.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          {/* Scrollable Form Body */}
          <div className="px-6 py-5 overflow-y-auto flex-1 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Proyek <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Business Website & CMS PT Padma Widya Setiajaya"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Klien Perusahaan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama Perusahaan Klien"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ruang Lingkup & Deliverables (Scope of Work) <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Jelaskan fitur yang disepakati, halaman utama, dan kebutuhan integrasi..."
                value={scopeDescription}
                onChange={(e) => setScopeDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tautan Folder Google Drive (Aset Klien)
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/drive/folders/..."
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Fynux OS tidak meng-host berkas besar secara langsung demi keamanan dan efisiensi.
              </p>
            </div>
          </div>

          {/* Sticky Modal Footer */}
          <div className="px-6 py-4 border-t border-slate-200/80 flex items-center justify-end gap-3 shrink-0 bg-slate-50/90 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200/90 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-500/20 transition-colors disabled:opacity-50"
            >
              <FolderPlus className="w-4 h-4" />
              {isSubmitting ? "Menginisialisasi..." : "Inisialisasi Proyek"}
            </button>
          </div>
        </form>
      </div>
    </div>
  </ModalPortal>
);
}
