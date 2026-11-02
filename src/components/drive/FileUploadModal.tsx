"use client";

import { useState, useRef, useCallback } from "react";
import { UploadCloud, X, CheckCircle2, AlertCircle, Loader2, RotateCw } from "lucide-react";
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

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB (Cloudflare request body limit)

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

  // Upload queue runner
  const processUploadQueue = useCallback(
    async (itemsToProcess: QueuedFile[], tags: string) => {
      if (itemsToProcess.length === 0) return;

      setIsUploading(true);
      const successfullyUploaded: DriveItem[] = [];

      for (const item of itemsToProcess) {
        // Validasi ukuran file (Cloudflare 100MB limit)
        if (item.file.size > MAX_FILE_SIZE_BYTES) {
          setQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? {
                    ...q,
                    status: "ERROR",
                    error: "Ukuran file melebihi batas 100MB (limit Cloudflare)",
                  }
                : q
            )
          );
          continue;
        }

        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: "UPLOADING", error: undefined } : q))
        );

        const formData = new FormData();
        formData.append("file", item.file);
        if (currentParentId) {
          formData.append("parentId", currentParentId);
        }
        if (tags.trim()) {
          formData.append("tags", tags.trim());
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
                  ? { ...q, status: "ERROR", error: data.error || "Gagal mengunggah file ke server" }
                  : q
              )
            );
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Jaringan terputus saat mengunggah";
          setQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, status: "ERROR", error: msg } : q))
          );
        }
      }

      setIsUploading(false);

      if (successfullyUploaded.length > 0) {
        toast.success(
          `${successfullyUploaded.length} file berhasil disimpan permanen di server HQ Drive`
        );
        onSuccess(successfullyUploaded);

        // Jika semua file dalam queue berhasil, tutup modal otomatis setelah jeda
        setQueue((currentQueue) => {
          const allDone = currentQueue.every((q) => q.status === "SUCCESS");
          if (allDone) {
            setTimeout(() => {
              onClose();
            }, 1200);
          }
          return currentQueue;
        });
      }
    },
    [currentParentId, onSuccess, onClose, toast]
  );

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: QueuedFile[] = Array.from(files).map((f) => ({
      file: f,
      id: `${f.name}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: "PENDING",
    }));

    setQueue((prev) => [...prev, ...newItems]);

    // Jalankan auto-upload langsung saat file dipilih/di-drop
    processUploadQueue(newItems, tagsInput);
  };

  const retryFailedFiles = () => {
    const failedOrPending = queue.filter(
      (item) => item.status === "ERROR" || item.status === "PENDING"
    );
    if (failedOrPending.length > 0) {
      processUploadQueue(failedOrPending, tagsInput);
    }
  };

  const removeQueuedFile = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  if (!isOpen) return null;

  const pendingCount = queue.filter((i) => i.status === "PENDING").length;
  const errorCount = queue.filter((i) => i.status === "ERROR").length;
  const successCount = queue.filter((i) => i.status === "SUCCESS").length;

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
              disabled={isUploading}
              onClick={() => {
                playClickSound("soft");
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40"
              title="Tutup Modal"
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
              onClick={() => {
                if (!isUploading) {
                  fileInputRef.current?.click();
                }
              }}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                isUploading
                  ? "opacity-60 cursor-not-allowed border-slate-200 bg-slate-50"
                  : isDragOver
                  ? "border-blue-500 bg-blue-50/50 scale-[0.99] cursor-pointer"
                  : "border-slate-200/90 hover:border-slate-400 bg-slate-50/60 cursor-pointer"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                disabled={isUploading}
                onChange={(e) => handleFilesSelected(e.target.files)}
              />
              <UploadCloud className="w-9 h-9 mx-auto text-slate-400 mb-2" />
              <p className="text-xs font-semibold text-slate-800">
                {isUploading
                  ? "Sedang memproses upload ke server..."
                  : "Tarik & lepaskan file ke sini, atau klik untuk memilih file"}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Upload otomatis berjalan langsung saat file dipilih (Maksimal 100 MB per file)
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
                disabled={isUploading}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 shadow-2xs disabled:bg-slate-100"
              />
            </div>

            {/* Queued Files List */}
            {queue.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 block">
                    Daftar File ({queue.length}):
                  </span>
                  {errorCount > 0 && !isUploading && (
                    <button
                      type="button"
                      onClick={retryFailedFiles}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCw className="w-3 h-3" /> Coba Lagi File Gagal ({errorCount})
                    </button>
                  )}
                </div>

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
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-slate-500 font-medium">Menunggu...</span>
                              <button
                                type="button"
                                onClick={() => removeQueuedFile(item.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                                title="Hapus dari antrean"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                          {item.status === "UPLOADING" && (
                            <span className="flex items-center gap-1 text-[11px] text-blue-600 font-medium">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Mengunggah...
                            </span>
                          )}
                          {item.status === "SUCCESS" && (
                            <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Tersimpan
                            </span>
                          )}
                          {item.status === "ERROR" && (
                            <div className="flex items-center gap-1.5">
                              <span
                                className="flex items-center gap-1 text-[11px] text-rose-600 font-medium max-w-[140px] truncate"
                                title={item.error}
                              >
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {item.error || "Gagal"}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeQueuedFile(item.id)}
                                className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                                title="Hapus file ini"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
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
          <div className="px-6 py-4 border-t border-slate-200/80 flex items-center justify-between gap-2.5 bg-slate-50/80 shrink-0">
            <div className="text-[11px] text-slate-500">
              {isUploading ? (
                <span className="flex items-center gap-1 text-blue-600 font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Mengunggah file ke server...
                </span>
              ) : successCount > 0 && errorCount === 0 ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Semua file selesai tersimpan
                </span>
              ) : errorCount > 0 ? (
                <span className="text-rose-600 font-medium">
                  {errorCount} file gagal diunggah
                </span>
              ) : (
                <span>Siap menerima file dokumen, gambar, & arsip</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isUploading}
                onClick={() => {
                  playClickSound("soft");
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200/90 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
              >
                {successCount > 0 ? "Selesai" : "Tutup"}
              </button>

              {errorCount > 0 && !isUploading && (
                <button
                  type="button"
                  onClick={retryFailedFiles}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Coba Lagi ({errorCount})</span>
                </button>
              )}

              {pendingCount > 0 && !isUploading && (
                <button
                  type="button"
                  onClick={() =>
                    processUploadQueue(
                      queue.filter((i) => i.status === "PENDING"),
                      tagsInput
                    )
                  }
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload ({pendingCount})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
