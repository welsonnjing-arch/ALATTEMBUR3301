"use client";

import { useState, useRef } from "react";
import { UploadCloud, X, File, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { DriveItem } from "@/modules/drive/types";
import { ModalPortal } from "@/components/common/ModalPortal";
import { formatBytes, getFileIcon } from "./DriveHelpers";
import { playClickSound } from "@/lib/audio";
import { useToast } from "@/components/common/Toast";

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentParentId: string | null;
  currentParentName?: string;
  onSuccess: (newFiles: DriveItem[]) => void;
}

interface QueuedFile {
  file: File;
  id: string;
  status: "PENDING" | "UPLOADING" | "SUCCESS" | "ERROR";
  error?: string;
}

export function FileUploadModal({
  isOpen,
  onClose,
  currentParentId,
  currentParentName,
  onSuccess,
}: FileUploadModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [tagsInput, setTagsInput] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newItems: QueuedFile[] = Array.from(files).map((f) => ({
      file: f,
      id: `${f.name}-${Date.now()}-${Math.random()}`,
      status: "PENDING",
    }));
    setQueue((prev) => [...prev, ...newItems]);
  };

  const removeQueuedFile = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUploadAll = async () => {
    const pendingItems = queue.filter((i) => i.status === "PENDING");
    if (pendingItems.length === 0) return;

    setIsUploading(true);
    const successfullyUploaded: DriveItem[] = [];

    for (const item of pendingItems) {
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: "UPLOADING" } : q))
      );

      const formData = new FormData();
      formData.append("file", item.file);
      if (currentParentId) {
        formData.append("parentId", currentParentId);
      }
      if (tagsInput.trim()) {
        formData.append("tags", tagsInput.trim());
      }

      try {
        const res = await fetch("/api/drive/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (res.ok && data.success && data.item) {
          successfullyUploaded.push(data.item);
          setQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, status: "SUCCESS" } : q))
          );
        } else {
          setQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? { ...q, status: "ERROR", error: data.error || "Gagal upload" }
                : q
            )
          );
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Jaringan bermasalah";
        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: "ERROR", error: msg } : q))
        );
      }
    }

    setIsUploading(false);

    if (successfullyUploaded.length > 0) {
      toast.success(`${successfullyUploaded.length} file berhasil diunggah ke HQ Drive`);
      onSuccess(successfullyUploaded);
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] modal-backdrop-clean flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-ios-fade">
        <div className="w-full max-w-lg bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden animate-ios-scale flex flex-col max-h-[88vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-slate-100 text-slate-800 border border-slate-200/80 rounded-lg">
                <UploadCloud className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Upload File ke Shared Drive</h3>
                <p className="text-[11px] text-slate-500">
                  Folder tujuan: {currentParentName || "HQ Drive (Root)"}
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

          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragOver(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                handleFilesSelected(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragOver
                  ? "border-blue-500 bg-blue-50/50 scale-[0.99]"
                  : "border-slate-200/90 hover:border-slate-400 bg-slate-50/60"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
              />
              <UploadCloud className="w-9 h-9 mx-auto text-slate-400 mb-2" />
              <p className="text-xs font-semibold text-slate-800">
                Tarik & lepaskan file ke sini, atau klik untuk memilih file
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Mendukung PDF, Gambar (PNG/JPG/WEBP), Dokumen Office, Kode, Video, & ZIP
              </p>
            </div>

            {/* Optional Tags */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Label / Tags Tambahan (Opsional)
              </label>
              <input
                type="text"
                placeholder="Pisahkan dengan koma (contoh: Proposal, Client Asset, 2026)"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 shadow-2xs"
              />
            </div>

            {/* Queued Files List */}
            {queue.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  File yang Akan Diunggah ({queue.length}):
                </span>
                <div className="max-h-48 overflow-y-auto space-y-1.5 divide-y divide-slate-100 border border-slate-200/80 rounded-xl p-2 bg-slate-50/40">
                  {queue.map((item) => {
                    const ext = item.file.name.split(".").pop();
                    return (
                      <div
                        key={item.id}
                        className="pt-1.5 first:pt-0 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate min-w-0">
                          {getFileIcon(ext, "w-4 h-4 shrink-0")}
                          <div className="truncate">
                            <span className="font-medium text-slate-800 truncate block">
                              {item.file.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {formatBytes(item.file.size)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.status === "PENDING" && (
                            <button
                              type="button"
                              onClick={() => removeQueuedFile(item.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                              title="Hapus dari antrean"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {item.status === "UPLOADING" && (
                            <span className="flex items-center gap-1 text-[11px] text-blue-600 font-medium">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
                            </span>
                          )}
                          {item.status === "SUCCESS" && (
                            <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                            </span>
                          )}
                          {item.status === "ERROR" && (
                            <span className="flex items-center gap-1 text-[11px] text-rose-600 font-medium" title={item.error}>
                              <AlertCircle className="w-3.5 h-3.5" /> Gagal
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200/80 flex items-center justify-end gap-2.5 bg-slate-50/80 shrink-0">
            <button
              type="button"
              onClick={() => {
                playClickSound("soft");
                onClose();
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200/90 rounded-lg transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              disabled={isUploading || queue.filter((i) => i.status === "PENDING").length === 0}
              onClick={handleUploadAll}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengunggah...</span>
                </>
              ) : (
                <span>Upload ({queue.filter((i) => i.status === "PENDING").length}) File</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
