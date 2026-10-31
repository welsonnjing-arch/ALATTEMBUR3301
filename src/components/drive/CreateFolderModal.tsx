"use client";

import { useState } from "react";
import { FolderPlus, X } from "lucide-react";
import { createFolderAction } from "@/modules/drive/drive.actions";
import { DriveItem } from "@/modules/drive/types";
import { ModalPortal } from "@/components/common/ModalPortal";
import { playClickSound } from "@/lib/audio";
import { useToast } from "@/components/common/Toast";

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentParentId: string | null;
  currentParentName?: string;
  onSuccess: (newFolder: DriveItem) => void;
}

const COLORS = [
  { id: "blue", label: "Biru", ring: "ring-blue-500", bg: "bg-blue-500" },
  { id: "emerald", label: "Hijau", ring: "ring-emerald-500", bg: "bg-emerald-500" },
  { id: "amber", label: "Amber", ring: "ring-amber-500", bg: "bg-amber-500" },
  { id: "rose", label: "Merah", ring: "ring-rose-500", bg: "bg-rose-500" },
  { id: "slate", label: "Netral", ring: "ring-slate-500", bg: "bg-slate-500" },
];

export function CreateFolderModal({
  isOpen,
  onClose,
  currentParentId,
  currentParentName,
  onSuccess,
}: CreateFolderModalProps) {
  const { toast } = useToast();
  const [folderName, setFolderName] = useState("");
  const [selectedColor, setSelectedColor] = useState("blue");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const res = await createFolderAction({
      name: folderName.trim(),
      parentId: currentParentId,
      color: selectedColor,
    });

    if (res.success && res.item) {
      toast.success(`Folder "${res.item.name}" berhasil dibuat`);
      onSuccess(res.item);
      setFolderName("");
      onClose();
    } else {
      setError(res.error || "Gagal membuat folder.");
    }
    setIsSubmitting(false);
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] modal-backdrop-clean flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-ios-fade">
        <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden animate-ios-scale">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-lg">
                <FolderPlus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Folder Baru</h3>
                <p className="text-[11px] text-slate-500">
                  Di dalam: {currentParentName || "HQ Drive (Root)"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                playClickSound("soft");
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200/80 text-rose-800 text-xs rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Folder <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="Contoh: Dokumen Legal 2026, Asset Klien"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Warna Aksen Folder
              </label>
              <div className="flex items-center gap-3">
                {COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      playClickSound("soft");
                      setSelectedColor(c.id);
                    }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      selectedColor === c.id ? `ring-2 ${c.ring} ring-offset-2 scale-110` : "opacity-80 hover:opacity-100"
                    } ${c.bg}`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  playClickSound("soft");
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200/90 rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !folderName.trim()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? "Membuat..." : "Buat Folder"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
