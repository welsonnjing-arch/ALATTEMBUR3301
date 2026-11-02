"use client";

import React, { useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { Warranty } from "@/modules/client-lifecycle/types";
import { addWarrantyClaimAction } from "@/modules/client-lifecycle/client-lifecycle.actions";
import { ModalPortal } from "@/components/common/ModalPortal";
import { useToast } from "@/components/common/Toast";

interface CreateWarrantyClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  warranty: Warranty | null;
}

export function CreateWarrantyClaimModal({
  isOpen,
  onClose,
  onSuccess,
  warranty,
}: CreateWarrantyClaimModalProps) {
  const { toast } = useToast();
  const [issueTitle, setIssueTitle] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [reportedBy, setReportedBy] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen || !warranty) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueTitle.trim() || !issueDescription.trim() || !reportedBy.trim()) {
      setErrorMessage("Semua bidang wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await addWarrantyClaimAction({
        warrantyId: warranty.id,
        issueTitle,
        issueDescription,
        reportedBy,
      });

      if (res.success) {
        toast.success("Klaim garansi berhasil dicatat");
        onSuccess();
        onClose();
      } else {
        setErrorMessage(res.error || "Gagal mencatat klaim garansi.");
      }
    } catch {
      setErrorMessage("Terjadi kesalahan saat memproses klaim.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] modal-backdrop-clean flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-ios-fade">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-lg max-h-[88vh] flex flex-col overflow-hidden animate-ios-scale relative">
        {/* Header */}
        <div className="shrink-0 bg-white px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg">
              <AlertCircle className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Catat Klaim Garansi / Masalah Teknis
              </h3>
              <p className="text-xs text-slate-500">
                Klien: <strong className="text-slate-700">{warranty.clientName}</strong> ({warranty.projectName})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form wrapping body and sticky footer */}
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Judul Masalah / Bug <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Misal: Tombol form kontak tidak mengirim pesan"
                value={issueTitle}
                onChange={(e) => setIssueTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dilaporkan Oleh <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Nama PIC klien atau pelapor"
                value={reportedBy}
                onChange={(e) => setReportedBy(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deskripsi Kendala & Kronologi <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                placeholder="Jelaskan langkah reproduksi error atau pesan galat yang muncul..."
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
              />
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="shrink-0 px-6 py-4 border-t border-slate-200/80 bg-slate-50/90 rounded-b-2xl flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-200/90 text-slate-700 text-xs font-semibold rounded-lg bg-white hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Laporan Klaim"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
}
