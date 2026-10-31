"use client";

import { useState, useEffect } from "react";
import {
  Download,
  X,
  FileText,
  Calendar,
  User,
  ExternalLink,
  Layers,
  Sparkles,
} from "lucide-react";
import { DriveItem } from "@/modules/drive/types";
import { ModalPortal } from "@/components/common/ModalPortal";
import { formatBytes, getFileIcon, getFileCategory } from "./DriveHelpers";
import { formatDateWIB } from "@/lib/date";
import { playClickSound } from "@/lib/audio";

interface FilePreviewModalProps {
  item: DriveItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FilePreviewModal({ item, isOpen, onClose }: FilePreviewModalProps) {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoadingText, setIsLoadingText] = useState(false);

  const ext = (item?.extension || "").toLowerCase();
  const isImage = ["png", "jpg", "jpeg", "webp", "svg", "gif"].includes(ext);
  const isPdf = ext === "pdf";
  const isAudio = ["mp3", "wav", "ogg"].includes(ext);
  const isVideo = ["mp4", "mov", "webm"].includes(ext);
  const isTextLike = ["txt", "md", "json", "ts", "tsx", "js", "jsx", "html", "css", "py", "sh", "sql"].includes(ext);

  useEffect(() => {
    if (isOpen && item && isTextLike) {
      setIsLoadingText(true);
      fetch(`/api/drive/download/${item.id}?inline=true`)
        .then((res) => res.text())
        .then((text) => {
          setTextContent(text);
          setIsLoadingText(false);
        })
        .catch(() => {
          setTextContent("Gagal memuat pratinjau teks.");
          setIsLoadingText(false);
        });
    } else {
      setTextContent(null);
    }
  }, [isOpen, item, isTextLike]);

  if (!isOpen || !item) return null;

  const downloadUrl = `/api/drive/download/${item.id}`;
  const inlineUrl = `/api/drive/download/${item.id}?inline=true`;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] modal-backdrop-clean flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs animate-ios-fade">
        <div className="w-full max-w-4xl h-[90vh] bg-white border border-slate-200/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-ios-scale">
          {/* Header Bar */}
          <div className="px-6 py-3.5 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center gap-3 truncate min-w-0 pr-4">
              <div className="p-2 bg-slate-100 rounded-lg shrink-0">
                {getFileIcon(item.extension, "w-5 h-5")}
              </div>
              <div className="truncate">
                <h3 className="text-sm font-bold text-slate-900 truncate">
                  {item.name}
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                  <span>{formatBytes(item.size)}</span>
                  <span>•</span>
                  <span>{getFileCategory(item.extension)}</span>
                  <span>•</span>
                  <span>Diupload oleh {item.uploadedByUserName}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={downloadUrl}
                download={item.name}
                onClick={() => playClickSound("soft")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  playClickSound("soft");
                  onClose();
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="Tutup (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Preview Container */}
          <div className="flex-1 overflow-auto bg-slate-100/70 p-4 sm:p-6 flex items-center justify-center relative">
            {/* Image Preview */}
            {isImage && (
              <div className="relative max-w-full max-h-full flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={inlineUrl}
                  alt={item.name}
                  className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-md border border-slate-200 bg-white"
                />
              </div>
            )}

            {/* PDF Preview */}
            {isPdf && (
              <iframe
                src={`${inlineUrl}#toolbar=1`}
                title={item.name}
                className="w-full h-full rounded-lg border border-slate-200/90 shadow-sm bg-white"
              />
            )}

            {/* Video Player */}
            {isVideo && (
              <video
                controls
                src={inlineUrl}
                className="max-w-full max-h-[75vh] rounded-lg shadow-md bg-black"
              >
                Browser Anda tidak mendukung pemutar video HTML5.
              </video>
            )}

            {/* Audio Player */}
            {isAudio && (
              <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-md text-center space-y-4 max-w-md w-full">
                <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl w-fit mx-auto">
                  {getFileIcon(item.extension, "w-8 h-8")}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{item.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{formatBytes(item.size)}</p>
                </div>
                <audio controls src={inlineUrl} className="w-full" />
              </div>
            )}

            {/* Text / Markdown / Code Preview */}
            {isTextLike && (
              <div className="w-full h-full max-w-3xl bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm overflow-auto text-xs font-mono leading-relaxed text-slate-800">
                {isLoadingText ? (
                  <div className="text-slate-400 italic text-center py-12">
                    Memuat pratinjau teks...
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap">{textContent}</pre>
                )}
              </div>
            )}

            {/* Fallback Binary Preview Box */}
            {!isImage && !isPdf && !isVideo && !isAudio && !isTextLike && (
              <div className="bg-white p-8 rounded-xl border border-slate-200/90 shadow-md text-center max-w-md w-full space-y-3">
                <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center mx-auto text-slate-600">
                  {getFileIcon(item.extension, "w-7 h-7")}
                </div>
                <h4 className="text-sm font-bold text-slate-900">{item.name}</h4>
                <p className="text-xs text-slate-500">
                  Pratinjau langsung tidak tersedia untuk format .{item.extension?.toUpperCase()}.
                  Silakan unduh file untuk membukanya di komputer Anda.
                </p>
                <div className="pt-2">
                  <a
                    href={downloadUrl}
                    download={item.name}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download File ({formatBytes(item.size)})</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Footer Metadata */}
          <div className="px-6 py-3 border-t border-slate-200/80 bg-white flex flex-wrap items-center justify-between text-[11px] text-slate-500 shrink-0 gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Uploader: <strong>{item.uploadedByUserName}</strong> ({item.uploadedByRole})
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Diunggah: {formatDateWIB(item.createdAt)}
              </span>
            </div>

            {item.tags && item.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {item.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
