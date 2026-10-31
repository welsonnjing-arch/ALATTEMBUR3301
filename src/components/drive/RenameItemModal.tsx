"use client";

import { useState, useEffect } from "react";
import { Edit3, X } from "lucide-react";
import { renameDriveItemAction } from "@/modules/drive/drive.actions";
import { DriveItem } from "@/modules/drive/types";
import { ModalPortal } from "@/components/common/ModalPortal";
import { playClickSound } from "@/lib/audio";
import { useToast } from "@/components/common/Toast";

interface RenameItemModalProps {
  item: DriveItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedItem: DriveItem) => void;
}

export function RenameItemModal({
  item,
  isOpen,
  onClose,
  onSuccess,
}: RenameItemModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setError(null);
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const res = await renameDriveItemAction(item.id, name.trim());
    if (res.success && res.item) {
      toast.success(`Berhasil mengubah nama menjadi "${res.item.name}"`);
      onSuccess(res.item);
      onClose();
    } else {
      setError(res.error || "Gagal mengubah nama item.");
    }
    setIsSubmitting(false);
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] modal-backdrop-clean flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-ios-fade">
        <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden animate-ios-scale">
          <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-slate-100 text-slate-800 rounded-lg">
                <Edit3 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Ganti Nama {item.type === "FOLDER" ? "Folder" : "File"}
              </h3>
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
                Nama Baru
              </label>
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 shadow-2xs"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
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
                disabled={isSubmitting || !name.trim() || name === item.name}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Nama"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
