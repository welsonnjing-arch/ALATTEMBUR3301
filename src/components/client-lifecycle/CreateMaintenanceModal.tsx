"use client";

import React, { useState } from "react";
import { Wrench, X } from "lucide-react";
import {
  Client,
  CreateMaintenanceContractInput,
  MaintenanceContract,
} from "@/modules/client-lifecycle/types";
import { MaintenanceBillingType } from "@/types/enums";
import { createMaintenanceContractAction } from "@/modules/client-lifecycle/client-lifecycle.actions";
import { ModalPortal } from "@/components/common/ModalPortal";
import { useToast } from "@/components/common/Toast";

interface CreateMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newContract?: MaintenanceContract) => void;
  clients: Client[];
}

export function CreateMaintenanceModal({
  isOpen,
  onClose,
  onSuccess,
  clients,
}: CreateMaintenanceModalProps) {
  const { toast } = useToast();
  const [clientId, setClientId] = useState(clients[0]?.id || "");
  const [billingType, setBillingType] = useState<MaintenanceBillingType>("MONTHLY");
  const [price, setPrice] = useState(98000);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [durationMonths, setDurationMonths] = useState(6);
  const [terms, setTerms] = useState(
    "Paket maintenance berkala mencakup pencadangan mingguan, monitoring uptime server 24/7, dan perbaikan bug."
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleBillingTypeChange = (t: MaintenanceBillingType) => {
    setBillingType(t);
    if (t === "MONTHLY") {
      setPrice(98000);
      setDurationMonths(6);
    } else if (t === "ANNUAL") {
      setPrice(1100000);
      setDurationMonths(12);
    } else {
      setPrice(250000);
      setDurationMonths(1);
    }
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
      const input: CreateMaintenanceContractInput = {
        clientId,
        billingType,
        price,
        startDate,
        durationMonths,
        terms,
        scopeItems: [
          "Pencadangan database berkala",
          "Pembaruan patch keamanan script",
          "Monitoring uptime server & SSL",
          "Asistensi teknis via WhatsApp",
        ],
      };

      const res = await createMaintenanceContractAction(input);
      if (res.success) {
        const cNum = res.contract?.contractNumber || "";
        toast.success(
          cNum
            ? `Kontrak maintenance ${cNum} berhasil diterbitkan`
            : "Kontrak maintenance berhasil diterbitkan"
        );
        onSuccess(res.contract);
        onClose();
      } else {
        setErrorMessage(res.error || "Gagal membuat kontrak pemeliharaan.");
      }
    } catch {
      setErrorMessage("Terjadi kesalahan sistem saat memproses kontrak.");
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
              <Wrench className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Buat Kontrak Maintenance Baru
              </h3>
              <p className="text-xs text-slate-500">
                Kontrak pemeliharaan berkala pasca masa garansi atau add-on
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
                Pilih Klien <span className="text-rose-500">*</span>
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                  Tipe Tagihan (Billing)
                </label>
                <select
                  value={billingType}
                  onChange={(e) =>
                    handleBillingTypeChange(e.target.value as MaintenanceBillingType)
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="MONTHLY">Bulanan (Monthly)</option>
                  <option value="ANNUAL">Tahunan (Annual)</option>
                  <option value="ONE_OFF">Sekali Bayar (One-Off)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Biaya Kontrak (Rp)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step={1000}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Mulai Kontrak
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Durasi Kontrak (Bulan)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={36}
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ketentuan & Klausul Kontrak
              </label>
              <textarea
                rows={3}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
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
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-500/20 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Kontrak Maintenance"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
}
