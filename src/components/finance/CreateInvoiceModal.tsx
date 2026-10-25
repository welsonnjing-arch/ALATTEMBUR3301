"use client";

import { useState } from "react";
import { X, Plus, Trash2, FileText, DollarSign, Calendar } from "lucide-react";
import { CreateInvoiceInput } from "@/modules/finance/types";
import { createInvoiceAction } from "@/modules/finance/finance.actions";
import { formatIDR } from "@/lib/currency";
import { terbilang } from "@/lib/terbilang";

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateInvoiceModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateInvoiceModalProps) {
  const [clientName, setClientName] = useState("");
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 86400000 * 14).toISOString().split("T")[0]
  );
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState(
    "Pembayaran dapat ditransfer ke Rekening BCA: 1234567890 a/n Fynux Digital Solutions."
  );
  const [items, setItems] = useState<
    Array<{ description: string; durationInfo: string; quantity: number; unitPrice: number }>
  >([
    {
      description: "Basic Website Development — Profil Bisnis Elegan",
      durationInfo: "7 hari kerja",
      quantity: 1,
      unitPrice: 1500000,
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { description: "", durationInfo: "-", quantity: 1, unitPrice: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (
    index: number,
    field: "description" | "durationInfo" | "quantity" | "unitPrice",
    val: string | number
  ) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const subtotal = items.reduce((acc, curr) => acc + curr.quantity * curr.unitPrice, 0);
  const totalAmount = Math.max(0, subtotal - discount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const input: CreateInvoiceInput = {
      clientName,
      dueDate,
      items,
      discount,
      notes,
    };

    const res = await createInvoiceAction(input);

    if (res.success) {
      setIsSubmitting(false);
      onSuccess();
      onClose();
    } else {
      setErrorMsg(res.error || "Gagal menerbitkan invoice.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Penerbitan Invoice Tagihan Resmi
            </h3>
            <p className="text-xs text-slate-500">
              Nomor invoice akan digenerate otomatis dengan format FYN-(NUMBER)-(DATE).
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tagihan Kepada (Nama Klien / Perusahaan) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: PT Padma Widya Setiajaya"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Jatuh Tempo <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Rincian Item Tagihan */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900">
                Rincian Item Tagihan
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Baris Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Nama / Deskripsi Layanan (misal: Basic Website Development)"
                      value={item.description}
                      onChange={(e) =>
                        handleItemChange(idx, "description", e.target.value)
                      }
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 font-medium">Durasi:</span>
                      <input
                        type="text"
                        placeholder="12 bulan / 7 hari"
                        value={item.durationInfo}
                        onChange={(e) =>
                          handleItemChange(idx, "durationInfo", e.target.value)
                        }
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-medium">Qty:</span>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(idx, "quantity", Number(e.target.value))
                        }
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white font-mono text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-medium">Harga Satuan (Rp):</span>
                      <input
                        type="number"
                        min={0}
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleItemChange(idx, "unitPrice", Number(e.target.value))
                        }
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white font-mono text-right"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subtotal, Diskon & Total */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-semibold">Subtotal:</span>
              <span className="font-mono font-bold text-slate-800">
                {formatIDR(subtotal)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-semibold">Potongan Diskon (Rp):</span>
              <input
                type="number"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-36 px-2 py-1 text-xs border border-slate-300 rounded font-mono text-right bg-white"
              />
            </div>

            <div className="flex justify-between items-center text-sm font-extrabold pt-2 border-t border-slate-200 text-slate-900">
              <span>Total Tagihan:</span>
              <span className="font-mono text-indigo-700">
                {formatIDR(totalAmount)}
              </span>
            </div>

            <div className="text-[11px] italic text-slate-500 pt-1">
              Terbilang: {terbilang(totalAmount)}
            </div>
          </div>

          {/* Catatan Tambahan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Pembayaran & Rekening
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
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
              <FileText className="w-4 h-4" />
              {isSubmitting ? "Menerbitkan..." : "Terbitkan Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
