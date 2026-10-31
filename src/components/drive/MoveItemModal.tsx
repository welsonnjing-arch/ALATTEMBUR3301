"use client";

import { useState } from "react";
import { FolderSymlink, X, Folder, HardDrive, Check } from "lucide-react";
import { moveDriveItemAction } from "@/modules/drive/drive.actions";
import { DriveItem } from "@/modules/drive/types";
import { ModalPortal } from "@/components/common/ModalPortal";
import { playClickSound } from "@/lib/audio";
import { useToast } from "@/components/common/Toast";

interface MoveItemModalProps {
  item: DriveItem | null;
  isOpen: boolean;
  onClose: () => void;
  allFolders: DriveItem[];
  onSuccess: (updatedItem: DriveItem) => void;
}

export function MoveItemModal({
  item,
  isOpen,
  onClose,
  allFolders,
  onSuccess,
}: MoveItemModalProps) {
  const { toast } = useToast();
  const [selectedParentId, setSelectedParentId] = useState<string | null>(
    item?.parentId || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  // Filter out folder itself if moving a folder
  const eligibleFolders = allFolders.filter((f) => f.id !== item.id);

  const handleMove = async () => {
    setIsSubmitting(true);
    setError(null);

    const res = await moveDriveItemAction(item.id, selectedParentId);
    if (res.success && res.item) {
      toast.success(`Berhasil memindahkan "${item.name}"`);
      onSuccess(res.item);
      onClose();
    } else {
      setError(res.error || "Gagal memindahkan item.");
    }
    setIsSubmitting(false);
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] modal-backdrop-clean flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-ios-fade">
        <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden animate-ios-scale">
          <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-lg">
                <FolderSymlink className="w-4 h-4" />
              </div>
              <div className="truncate pr-2">
                <h3 className="text-sm font-bold text-slate-900 truncate">
                  Pindahkan &quot;{item.name}&quot;
                </h3>
                <p className="text-[11px] text-slate-500">Pilih folder tujuan pemindahan</p>
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

          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200/80 text-rose-800 text-xs rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-1.5 max-h-64 overflow-y-auto border border-slate-200/80 rounded-xl p-2 bg-slate-50/50 divide-y divide-slate-100">
              {/* Root Drive Option */}
              <button
                type="button"
                onClick={() => {
                  playClickSound("soft");
                  setSelectedParentId(null);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left ${
                  selectedParentId === null
                    ? "bg-blue-50 text-blue-800 border border-blue-200"
                    : "hover:bg-slate-100 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-blue-600" />
                  <span>HQ Drive (Direktori Utama / Root)</span>
                </div>
                {selectedParentId === null && <Check className="w-4 h-4 text-blue-600" />}
              </button>

              {/* Folders List */}
              {eligibleFolders.map((folder) => {
                const isSelected = selectedParentId === folder.id;
                return (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => {
                      playClickSound("soft");
                      setSelectedParentId(folder.id);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left ${
                      isSelected
                        ? "bg-blue-50 text-blue-800 border border-blue-200"
                        : "hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <Folder className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="truncate">{folder.name}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                );
              })}
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
                type="button"
                disabled={isSubmitting || selectedParentId === item.parentId}
                onClick={handleMove}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? "Memindahkan..." : "Pindahkan ke Sini"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
