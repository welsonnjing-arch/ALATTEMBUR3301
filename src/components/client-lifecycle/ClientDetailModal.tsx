"use client";

import React, { useState } from "react";
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Globe,
  ShieldCheck,
  Wrench,
  Calendar,
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { Client, MaintenanceContract, Warranty } from "@/modules/client-lifecycle/types";
import { formatRupiah } from "@/lib/currency";
import { formatDateWIB } from "@/lib/date";

interface ClientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  warranties: Warranty[];
  maintenanceContracts: MaintenanceContract[];
  onOpenRenewal: (type: "WARRANTY" | "MAINTENANCE", targetId: string) => void;
}

export function ClientDetailModal({
  isOpen,
  onClose,
  client,
  warranties,
  maintenanceContracts,
  onOpenRenewal,
}: ClientDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "WARRANTIES" | "MAINTENANCE">("OVERVIEW");

  if (!isOpen || !client) return null;

  const clientWarranties = warranties.filter((w) => w.clientId === client.id);
  const clientContracts = maintenanceContracts.filter((m) => m.clientId === client.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                <Building2 className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">{client.name}</h3>
                <p className="text-xs text-slate-500">
                  {client.industry || "Sektor Umum"} • Bergabung sejak {formatDateWIB(client.onboardingDate)}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Header */}
        <div className="flex border-b border-slate-200 px-6 text-xs font-semibold bg-white">
          <button
            onClick={() => setActiveTab("OVERVIEW")}
            className={`py-3 border-b-2 mr-6 transition-colors ${
              activeTab === "OVERVIEW"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Profil & LTV
          </button>
          <button
            onClick={() => setActiveTab("WARRANTIES")}
            className={`py-3 border-b-2 mr-6 transition-colors flex items-center gap-1.5 ${
              activeTab === "WARRANTIES"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>Garansi Teknis</span>
            <span className="px-1.5 py-0.2 bg-slate-100 rounded-full text-[10px]">
              {clientWarranties.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("MAINTENANCE")}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "MAINTENANCE"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>Kontrak Maintenance</span>
            <span className="px-1.5 py-0.2 bg-slate-100 rounded-full text-[10px]">
              {clientContracts.length}
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === "OVERVIEW" && (
            <div className="space-y-4">
              {/* LTV & Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100">
                  <div className="text-[11px] font-semibold text-indigo-700">Cumulative Lifetime Value (LTV)</div>
                  <div className="text-xl font-black text-indigo-900 mt-1 font-mono">
                    {formatRupiah(client.totalLtv)}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-600">Total Proyek Delivery</div>
                  <div className="text-xl font-black text-slate-900 mt-1 font-mono">
                    {client.projectCount} Proyek
                  </div>
                </div>
              </div>

              {/* Contact & PIC Info */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-2.5">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Kontak Person In Charge (PIC)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 pt-1">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>
                      <strong>{client.picName}</strong>
                      {client.position && ` (${client.position})`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <a
                      href={`https://wa.me/${client.picPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 font-semibold hover:underline"
                    >
                      +{client.picPhone}
                    </a>
                  </div>
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span>{client.email}</span>
                    </div>
                  )}
                  {client.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-slate-400" />
                      <a
                        href={client.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline"
                      >
                        {client.website}
                      </a>
                    </div>
                  )}
                </div>

                {client.address && (
                  <div className="flex items-start gap-2 text-xs text-slate-600 pt-1">
                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>{client.address}</span>
                  </div>
                )}
              </div>

              {/* Notes */}
              {client.notes && (
                <div className="border border-slate-200 rounded-xl p-4 space-y-1">
                  <div className="text-xs font-bold text-slate-900">Catatan Khusus Klien</div>
                  <p className="text-xs text-slate-600 leading-relaxed">{client.notes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "WARRANTIES" && (
            <div className="space-y-3">
              {clientWarranties.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  Belum ada garansi aktif untuk klien ini.
                </div>
              ) : (
                clientWarranties.map((w) => (
                  <div key={w.id} className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{w.projectName}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Paket {w.tier} • {w.durationMonths} Bulan
                        </div>
                      </div>
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                          w.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : w.status === "EXPIRING_SOON"
                            ? "bg-amber-100 text-amber-800 border-amber-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {w.status} ({w.daysRemaining > 0 ? `${w.daysRemaining} hari lagi` : "Habis"})
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">{w.scopeOfSupport}</p>

                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100">
                      <span>Masa Berlaku: {w.startDate} s.d. {w.endDate}</span>
                      <button
                        onClick={() => onOpenRenewal("WARRANTY", w.id)}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        Tawari Maintenance &rarr;
                      </button>
                    </div>

                    {/* Claims list */}
                    {w.claims.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        <div className="text-[11px] font-bold text-slate-700">Riwayat Klaim Isu:</div>
                        {w.claims.map((c) => (
                          <div key={c.id} className="p-2 bg-slate-50 rounded text-[11px] space-y-1">
                            <div className="flex items-center justify-between font-semibold text-slate-800">
                              <span>{c.issueTitle}</span>
                              <span className="text-[10px] text-emerald-600">{c.status}</span>
                            </div>
                            <div className="text-slate-500">{c.issueDescription}</div>
                            {c.resolutionNotes && (
                              <div className="text-indigo-700 font-medium text-[10px]">
                                Solusi: {c.resolutionNotes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "MAINTENANCE" && (
            <div className="space-y-3">
              {clientContracts.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  Belum ada kontrak maintenance untuk klien ini.
                </div>
              ) : (
                clientContracts.map((m) => (
                  <div key={m.id} className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{m.contractNumber}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Billing: {m.billingType} • {formatRupiah(m.price)}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                          m.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : "bg-amber-100 text-amber-800 border-amber-200"
                        }`}
                      >
                        {m.status} ({m.daysRemaining > 0 ? `${m.daysRemaining} hari` : "Habis"})
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">{m.terms}</p>

                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100">
                      <span>Periode: {m.startDate} s.d. {m.endDate}</span>
                      <button
                        onClick={() => onOpenRenewal("MAINTENANCE", m.id)}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        Follow-up Perpanjangan &rarr;
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
