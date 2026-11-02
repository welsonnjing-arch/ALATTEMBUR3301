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
import { ModalPortal } from "@/components/common/ModalPortal";

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
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] modal-backdrop-clean flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-ios-fade">
        <div className="w-full max-w-2xl max-h-[88vh] flex flex-col bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden animate-ios-scale relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
              <Building2 className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">{client.name}</h3>
              <p className="text-xs text-slate-500">
                {client.industry || "Sektor Umum"} / Bergabung sejak {formatDateWIB(client.onboardingDate)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Header */}
        <div className="flex border-b border-slate-200/80 px-6 text-xs font-semibold shrink-0 bg-white">
          <button
            onClick={() => setActiveTab("OVERVIEW")}
            className={`py-3 border-b-2 mr-6 transition-colors ${
              activeTab === "OVERVIEW"
                ? "border-slate-900 text-slate-900 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Profil & LTV
          </button>
          <button
            onClick={() => setActiveTab("WARRANTIES")}
            className={`py-3 border-b-2 mr-6 transition-colors flex items-center gap-1.5 ${
              activeTab === "WARRANTIES"
                ? "border-slate-900 text-slate-900 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>Garansi Teknis</span>
            <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded-md font-mono text-[10px]">
              {clientWarranties.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("MAINTENANCE")}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "MAINTENANCE"
                ? "border-slate-900 text-slate-900 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>Kontrak Maintenance</span>
            <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded-md font-mono text-[10px]">
              {clientContracts.length}
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-4 flex-1 min-h-0">
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
                  <div key={w.id} className="border border-slate-200/80 rounded-xl p-4 space-y-3 card-hover-lift bg-white">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{w.projectName}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Paket {w.tier} / {w.durationMonths} Bulan
                        </div>
                      </div>
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-md font-mono font-bold border ${
                          w.status === "ACTIVE"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : w.status === "EXPIRING_SOON"
                            ? "bg-slate-100 text-slate-800 border-slate-300"
                            : "bg-slate-50 text-slate-600 border-slate-200"
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
                        className="text-blue-600 hover:text-blue-800 font-semibold"
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
                              <span className="text-[10px] text-blue-600 font-semibold">{c.status}</span>
                            </div>
                            <div className="text-slate-500">{c.issueDescription}</div>
                            {c.resolutionNotes && (
                              <div className="text-slate-700 font-medium text-[10px]">
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
                  <div key={m.id} className="border border-slate-200/80 rounded-xl p-4 space-y-3 card-hover-lift bg-white">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{m.contractNumber}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Billing: {m.billingType} / {formatRupiah(m.price)}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-md font-mono font-bold border ${
                          m.status === "ACTIVE"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-slate-100 text-slate-800 border-slate-300"
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
                        className="text-blue-600 hover:text-blue-800 font-semibold"
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

        {/* Sticky Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200/80 flex items-center justify-between shrink-0 bg-slate-50/90 rounded-b-2xl">
          <div className="text-xs text-slate-500 font-medium">
            PIC: <span className="text-slate-800 font-semibold">{client.picName}</span> ({client.picPhone})
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200/90 rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
