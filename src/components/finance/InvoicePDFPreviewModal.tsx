"use client";

import { X, Printer, Download, CheckCircle2, DollarSign } from "lucide-react";
import { Invoice } from "@/modules/finance/types";
import { formatIDR } from "@/lib/currency";
import { formatDateWIB } from "@/lib/date";

interface InvoicePDFPreviewModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onRecordPayment?: (invoice: Invoice) => void;
  canConfirmPayment?: boolean;
}

export function InvoicePDFPreviewModal({
  invoice,
  isOpen,
  onClose,
  onRecordPayment,
  canConfirmPayment = true,
}: InvoicePDFPreviewModalProps) {
  if (!isOpen || !invoice) return null;

  const isPaid = invoice.status === "PAID";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6 print:m-0 print:shadow-none print:border-none print:w-full">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">
              Pratinjau Nota Resmi: {invoice.invoiceNumber}
            </span>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                isPaid
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {isPaid ? "LUNAS" : "BELUM LUNAS"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isPaid && canConfirmPayment && onRecordPayment && (
              <button
                type="button"
                onClick={() => onRecordPayment(invoice)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                <DollarSign className="w-3.5 h-3.5" />
                Catat Pembayaran
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak / Simpan PDF
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* INVOICE BODY: Mengacu langsung pada INVOICE-WEBDEV1.pdf */}
        <div className="p-8 sm:p-12 space-y-6 text-slate-800 font-sans print:p-8">
          {/* Header Section: Logo & Judul */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
                  F
                </div>
                <div className="text-2xl font-black tracking-tight text-slate-900">
                  FYNUX
                </div>
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-1">
                Website Development & Digital Solutions
              </div>
            </div>

            <div className="text-right">
              {isPaid ? (
                <div className="inline-block bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded shadow-sm tracking-wider uppercase mb-2">
                  LUNAS
                </div>
              ) : (
                <div className="inline-block bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded shadow-sm tracking-wider uppercase mb-2">
                  BELUM LUNAS
                </div>
              )}
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                INVOICE
              </h1>
              <div className="text-xs font-semibold text-slate-500 font-mono mt-0.5">
                {invoice.invoiceNumber}
              </div>
            </div>
          </div>

          {/* Metadata Tagihan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Tagihan Kepada
              </div>
              <div className="text-sm font-extrabold text-slate-900 mt-1 uppercase">
                {invoice.clientName}
              </div>
            </div>

            <div className="space-y-1 sm:text-right">
              <div className="flex justify-between sm:justify-end gap-3">
                <span className="text-slate-400">No. Invoice:</span>
                <span className="font-bold text-slate-800 font-mono">
                  {invoice.invoiceNumber}
                </span>
              </div>
              <div className="flex justify-between sm:justify-end gap-3">
                <span className="text-slate-400">Metode Pembayaran:</span>
                <span className="font-semibold text-slate-800">
                  {invoice.paymentMethod || "Transfer Bank BCA"}
                </span>
              </div>
              <div className="flex justify-between sm:justify-end gap-3">
                <span className="text-slate-400">Tanggal Terbit:</span>
                <span className="text-slate-800">
                  {formatDateWIB(invoice.issuedDate)}
                </span>
              </div>
              {invoice.paymentDate && (
                <div className="flex justify-between sm:justify-end gap-3">
                  <span className="text-slate-400">Tanggal Pembayaran:</span>
                  <span className="font-medium text-emerald-700">
                    {formatDateWIB(invoice.paymentDate)}
                  </span>
                </div>
              )}
              <div className="flex justify-between sm:justify-end gap-3">
                <span className="text-slate-400">Jatuh Tempo:</span>
                <span className="font-semibold text-slate-800">
                  {formatDateWIB(invoice.dueDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Table Items */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-bold text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Item / Deskripsi</th>
                  <th className="py-2.5 px-3 text-center w-12">Qty</th>
                  <th className="py-2.5 px-3 text-center w-20">Durasi</th>
                  <th className="py-2.5 px-3 text-right w-28">Harga</th>
                  <th className="py-2.5 px-3 text-right w-28">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoice.items.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 whitespace-pre-line leading-relaxed">
                        {item.description}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-medium">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600">
                      {item.durationInfo || "-"}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      {formatIDR(item.unitPrice)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatIDR(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Subtotal & Ringkasan Tagihan */}
          <div className="flex flex-col sm:flex-row justify-end text-xs">
            <div className="w-full sm:w-64 space-y-1.5 border-t border-slate-200 pt-3">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Subtotal</span>
                <span className="font-mono text-slate-800">
                  {formatIDR(invoice.subtotal)}
                </span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span className="font-semibold">Diskon Khusus</span>
                  <span className="font-mono">-{formatIDR(invoice.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold border-t border-slate-300 pt-1.5 text-slate-900">
                <span>Total</span>
                <span className="font-mono">{formatIDR(invoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-700 font-semibold">
                <span>Dibayar</span>
                <span className="font-mono text-emerald-700">
                  {formatIDR(invoice.paidAmount)}
                </span>
              </div>
              <div className="flex justify-between text-xs font-bold border-t border-slate-200 pt-1.5">
                <span className={invoice.outstandingBalance > 0 ? "text-rose-600" : "text-slate-800"}>
                  Sisa Tagihan
                </span>
                <span
                  className={`font-mono ${
                    invoice.outstandingBalance > 0
                      ? "text-rose-600 font-extrabold"
                      : "text-slate-800"
                  }`}
                >
                  {formatIDR(invoice.outstandingBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* Terbilang */}
          <div className="text-xs italic text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
            <span className="font-bold text-slate-700 not-italic">Terbilang:</span>{" "}
            {invoice.terbilangPhrase}
          </div>

          {/* Catatan Box */}
          {invoice.notes && (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1">
              <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                Catatan
              </div>
              <p className="whitespace-pre-line leading-relaxed text-[11px]">
                {invoice.notes}
              </p>
            </div>
          )}

          {/* Closing & Tanda Tangan */}
          <div className="pt-4 space-y-6 text-xs text-slate-700">
            <p>Demikian nota ini kami sampaikan. Terima kasih atas kepercayaan yang diberikan.</p>

            <div className="flex justify-between items-end">
              <div>
                <p className="font-semibold">Hormat kami,</p>
                <div className="h-14 flex items-center font-serif text-xl italic text-slate-800 tracking-wider">
                  Faiz Aditama
                </div>
                <div className="font-bold text-slate-900">
                  {invoice.signerName || "Faiz Aditama"}
                </div>
                <div className="text-[11px] text-slate-500">
                  {invoice.signerRole || "Lead Developer FYNUX"}
                </div>
              </div>

              <div className="text-right text-[10px] text-slate-500 space-y-0.5">
                <div className="font-bold text-slate-700">Kontak Support:</div>
                <div>WhatsApp: +62 895 3240 69850</div>
                <div>Email: halo@fynux.co / contact@fynux.co</div>
                <div>Website: fynux.co</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
