"use client";

import Image from "next/image";
import { X, Printer, Download, CheckCircle2, DollarSign } from "lucide-react";
import { Invoice } from "@/modules/finance/types";
import { formatIDR } from "@/lib/currency";
import { formatDateWIB } from "@/lib/date";
import { ModalPortal } from "@/components/common/ModalPortal";

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
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] modal-backdrop-clean flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-ios-fade print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden print:m-0 print:shadow-none print:border-none print:w-full print:max-h-none print:overflow-visible">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-white shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">
              Pratinjau Nota Resmi: {invoice.invoiceNumber}
            </span>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                isPaid
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 border border-slate-200"
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                <DollarSign className="w-3.5 h-3.5" />
                Catat Pembayaran
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak / Simpan PDF
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* INVOICE BODY: Mengacu langsung pada INVOICE-WEBDEV1.pdf */}
        <div className="p-8 sm:p-12 space-y-6 text-slate-800 font-sans flex-1 overflow-y-auto print:p-8 print:overflow-visible bg-white">
          {/* Header Section: Logo & Judul */}
          <div className="flex items-start justify-between pb-4">
            <div>
              <Image
                src="/logo-fynux.png"
                alt="FYNUX"
                width={371}
                height={101}
                priority
                className="h-10 w-auto object-contain"
              />
            </div>

            <div className="text-right">
              {isPaid ? (
                <div className="inline-block bg-[#10b981] text-white text-xs font-bold px-4 py-1 rounded shadow-xs tracking-wider uppercase mb-2">
                  LUNAS
                </div>
              ) : (
                <div className="inline-block bg-amber-500 text-white text-xs font-bold px-4 py-1 rounded shadow-xs tracking-wider uppercase mb-2">
                  BELUM LUNAS
                </div>
              )}
              <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-none">
                INVOICE
              </h1>
              <div className="text-xs font-bold text-slate-900 font-mono mt-1">
                {invoice.invoiceNumber}
              </div>
            </div>
          </div>

          {/* Metadata Tagihan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs pt-2">
            <div>
              <div className="text-xs font-bold text-slate-900">
                Tagihan Kepada
              </div>
              <div className="text-sm font-bold text-slate-900 mt-1 uppercase tracking-wide">
                {invoice.clientName}
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-900">
              <div className="flex">
                <span className="w-36 text-slate-800 font-medium">No. Invoice</span>
                <span className="w-4 text-slate-800 font-bold">:</span>
                <span className="font-mono font-semibold text-slate-900">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex">
                <span className="w-36 text-slate-800 font-medium">Metode Pembayaran</span>
                <span className="w-4 text-slate-800 font-bold">:</span>
                <span className="text-slate-900">
                  {invoice.paymentMethod === "MANUAL_TRANSFER_BCA"
                    ? "Transfer Bank BCA"
                    : invoice.paymentMethod || "Cash"}
                </span>
              </div>
              <div className="flex">
                <span className="w-36 text-slate-800 font-medium">Tanggal Terbit</span>
                <span className="w-4 text-slate-800 font-bold">:</span>
                <span className="text-slate-900">{formatDateWIB(invoice.issuedDate)}</span>
              </div>
              {invoice.paymentDate && (
                <div className="flex">
                  <span className="w-36 text-slate-800 font-medium">Tanggal Pembayaran</span>
                  <span className="w-4 text-slate-800 font-bold">:</span>
                  <span className="text-slate-900">{formatDateWIB(invoice.paymentDate)}</span>
                </div>
              )}
              <div className="flex">
                <span className="w-36 text-slate-800 font-medium">Keterangan</span>
                <span className="w-4 text-slate-800 font-bold">:</span>
                <span className="text-slate-900 flex-1 leading-snug">
                  {invoice.keterangan || "Rincian nota pembayaran proyek web app presensi"}
                </span>
              </div>
            </div>
          </div>

          {/* Table Items */}
          <div className="w-full overflow-x-auto border-t border-b border-slate-300">
            <table className="w-full text-left text-xs min-w-[640px]">
              <thead className="bg-[#0f172a] text-white font-bold text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Item / Deskripsi</th>
                  <th className="py-2.5 px-3 text-center w-14">Qty</th>
                  <th className="py-2.5 px-3 text-center w-24">Durasi</th>
                  <th className="py-2.5 px-3 text-right w-28">Harga</th>
                  <th className="py-2.5 px-3 text-right w-28 pr-4">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoice.items.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3 align-top">
                      <div className="whitespace-pre-line leading-relaxed text-xs">
                        {item.description.split("\n").map((line, lIdx) => {
                          const isGratis = line.includes("(GRATIS)");
                          const isNilaiNormal = line.includes("Nilai normal:");
                          const isSubBullet = line.startsWith("- ");
                          return (
                            <div
                              key={lIdx}
                              className={`${
                                lIdx === 0
                                  ? "font-bold text-slate-900"
                                  : isGratis
                                  ? "text-[#10b981] font-semibold"
                                  : isNilaiNormal
                                  ? "text-[11px] text-slate-500"
                                  : isSubBullet
                                  ? "text-[11px] text-slate-600 pl-1"
                                  : "text-[11px] text-slate-600"
                              }`}
                            >
                              {line}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center align-top font-medium text-slate-900">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-3 text-center align-top text-slate-800">
                      {item.durationInfo || "-"}
                    </td>
                    <td className="py-3 px-3 text-right align-top font-mono text-slate-900">
                      {formatIDR(item.unitPrice)}
                    </td>
                    <td className="py-3 px-3 text-right align-top font-mono font-bold text-slate-900 pr-4">
                      {formatIDR(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Subtotal & Ringkasan Tagihan */}
          <div className="flex flex-col sm:flex-row justify-end text-xs">
            <div className="w-full sm:w-60 space-y-1 text-slate-900 pt-1">
              <div className="flex justify-between font-bold text-xs py-0.5">
                <span>Total</span>
                <span className="font-mono">{formatIDR(invoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-xs py-0.5">
                <span className="font-medium">Dibayar</span>
                <span className="font-mono">{formatIDR(invoice.paidAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-xs py-0.5 border-t border-slate-200 pt-1">
                <span>Sisa Tagihan</span>
                <span className="font-mono">{formatIDR(invoice.outstandingBalance)}</span>
              </div>
            </div>
          </div>

          {/* Terbilang */}
          <div className="text-xs text-slate-800">
            <span className="font-normal text-slate-700">Terbilang: </span>
            <span className="italic font-medium">{invoice.terbilangPhrase}</span>
          </div>

          {/* Catatan Box */}
          {invoice.notes && (
            <div className="bg-[#f8fafc] p-4 rounded-lg border border-slate-200 text-xs text-slate-800 space-y-1.5">
              <div className="font-bold text-slate-900 text-xs">
                Catatan
              </div>
              <p className="whitespace-pre-line leading-relaxed text-[11px] text-slate-700">
                {invoice.notes}
              </p>
            </div>
          )}

          {/* Closing & Tanda Tangan */}
          <div className="pt-2 space-y-5 text-xs text-slate-800">
            <p className="text-xs">
              Demikian nota ini kami sampaikan. Terima kasih atas kepercayaan yang diberikan.
            </p>

            <div className="flex justify-between items-end">
              <div>
                <p className="font-normal text-xs">Hormat kami,</p>
                {/* Visual coretan tanda tangan signature */}
                <div className="my-1">
                  <svg
                    className="h-9 w-28 text-slate-900"
                    viewBox="0 0 120 40"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10 28 C20 8, 26 36, 36 14 C46 -6, 42 38, 56 24 C66 14, 76 30, 96 18 C106 12, 114 16, 118 20"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M24 30 L88 26"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="font-bold text-slate-900 text-xs">
                  {invoice.signerName || "Faiz Aditama"}
                </div>
                <div className="text-[11px] text-slate-600">
                  {invoice.signerRole || "Lead Developer FYNUX"}
                </div>
              </div>

              <div className="text-right text-[10px] text-slate-500">
                Halaman 1
              </div>
            </div>

            {/* Kontak Support Footer */}
            <div className="text-xs text-slate-800 pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900">Kontak Support: </span>
                <span>WhatsApp : +62 895 3240 69850</span>
                <span className="mx-2 text-slate-400">|</span>
                <span>Email : halo@fynux.co</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200/80 flex items-center justify-between shrink-0 bg-slate-50/90 rounded-b-2xl print:hidden">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Format cetak resmi standar invoice Fynux Digital Solutions
          </span>
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200/90 rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak / PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200/90 rounded-lg transition-colors"
            >
              Tutup
            </button>
            {!isPaid && canConfirmPayment && onRecordPayment && (
              <button
                type="button"
                onClick={() => onRecordPayment(invoice)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                <DollarSign className="w-3.5 h-3.5" />
                Catat Pembayaran
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  </ModalPortal>
);
}
