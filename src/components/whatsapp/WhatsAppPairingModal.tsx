"use client";

import { useState, useEffect } from "react";
import {
  X,
  QrCode,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { WhatsAppSessionInfo } from "@/modules/whatsapp/types";
import {
  getWhatsAppSessionAction,
  startWhatsAppPairingAction,
  confirmWhatsAppPairingAction,
  disconnectWhatsAppAction,
} from "@/modules/whatsapp/whatsapp.actions";

interface WhatsAppPairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: WhatsAppSessionInfo;
  onSessionUpdated: (session: WhatsAppSessionInfo) => void;
}

export function WhatsAppPairingModal({
  isOpen,
  onClose,
  session,
  onSessionUpdated,
}: WhatsAppPairingModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [customPhone, setCustomPhone] = useState("62895324069850");

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/whatsapp/session", { cache: "no-store" });
      if (res.ok) {
        const data: WhatsAppSessionInfo = await res.json();
        onSessionUpdated(data);
      }
    } catch (err) {
      console.error("Gagal memuat status WhatsApp Web:", err);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    // Panggil langsung saat modal dibuka
    fetchSession();

    // Polling setiap 2 detik untuk menangkap emisi QR Code atau perubahan status koneksi
    const interval = setInterval(() => {
      fetchSession();
    }, 2000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerateQR = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/whatsapp/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refresh" }),
      });
      if (res.ok) {
        const data = await res.json();
        onSessionUpdated(data);
      }
    } catch (err) {
      console.error("Gagal memperbarui QR code:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPairing = async (phoneToUse?: string) => {
    setIsLoading(true);
    try {
      const targetPhone = phoneToUse || customPhone;
      const res = await fetch("/api/whatsapp/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", phoneNumber: targetPhone }),
      });
      if (res.ok) {
        const data = await res.json();
        onSessionUpdated(data);
      }
    } catch (err) {
      console.error("Gagal menyambungkan:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Yakin ingin memutuskan koneksi WhatsApp Web dari Fynux?")) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/whatsapp/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });
      if (res.ok) {
        const data = await res.json();
        onSessionUpdated(data);
      }
    } catch (err) {
      console.error("Gagal memutuskan koneksi:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="bg-[#00a884] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide">
                Tautkan WhatsApp Web ke Fynux OS
              </h2>
              <p className="text-[11px] text-emerald-100">
                Native Multi-Device Engine terhubung langsung ke database CRM
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {session.status === "CONNECTED" ? (
            /* TAMPILAN JIKA SUDAH TERHUBUNG */
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  WhatsApp Web Terhubung Aktif
                </span>
                <h3 className="text-lg font-bold text-slate-800 mt-2">
                  +{session.phoneNumber}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {session.pushName || "Akun Bisnis Fynux"} · {session.platform}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-md mx-auto text-left space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Terhubung Sejak:</span>
                  <span className="font-semibold text-slate-800">
                    {session.connectedAt
                      ? new Date(session.connectedAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        }) + " WIB"
                      : "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Sinkronisasi CRM:</span>
                  <span className="font-semibold text-emerald-600">
                    Otomatis Aktif (Event-Driven)
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Tutup & Mulai Chatting
                </button>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg border border-rose-200 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Putuskan Sambungan
                </button>
              </div>
            </div>
          ) : (
            /* TAMPILAN PAIRING QR CODE (1:1 WHATSAPP WEB STYLE) */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Kolom Kiri: Panduan Langkah */}
              <div className="md:col-span-7 space-y-4">
                <h3 className="text-sm font-bold text-slate-800">
                  Untuk menggunakan WhatsApp di Fynux:
                </h3>

                <ol className="space-y-3 text-xs text-slate-600">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center flex-shrink-0 text-[11px] border border-slate-300">
                      1
                    </span>
                    <span>Buka WhatsApp di ponsel Anda</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center flex-shrink-0 text-[11px] border border-slate-300">
                      2
                    </span>
                    <span>
                      Ketuk <strong>Menu (⋮)</strong> di Android atau <strong>Pengaturan (⚙️)</strong> di iPhone dan pilih <strong>Perangkat Tertaut</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center flex-shrink-0 text-[11px] border border-slate-300">
                      3
                    </span>
                    <span>
                      Ketuk <strong>Tautkan Perangkat</strong> dan arahkan kamera ponsel Anda ke kode QR di samping
                    </span>
                  </li>
                </ol>

                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Enkripsi ujung-ke-ujung (End-to-End Encrypted)</span>
                  </div>
                </div>

                {/* Simulasi Quick-Pairing untuk kemudahan pengujian developer */}
                <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 space-y-2">
                  <div className="flex items-center justify-between text-indigo-900 text-xs font-semibold">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-indigo-600" />
                      Uji Sambungkan Cepat:
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value)}
                      placeholder="Nomor WA (misal: 62895324069850)"
                      className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-indigo-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleConfirmPairing()}
                      disabled={isLoading}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shadow-sm disabled:opacity-50"
                    >
                      {isLoading ? "Menghubungkan..." : "Hubungkan Instan"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Kolom Kanan: Tampilan QR Code */}
              <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="relative p-2 bg-white rounded-xl shadow-md border border-slate-200">
                  {session.qrCodeDataUrl ? (
                    <img
                      src={session.qrCodeDataUrl}
                      alt="WhatsApp Web QR Code"
                      className="w-48 h-48 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-48 h-48 flex flex-col items-center justify-center text-slate-400 gap-2">
                      <QrCode className="w-12 h-12 stroke-[1.5]" />
                      <span className="text-xs">Membuat QR Code...</span>
                    </div>
                  )}

                  {isLoading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] rounded-xl flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleGenerateQR}
                  disabled={isLoading}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-emerald-700 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Perbarui Kode QR
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
