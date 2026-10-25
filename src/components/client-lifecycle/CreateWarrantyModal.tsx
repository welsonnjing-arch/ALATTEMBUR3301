"use client";

import React, { useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import { Client, CreateWarrantyInput } from "@/modules/client-lifecycle/types";
import { ServiceTier } from "@/types/enums";
import { createWarrantyAction } from "@/modules/client-lifecycle/client-lifecycle.actions";

interface CreateWarrantyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clients: Client[];
}

export function CreateWarrantyModal({
  isOpen,
  onClose,
  onSuccess,
  clients,
}: CreateWarrantyModalProps) {
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
        onSuccess();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-indigo-700">
          <ShieldCheck className="w-5 h-5" />
          <h3 className="text-base font-bold text-slate-900">
            Terbitkan Garansi Teknis Baru
          </h3>
        </div>

        <p className="text-xs text-slate-500">
          Aktivasi masa garansi resmi pasca serah terima deliverables website / sistem kepada klien.
        </p>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pilih Klien <span className="text-rose-500">*</span>
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
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
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
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
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-900">
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
              {isSubmitting ? "Menerbitkan..." : "Terbitkan Garansi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
