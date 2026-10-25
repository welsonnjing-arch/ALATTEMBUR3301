"use client";

import React from "react";
import { X, FileText, Download, ExternalLink, Image as ImageIcon } from "lucide-react";
import { BoardAttachment } from "@/modules/projects/types";

interface DocumentPreviewModalProps {
  attachment: BoardAttachment | null;
  onClose: () => void;
}

export function DocumentPreviewModal({
  attachment,
  onClose,
}: DocumentPreviewModalProps) {
  if (!attachment) return null;

  const isImage =
    attachment.type.startsWith("image/") ||
    attachment.url.startsWith("data:image/") ||
    /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(attachment.name);

  const isPdf =
    attachment.type.includes("pdf") ||
    attachment.url.startsWith("data:application/pdf") ||
    /\.(pdf)$/i.test(attachment.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-slate-800 text-brand-orange border border-slate-700">
              {isImage ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </span>
            <div>
              <h3 className="text-sm font-bold text-white line-clamp-1">{attachment.name}</h3>
              <p className="text-[11px] text-slate-400">
                {attachment.size || "Ukuran berkas"} • Dokumen Terlampir
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={attachment.url}
              download={attachment.name}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Viewport */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-950/40 min-h-[350px]">
          {isImage ? (
            <img
              src={attachment.url}
              alt={attachment.name}
              className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-lg border border-slate-800"
            />
          ) : isPdf ? (
            attachment.url.startsWith("data:") ? (
              <iframe
                src={attachment.url}
                title={attachment.name}
                className="w-full h-[65vh] rounded-lg border border-slate-800 bg-white"
              />
            ) : (
              <div className="text-center space-y-4 max-w-md p-8 bg-slate-900 border border-slate-800 rounded-2xl">
                <FileText className="w-16 h-16 text-brand-orange mx-auto opacity-80" />
                <div>
                  <h4 className="text-sm font-bold text-white">{attachment.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Dokumen eksternal PDF / Cloud Drive siap diakses melalui tautan resmi.
                  </p>
                </div>
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-orange hover:bg-orange-600 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
                >
                  Buka Dokumen PDF <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )
          ) : (
            <div className="text-center space-y-3 max-w-md p-8 bg-slate-900 border border-slate-800 rounded-2xl">
              <FileText className="w-14 h-14 text-slate-400 mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-white">{attachment.name}</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Format berkas siap diunduh untuk dibuka pada aplikasi terkait.
                </p>
              </div>
              <a
                href={attachment.url}
                download={attachment.name}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
              >
                <Download className="w-4 h-4" /> Unduh Dokumen
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
