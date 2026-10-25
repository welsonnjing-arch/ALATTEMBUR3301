"use client";

import { useState } from "react";
import { X, DollarSign, CreditCard, Building, AlertCircle } from "lucide-react";
import { Invoice } from "@/modules/finance/types";
import { PaymentMethod } from "@/types/enums";
import { recordPaymentAction } from "@/modules/finance/finance.actions";
import { formatIDR } from "@/lib/currency";

interface RecordPaymentModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RecordPaymentModal({
  invoice,
  isOpen,
  onClose,
  onSuccess,
}: RecordPaymentModalProps) {
  if (!isOpen || !invoice) return null;

  const [amount, setAmount] = useState<number>(invoice.outstandingBalance);
  const [method, setMethod] = useState<PaymentMethod | "Cash">("MANUAL_TRANSFER_BCA");
  const [refNumber, setRefNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setErrorMsg("Nominal pembayaran harus lebih besar dari 0.");
      return;
    }
    if (amount > invoice.outstandingBalance) {
      setErrorMsg("Nominal pembayaran melebihi sisa tagihan.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await recordPaymentAction(
      invoice.id,
      amount,
      method,
      refNumber || undefined
    );

    if (res.success) {
      setIsSubmitting(false);
      onSuccess();
      onClose();
    } else {
      setErrorMsg(res.error || "Gagal mencatat pembayaran.");
      setIsSubmitting(false);
    }
  };

  const handleSetQuickAmount = (val: number) => {
    setAmount(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Konfirmasi Penerimaan Pembayaran
            </h3>
            <p className="text-xs text-slate-500">
              Invoice: {invoice.invoiceNumber} — {invoice.clientName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Sisa Piutang Info */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Sisa Piutang Saat Ini:</span>
            <span className="font-extrabold font-mono text-slate-900">
              {formatIDR(invoice.outstandingBalance)}
            </span>
          </div>

          {/* Nominal Pembayaran */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nominal Pembayaran Diterima (Rp)
            </label>
            <input
              type="number"
              required
              min={1}
              max={invoice.outstandingBalance}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <div className="flex gap-2 mt-1.5 text-[10px]">
              <button
                type="button"
                onClick={() => handleSetQuickAmount(invoice.outstandingBalance)}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold"
              >
                Pelunasan Penuh ({formatIDR(invoice.outstandingBalance)})
              </button>
              {invoice.outstandingBalance > 1000000 && (
                <button
                  type="button"
                  onClick={() => handleSetQuickAmount(Math.round(invoice.outstandingBalance / 2))}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold"
                >
                  DP 50% ({formatIDR(Math.round(invoice.outstandingBalance / 2))})
                </button>
              )}
            </div>
          </div>

          {/* Metode Pembayaran */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Metode Pembayaran
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod | "Cash")}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="MANUAL_TRANSFER_BCA">Transfer Bank BCA (Manual)</option>
              <option value="DUITKU_QRIS">Duitku Payment Gateway — QRIS</option>
              <option value="DUITKU_VA">Duitku Payment Gateway — Virtual Account</option>
              <option value="Cash">Tunai / Cash</option>
            </select>
          </div>

          {/* Info Rekening BCA jika Transfer */}
          {method === "MANUAL_TRANSFER_BCA" && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-900 space-y-0.5">
              <div className="font-bold flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" /> Rekening Resmi Fynux:
              </div>
              <div>BCA: 1234567890 a/n Fynux Digital Solutions</div>
            </div>
          )}

          {/* Nomor Referensi Bank */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nomor Referensi Bank / Catatan Transaksi
            </label>
            <input
              type="text"
              placeholder="Contoh: BCA-TRX-9821812 atau Tunai Lunas"
              value={refNumber}
              onChange={(e) => setRefNumber(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <DollarSign className="w-4 h-4" />
              {isSubmitting ? "Mencatat..." : "Konfirmasi Pembayaran"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
