"use client";

import React from "react";
import { X, FileText, Download, ExternalLink, Image as ImageIcon } from "lucide-react";
import { BoardAttachment } from "@/modules/projects/types";
import { ModalPortal } from "@/components/common/ModalPortal";

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
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] modal-backdrop-clean flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-ios-fade">
      <div className="bg-white border border-slate-200/90 rounded-2xl max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl relative overflow-hidden animate-ios-scale">
        {/* Header */}
        <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
              {isImage ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{attachment.name}</h3>
              <p className="text-[11px] text-slate-500">
                {attachment.size || "Ukuran berkas"} / Dokumen Terlampir
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={attachment.url}
              download={attachment.name}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Viewport */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-50/50 min-h-0">
          {isImage ? (
            <img
              src={attachment.url}
              alt={attachment.name}
              className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-md border border-slate-200 bg-white"
            />
          ) : isPdf ? (
            attachment.url.startsWith("data:") ? (
              <iframe
                src={attachment.url}
                title={attachment.name}
                className="w-full h-[55vh] rounded-lg border border-slate-200 bg-white shadow-sm"
              />
            ) : (
              <div className="text-center space-y-4 max-w-md p-8 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <FileText className="w-16 h-16 text-blue-600 mx-auto opacity-90" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{attachment.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Dokumen eksternal PDF / Cloud Drive siap diakses melalui tautan resmi.
                  </p>
                </div>
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  Buka Dokumen PDF <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )
          ) : (
            <div className="text-center space-y-3 max-w-md p-8 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <FileText className="w-14 h-14 text-slate-400 mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">{attachment.name}</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Format berkas siap diunduh untuk dibuka pada aplikasi terkait.
                </p>
              </div>
              <a
                href={attachment.url}
                download={attachment.name}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <Download className="w-4 h-4" /> Unduh Dokumen
              </a>
            </div>
          )}
        </div>

        {/* Sticky Action Footer */}
        <div className="shrink-0 px-6 py-3.5 border-t border-slate-200/80 bg-slate-50/90 rounded-b-2xl flex items-center justify-between text-xs text-slate-500">
          <span className="truncate max-w-xs">{attachment.name}</span>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={attachment.url}
              download={attachment.name}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200/90 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh
            </a>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors shadow-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  </ModalPortal>
);
}
