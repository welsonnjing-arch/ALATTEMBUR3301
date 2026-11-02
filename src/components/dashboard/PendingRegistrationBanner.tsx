"use client";

import React, { useEffect, useState } from "react";
import {
  KeyRound,
  ShieldCheck,
  Copy,
  Check,
  XCircle,
  Loader2,
  Clock,
  RefreshCw,
} from "lucide-react";
import {
  fetchPendingRegistrationsForOwnerAction,
  OwnerPendingRegistrationView,
  rejectPendingRegistrationAction,
} from "@/modules/auth/registration.actions";
import { useToast } from "@/components/common/Toast";

export function PendingRegistrationBanner() {
  const { toast } = useToast();
  const [pendingList, setPendingList] = useState<OwnerPendingRegistrationView[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRejecting, setIsRejecting] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const data = await fetchPendingRegistrationsForOwnerAction();
      setPendingList(data);
    } catch {} finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Poll per 4 detik untuk mendeteksi calon pendaftar baru secara real-time
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyNumber = (reg: OwnerPendingRegistrationView) => {
    navigator.clipboard.writeText(reg.correctNumber.toString());
    setCopiedId(reg.id);
    toast.success(`Nomor otorisasi ${reg.correctNumber} telah disalin!`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleReject = async (registrationId: string) => {
    setIsRejecting(registrationId);
    try {
      const res = await rejectPendingRegistrationAction(registrationId);
      if (res.success) {
        toast.info("Permintaan pendaftaran berhasil ditolak.");
        await loadData();
      } else {
        toast.error(res.error || "Gagal menolak pendaftaran.");
      }
    } catch {
      toast.error("Terjadi kendala sistem.");
    } finally {
      setIsRejecting(null);
    }
  };

  // KONDISI 1: ADA PERMINTAAN PENDAFTARAN AKTIF (MODE ALERT OTORISASI)
  if (pendingList.length > 0) {
    return (
      <div className="space-y-3 animate-ios-fade">
        {pendingList.map((reg) => (
          <div
            key={reg.id}
            className="p-5 rounded-xl bg-slate-900 text-white border border-blue-500/60 shadow-md relative overflow-hidden"
          >
            {/* Subtle Accent Glow */}
            <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-blue-600/15 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
              {/* Info Pendaftar */}
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-300 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5 animate-pulse text-blue-400" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[10px] font-semibold border border-rose-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                      MEMERLUKAN OTORISASI OWNER
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      Google Prompt Challenge
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <span>{reg.fullName}</span>
                    <span className="text-xs font-mono font-normal text-slate-300">
                      ({reg.email})
                    </span>
                  </h3>
                  <p className="text-xs text-blue-100/90 leading-relaxed max-w-xl">
                    Calon anggota mendaftar sebagai{" "}
                    <strong className="text-white font-semibold">
                      {reg.role === "DEVELOPER" ? "Developer" : "Sales"}
                    </strong>
                    . Berikan nomor otorisasi rahasia di bawah ini agar calon anggota dapat memilihnya di layarnya:
                  </p>
                </div>
              </div>

              {/* Kotak Nomor Rahasia & Tombol Tindakan */}
              <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
                {/* Secret Auth Number Badge */}
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-800/90 border border-amber-400/40 shadow-xs">
                  <div className="text-right">
                    <div className="text-[9px] font-medium text-amber-200 uppercase tracking-wider font-mono">
                      KODE RAHASIA
                    </div>
                    <div className="text-[10px] text-slate-400">Hanya di akun Owner</div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-mono font-black text-amber-300 tracking-wider px-2">
                    {reg.correctNumber}
                  </div>
                </div>

                {/* Tombol Salin */}
                <button
                  type="button"
                  onClick={() => handleCopyNumber(reg)}
                  className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs active-press cursor-pointer"
                  title="Salin nomor otorisasi"
                >
                  {copiedId === reg.id ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span className="text-emerald-300">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Salin</span>
                    </>
                  )}
                </button>

                {/* Tombol Tolak */}
                <button
                  type="button"
                  disabled={isRejecting === reg.id}
                  onClick={() => handleReject(reg.id)}
                  className="p-2.5 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-400/40 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  title="Tolak pendaftaran"
                >
                  {isRejecting === reg.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // KONDISI 2: TIDAK ADA PERMINTAAN AKTIF (MODE STANDBY PERSISTENT)
  return (
    <div className="p-4 sm:p-5 rounded-xl bg-slate-900 border border-slate-800 text-white shadow-xs relative overflow-hidden transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700/80 text-blue-400 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5 text-blue-400" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SISTEM SIAGA • AKTIF
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Google Prompt Otorisasi
              </span>
            </div>
            <h2 className="text-sm font-bold text-slate-100 tracking-tight">
              Pusat Otorisasi Pendaftaran Akun Tim (3-Nomor Google Auth)
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
              Sistem pendaftaran mandiri aktif. Saat calon anggota tim mendaftar di halaman <code className="text-blue-300 font-mono">/login</code>, nomor otorisasi rahasia akan langsung muncul di panel ini secara real-time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-medium">0 Permintaan Menunggu</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors cursor-pointer"
            title="Perbarui status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-blue-400" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
