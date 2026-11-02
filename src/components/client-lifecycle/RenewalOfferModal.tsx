"use client";

import React, { useState } from "react";
import { MessageSquare, Copy, Check, ExternalLink, X } from "lucide-react";
import { ModalPortal } from "@/components/common/ModalPortal";
import { useToast } from "@/components/common/Toast";

interface RenewalOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  targetPhone: string;
  initialMessage: string;
}

export function RenewalOfferModal({
  isOpen,
  onClose,
  clientName,
  targetPhone,
  initialMessage,
}: RenewalOfferModalProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState(initialMessage);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    toast.success("Disalin ke clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const cleanPhone = targetPhone.replace(/\D/g, "");
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, "_blank");
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] modal-backdrop-clean flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-ios-fade">
        <div className="w-full max-w-lg max-h-[88vh] flex flex-col bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden animate-ios-scale relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Draf Penawaran Perpanjangan (Renewal)
              </h3>
              <p className="text-xs text-slate-500">
                Penawaran resmi untuk klien <strong>{clientName}</strong> ({targetPhone}).
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

        {/* Scrollable Form Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Pesan disiapkan otomatis dengan klausul pemeliharaan website. Anda dapat mengedit teks sebelum mengirim.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Isi Pesan WhatsApp
            </label>
            <textarea
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 text-xs border border-slate-300 rounded-lg font-sans leading-relaxed focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
            />
          </div>
        </div>

        {/* Sticky Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 bg-slate-50/90 rounded-b-2xl">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                Tersalin!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                Salin Teks
              </>
            )}
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200/90 rounded-lg transition-colors"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              Kirim ke WhatsApp <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
