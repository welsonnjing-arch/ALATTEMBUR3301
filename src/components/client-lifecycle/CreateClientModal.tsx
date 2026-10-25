"use client";

import React, { useState } from "react";
import { UserPlus, X } from "lucide-react";
import { CreateClientInput } from "@/modules/client-lifecycle/types";
import { createClientAction } from "@/modules/client-lifecycle/client-lifecycle.actions";

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateClientModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateClientModalProps) {
  const [formData, setFormData] = useState<CreateClientInput>({
    name: "",
    industry: "",
    website: "",
    address: "",
    picName: "",
    picPhone: "",
    email: "",
    position: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.picName.trim() || !formData.picPhone.trim()) {
      setErrorMessage("Nama Instansi/Perusahaan, Nama PIC, dan No. WhatsApp wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await createClientAction(formData);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMessage(res.error || "Gagal menyimpan data klien.");
      }
    } catch {
      setErrorMessage("Terjadi kesalahan saat memproses data klien.");
    } finally {
      setIsSubmitting(false);
    }
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
          <UserPlus className="w-5 h-5" />
          <h3 className="text-base font-bold text-slate-900">
            Registrasi Klien Baru
          </h3>
        </div>

        <p className="text-xs text-slate-500">
          Masukkan data profil entitas klien resmi untuk memulai pencatatan proyek, garansi, dan kontrak pemeliharaan.
        </p>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Instansi / Perusahaan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: PT Padma Widya Setiajaya atau SMAN 2 NGAGLIK"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sektor Industri
              </label>
              <input
                type="text"
                placeholder="Misal: Konstruksi, Pendidikan, Medis"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Website Resmi
              </label>
              <input
                type="text"
                placeholder="https://..."
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama PIC Klien <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Nama penanggung jawab"
                value={formData.picName}
                onChange={(e) => setFormData({ ...formData, picName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                No. WhatsApp PIC <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="08xxx atau 628xxx"
                value={formData.picPhone}
                onChange={(e) => setFormData({ ...formData, picPhone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jabatan PIC
              </label>
              <input
                type="text"
                placeholder="Misal: Direktur, Kepala Sekolah"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="klien@domain.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alamat Lengkap
            </label>
            <input
              type="text"
              placeholder="Kota / Alamat operasional klien"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Khusus Klien
            </label>
            <textarea
              rows={2}
              placeholder="Preferensi komunikasi, jam kerja, atau catatan penting..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Data Klien"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
