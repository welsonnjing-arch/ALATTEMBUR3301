"use client";

import { useState, useEffect } from "react";
import {
  X,
  Shuffle,
  Users,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { ModalPortal } from "@/components/common/ModalPortal";
import { useToast } from "@/components/common/Toast";
import { SalesUserOption, Prospect } from "@/modules/crm/types";
import {
  bulkDistributeProspectsAction,
  fetchAvailableSalesAction,
} from "@/modules/crm/crm.actions";

interface BulkDistributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProspectIds: string[];
  onSuccess: (updatedProspects?: Prospect[]) => void;
}

export function BulkDistributeModal({
  isOpen,
  onClose,
  selectedProspectIds,
  onSuccess,
}: BulkDistributeModalProps) {
  const { toast } = useToast();
  const [salesUsers, setSalesUsers] = useState<SalesUserOption[]>([]);
  const [selectedSalesIds, setSelectedSalesIds] = useState<string[]>([]);
  const [isLoadingSales, setIsLoadingSales] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoadingSales(true);
      setErrorMsg(null);
      fetchAvailableSalesAction()
        .then((users) => {
          setSalesUsers(users);
          if (users.length > 0) {
            // Default: pilih seluruh tim sales aktif
            setSelectedSalesIds(users.map((u) => u.id));
          }
        })
        .catch((err) => {
          console.error("Gagal memuat tim sales:", err);
          setErrorMsg("Gagal memuat daftar tim sales internal.");
        })
        .finally(() => {
          setIsLoadingSales(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalSelected = selectedProspectIds.length;
  const targetCount = selectedSalesIds.length;
  const perSalesEstimate = targetCount > 0 ? Math.ceil(totalSelected / targetCount) : 0;

  const handleExecuteDistribute = async () => {
    if (targetCount === 0) {
      setErrorMsg("Pilih minimal 1 akun sales untuk menerima jatah prospek.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await bulkDistributeProspectsAction(selectedProspectIds, selectedSalesIds);
      if (res.success) {
        toast.success(
          `Berhasil membagikan ${res.updatedCount} prospek rata ke ${targetCount} akun sales.`
        );
        onSuccess(res.updatedProspects);
        onClose();
      } else {
        setErrorMsg(res.message || "Gagal membagikan prospek.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat membagikan data.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-700 flex items-center justify-center font-bold">
                <Shuffle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Bagi Rata Prospek ke Tim Sales
                </h3>
                <p className="text-[11px] text-slate-500">
                  Distribusi proporsional (Round-Robin) untuk {totalSelected} prospek terpilih
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Info Kotak Prospek Terpilih */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 font-medium">Jumlah Prospek Terpilih:</span>
                <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                  {totalSelected} <span className="text-xs font-normal text-slate-600">Kontak</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 font-medium">Target Penerima:</span>
                <div className="text-base font-bold text-blue-600 font-mono mt-0.5">
                  {targetCount} <span className="text-xs font-normal text-slate-600">Sales</span>
                </div>
              </div>
            </div>

            {/* Checklist Sales */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  Pilih Akun Sales yang Menerima Jatah:
                </span>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setSelectedSalesIds(salesUsers.map((u) => u.id))}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Pilih Semua
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedSalesIds([])}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    Batal Semua
                  </button>
                </div>
              </div>

              {isLoadingSales ? (
                <div className="p-4 text-center text-slate-400">Memuat data tim sales...</div>
              ) : salesUsers.length === 0 ? (
                <div className="p-3 text-center text-slate-500 bg-slate-50 rounded-lg">
                  Tidak ada akun sales aktif ditemukan di sistem.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {salesUsers.map((sales, idx) => {
                    const isChecked = selectedSalesIds.includes(sales.id);
                    // Hitung porsi eksak jika dipilih
                    let share = 0;
                    if (isChecked && targetCount > 0) {
                      const base = Math.floor(totalSelected / targetCount);
                      const remainder = totalSelected % targetCount;
                      const selectedIndex = selectedSalesIds.indexOf(sales.id);
                      share = base + (selectedIndex < remainder ? 1 : 0);
                    }

                    return (
                      <label
                        key={sales.id}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? "bg-blue-50/40 border-blue-200 text-slate-900 font-medium"
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSalesIds([...selectedSalesIds, sales.id]);
                              } else {
                                setSelectedSalesIds(
                                  selectedSalesIds.filter((id) => id !== sales.id)
                                );
                              }
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500/20"
                          />
                          <div className="truncate">
                            <div className="font-semibold text-slate-900">{sales.fullName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{sales.email}</div>
                          </div>
                        </div>

                        {isChecked && (
                          <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded text-blue-700 border border-blue-200 shrink-0">
                            +{share} Prospek
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Estimasi Ringkasan */}
            {targetCount > 0 && totalSelected > 0 && (
              <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-lg text-emerald-800 text-[11px] flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Masing-masing sales akan menerima rata:
                </span>
                <span className="font-mono font-bold bg-white px-2.5 py-0.5 rounded text-emerald-700 border border-emerald-200 shadow-2xs">
                  ~{perSalesEstimate} prospek
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3.5 border-t border-slate-200 flex items-center justify-between bg-slate-50/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleExecuteDistribute}
              disabled={isSubmitting || targetCount === 0 || totalSelected === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Mendistribusikan...</span>
                </>
              ) : (
                <>
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Terapkan Pembagian Rata</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
