"use client";

import { useState } from "react";
import { X, AlertTriangle, Check, Sparkles, Building2, User, Phone, Globe, Tag } from "lucide-react";
import { CreateProspectInput, normalizeWhatsAppNumber } from "@/modules/crm/types";
import { checkDuplicateAction, createProspectAction } from "@/modules/crm/crm.actions";

interface CreateProspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateProspectModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateProspectModalProps) {
  const [formData, setFormData] = useState<CreateProspectInput>({
    companyName: "",
    contactName: "",
    whatsappNumber: "",
    email: "",
    website: "",
    industry: "",
    location: "",
    researchNotes: "",
    painPoints: "",
    potentialServices: "Basic Website Development",
  });

  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePhoneChange = async (val: string) => {
    setFormData((prev) => ({ ...prev, whatsappNumber: val }));
    const { formatted, isValid } = normalizeWhatsAppNumber(val);

    if (isValid) {
      const res = await checkDuplicateAction(formatted);
      if (res.isDuplicate && res.matchedProspect) {
        setDuplicateWarning(
          `Nomor WhatsApp ini sudah terdaftar atas nama prospek "${res.matchedProspect.companyName}" (Stage: ${res.matchedProspect.stage}). Sistem mendeteksi potensi duplikasi kontak.`
        );
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const res = await createProspectAction(formData);

    if (res.success) {
      setIsSubmitting(false);
      onSuccess();
      onClose();
    } else {
      setErrorMsg(res.error || "Gagal menyimpan data prospek.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Input Prospek Hasil Riset Baru
              </h2>
              <p className="text-xs text-slate-500">
                Setiap prospek wajib memiliki konteks riset bisnis dan identifikasi peluang.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          {duplicateWarning && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Peringatan Duplikasi:</span> {duplicateWarning}
              </div>
            </div>
          )}

          {/* Baris 1: Nama Bisnis & Nama Kontak */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Perusahaan / Bisnis <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT Padma Widya Setiajaya"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Kontak PIC
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Contoh: Ibu Rina Wulandari"
                  value={formData.contactName}
                  onChange={(e) =>
                    setFormData({ ...formData, contactName: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Baris 2: Nomor WhatsApp & Website */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor WhatsApp <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="08123456789 atau 628..."
                  value={formData.whatsappNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Otomatis dinormalisasi ke format internasional (628xxx).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Website / Domain (Jika ada)
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="padmawidyasetiajaya.com"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Baris 3: Industri & Layanan yang Berpotensi Ditawarkan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Industri / Niche Bisnis
              </label>
              <input
                type="text"
                placeholder="Konstruksi, Pendidikan, F&B, Klinik, dll."
                value={formData.industry}
                onChange={(e) =>
                  setFormData({ ...formData, industry: e.target.value })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Layanan Berpotensi Ditawarkan
              </label>
              <select
                value={formData.potentialServices}
                onChange={(e) =>
                  setFormData({ ...formData, potentialServices: e.target.value })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                <option value="Basic Website Development">Basic Website (Rp 1.500.000)</option>
                <option value="Business Website Development">Business Website (Rp 3.500.000+)</option>
                <option value="Enterprise Custom Web Application">Enterprise Custom Quote</option>
              </select>
            </div>
          </div>

          {/* Catatan Riset Bisnis (Wajib & Bebas) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Catatan Hasil Riset Bisnis <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400">Teks bebas analisis peluang</span>
            </div>
            <textarea
              required
              rows={4}
              placeholder="Jelaskan temuan riset: mengapa bisnis ini relevan, masalah apa yang ditemukan (contoh: belum punya website, presensi manual, dsb.), dan nilai tambah apa yang dapat Fynux tawarkan..."
              value={formData.researchNotes}
              onChange={(e) =>
                setFormData({ ...formData, researchNotes: e.target.value })
              }
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Pain Points */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Masalah / Peluang Spesifik (Pain Points)
            </label>
            <input
              type="text"
              placeholder="Contoh: Kredibilitas tender tender B2B terhambat karena tidak ada website resmi"
              value={formData.painPoints}
              onChange={(e) =>
                setFormData({ ...formData, painPoints: e.target.value })
              }
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan Prospek..." : "Simpan Prospek Riset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
