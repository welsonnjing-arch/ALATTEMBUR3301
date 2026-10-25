"use client";

import React, { useState } from "react";
import { Wrench, X } from "lucide-react";
import { Client, CreateMaintenanceContractInput } from "@/modules/client-lifecycle/types";
import { MaintenanceBillingType } from "@/types/enums";
import { createMaintenanceContractAction } from "@/modules/client-lifecycle/client-lifecycle.actions";

interface CreateMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clients: Client[];
}

export function CreateMaintenanceModal({
  isOpen,
  onClose,
  onSuccess,
  clients,
}: CreateMaintenanceModalProps) {
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
        onSuccess();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-indigo-700">
          <Wrench className="w-5 h-5" />
          <h3 className="text-base font-bold text-slate-900">
            Buat Kontrak Maintenance Baru
          </h3>
        </div>

        <p className="text-xs text-slate-500">
          Formulir perjanjian kontrak pemeliharaan berkala pasca masa garansi atau add-on tahunan.
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
                Tipe Tagihan (Billing)
              </label>
              <select
                value={billingType}
                onChange={(e) =>
                  handleBillingTypeChange(e.target.value as MaintenanceBillingType)
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
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
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
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
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
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
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
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
              {isSubmitting ? "Menyimpan..." : "Simpan Kontrak Maintenance"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
