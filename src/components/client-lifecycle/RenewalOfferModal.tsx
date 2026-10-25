"use client";

import React, { useState } from "react";
import { MessageSquare, Copy, Check, ExternalLink, X } from "lucide-react";

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
  const [message, setMessage] = useState(initialMessage);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const cleanPhone = targetPhone.replace(/\D/g, "");
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-indigo-700">
          <MessageSquare className="w-5 h-5" />
          <h3 className="text-base font-bold text-slate-900">
            Draf Penawaran Perpanjangan (Renewal)
          </h3>
        </div>

        <p className="text-xs text-slate-500">
          Pesan penawaran ramah & profesional yang disiapkan otomatis untuk klien{" "}
          <strong>{clientName}</strong> ({targetPhone}). Anda dapat mengedit teks sebelum mengirim.
        </p>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Isi Pesan WhatsApp
          </label>
          <textarea
            rows={8}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-3 text-xs border border-slate-300 rounded-xl font-sans leading-relaxed focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
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

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              Kirim ke WhatsApp <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
