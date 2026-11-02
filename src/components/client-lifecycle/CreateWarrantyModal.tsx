"use client";

import React, { useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import { Client, CreateWarrantyInput, Warranty } from "@/modules/client-lifecycle/types";
import { ServiceTier } from "@/types/enums";
import { createWarrantyAction } from "@/modules/client-lifecycle/client-lifecycle.actions";
import { ModalPortal } from "@/components/common/ModalPortal";
import { useToast } from "@/components/common/Toast";

interface CreateWarrantyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newWarranty?: Warranty) => void;
  clients: Client[];
}

export function CreateWarrantyModal({
  isOpen,
  onClose,
  onSuccess,
  clients,
}: CreateWarrantyModalProps) {
  const { toast } = useToast();
  const [clientId, setClientId] = useState(clients[0]?.id || "");
  const [projectId, setProjectId] = useState("proj-custom");
  const [tier, setTier] = useState<ServiceTier>("BASIC");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [scopeOfSupport, setScopeOfSupport] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const getDurationMonths = (t: ServiceTier) => {
    if (t === "BASIC") return 3;
    if (t === "BUSINESS") return 6;
    if (t === "ENTERPRISE") return 12;
    return 3;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      setErrorMessage("Silakan pilih klien terkait.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const input: CreateWarrantyInput = {
        clientId,
        projectId,
        tier,
        startDate,
        durationMonths: getDurationMonths(tier),
        scopeOfSupport:
          scopeOfSupport.trim() ||
          `Garansi teknis perbaikan bug kode, stabilitas server, dan keamanan sistem selama ${getDurationMonths(
            tier
          )} bulan.`,
      };

      const res = await createWarrantyAction(input);
      if (res.success) {
        toast.success(`Garansi resmi (${tier}) berhasil diterbitkan`);
        onSuccess(res.warranty);
        onClose();
      } else {
        setErrorMessage(res.error || "Gagal menerbitkan garansi.");
      }
    } catch {
      setErrorMessage("Terjadi kesalahan saat memproses data garansi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] modal-backdrop-clean flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-ios-fade">
        <div className="w-full max-w-lg max-h-[88vh] flex flex-col bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden animate-ios-scale relative">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Terbitkan Garansi Teknis Baru
              </h3>
              <p className="text-xs text-slate-500">
                Aktivasi masa garansi resmi pasca serah terima deliverables website.
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

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          {/* Scrollable Form Body */}
          <div className="px-6 py-5 overflow-y-auto flex-1 space-y-4">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pilih Klien <span className="text-rose-500">*</span>
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.picName})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tier Paket Garansi
                </label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value as ServiceTier)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="BASIC">Basic Website (3 Bulan)</option>
                  <option value="BUSINESS">Business Website (6 Bulan)</option>
                  <option value="ENTERPRISE">Enterprise System (12 Bulan)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Mulai (Handover)
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
              Durasi Garansi: <strong>{getDurationMonths(tier)} Bulan</strong>.
              Masa garansi berakhir otomatis dan memunculkan pengingat renewal 30 hari sebelum masa habis.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cakupan Dukungan & Ketentuan Garansi
              </label>
              <textarea
                rows={3}
                placeholder="Rincian garansi bug teknis berat, monitoring stabilitas server..."
                value={scopeOfSupport}
                onChange={(e) => setScopeOfSupport(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Sticky Modal Footer */}
          <div className="px-6 py-4 border-t border-slate-200/80 flex items-center justify-end gap-3 shrink-0 bg-slate-50/90 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200/90 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-500/20 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Menerbitkan..." : "Terbitkan Garansi"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
}
