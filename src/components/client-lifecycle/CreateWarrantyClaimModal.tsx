"use client";

import React, { useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { Warranty } from "@/modules/client-lifecycle/types";
import { addWarrantyClaimAction } from "@/modules/client-lifecycle/client-lifecycle.actions";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-rose-600">
          <AlertCircle className="w-5 h-5" />
          <h3 className="text-base font-bold text-slate-900">
            Catat Klaim Garansi / Masalah Teknis
          </h3>
        </div>

        <div className="text-xs text-slate-500">
          Klien: <strong>{warranty.clientName}</strong> ({warranty.projectName})
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
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
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500/20"
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
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
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
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Laporan Klaim"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
