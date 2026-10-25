"use client";

import React, { useState } from "react";
import {
  Users,
  ShieldCheck,
  Wrench,
  Search,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Phone,
  Building2,
  Calendar,
  MessageSquare,
  ChevronRight,
  ExternalLink,
  LifeBuoy,
} from "lucide-react";
import {
  Client,
  MaintenanceContract,
  Warranty,
  WarrantyClaim,
} from "@/modules/client-lifecycle/types";
import { formatRupiah } from "@/lib/currency";
import { formatDateWIB } from "@/lib/date";
import {
  generateRenewalFollowUpDraftAction,
  updateWarrantyClaimStatusAction,
} from "@/modules/client-lifecycle/client-lifecycle.actions";
import { CreateClientModal } from "./CreateClientModal";
import { CreateWarrantyModal } from "./CreateWarrantyModal";
import { CreateWarrantyClaimModal } from "./CreateWarrantyClaimModal";
import { CreateMaintenanceModal } from "./CreateMaintenanceModal";
import { RenewalOfferModal } from "./RenewalOfferModal";
import { ClientDetailModal } from "./ClientDetailModal";

interface ClientLifecycleViewProps {
  initialClients: Client[];
  initialWarranties: Warranty[];
  initialContracts: MaintenanceContract[];
  userRole?: string;
  isOwner?: boolean;
}

export function ClientLifecycleView({
  initialClients,
  initialWarranties,
  initialContracts,
  userRole = "OWNER",
  isOwner = true,
}: ClientLifecycleViewProps) {
  const [activeTab, setActiveTab] = useState<"CLIENTS" | "WARRANTIES" | "MAINTENANCE">("CLIENTS");
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [warranties, setWarranties] = useState<Warranty[]>(initialWarranties);
  const [contracts, setContracts] = useState<MaintenanceContract[]>(initialContracts);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
  const [isCreateWarrantyOpen, setIsCreateWarrantyOpen] = useState(false);
  const [isCreateMaintenanceOpen, setIsCreateMaintenanceOpen] = useState(false);
  const [claimWarrantyTarget, setClaimWarrantyTarget] = useState<Warranty | null>(null);
  const [selectedClientDetail, setSelectedClientDetail] = useState<Client | null>(null);

  // Renewal Offer State
  const [renewalModalOpen, setRenewalModalOpen] = useState(false);
  const [renewalClientName, setRenewalClientName] = useState("");
  const [renewalPhone, setRenewalPhone] = useState("");
  const [renewalMessage, setRenewalMessage] = useState("");

  // Totals & Metrics
  const totalLtv = clients.reduce((sum, c) => sum + c.totalLtv, 0);
  const activeWarrantiesCount = warranties.filter((w) => w.status === "ACTIVE").length;
  const expiringWarrantiesCount = warranties.filter((w) => w.status === "EXPIRING_SOON").length;
  const activeContractsCount = contracts.filter((m) => m.status === "ACTIVE").length;

  const handleOpenRenewal = async (type: "WARRANTY" | "MAINTENANCE", targetId: string) => {
    const res = await generateRenewalFollowUpDraftAction(type, targetId);
    if (res.success) {
      setRenewalClientName(res.clientName);
      setRenewalPhone(res.targetPhone);
      setRenewalMessage(res.messageText);
      setRenewalModalOpen(true);
    }
  };

  const handleResolveClaim = async (claimId: string) => {
    const res = await updateWarrantyClaimStatusAction(
      claimId,
      "RESOLVED",
      "Isu telah ditangani dan divalidasi berfungsi normal oleh tim pengembang."
    );
    if (res.success) {
      setWarranties((prev) =>
        prev.map((w) => ({
          ...w,
          claims: w.claims.map((c) =>
            c.id === claimId
              ? {
                  ...c,
                  status: "RESOLVED",
                  resolvedAt: new Date().toISOString(),
                  resolutionNotes:
                    "Isu telah ditangani dan divalidasi berfungsi normal oleh tim pengembang.",
                }
              : c
          ),
        }))
      );
    }
  };

  const filteredClients = clients.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.picName.toLowerCase().includes(q) ||
      (c.industry && c.industry.toLowerCase().includes(q))
    );
  });

  const filteredWarranties = warranties.filter((w) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      w.clientName.toLowerCase().includes(q) ||
      w.projectName.toLowerCase().includes(q) ||
      w.tier.toLowerCase().includes(q)
    );
  });

  const filteredContracts = contracts.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      m.clientName.toLowerCase().includes(q) ||
      m.contractNumber.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Klien Resmi</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
            {clients.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Entitas bisnis & institusi</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Akumulasi Nilai LTV</span>
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700 font-mono">
            {formatRupiah(totalLtv)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total revenue seluruh klien</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Garansi Teknis Aktif</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
            {activeWarrantiesCount}{" "}
            {expiringWarrantiesCount > 0 && (
              <span className="text-xs text-amber-600 font-normal">
                ({expiringWarrantiesCount} expiring soon)
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Dukungan pasca-deliverables</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Kontrak Maintenance</span>
            <Wrench className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
            {activeContractsCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Pemeliharaan & recurring MRR</p>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("CLIENTS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "CLIENTS"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Direktori Klien ({clients.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("WARRANTIES")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "WARRANTIES"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Pusat Garansi & Klaim ({warranties.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("MAINTENANCE")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "MAINTENANCE"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            Kontrak Maintenance & Renewal ({contracts.length})
          </button>
        </div>

        {/* Global Search inside Tab */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari klien, PIC, proyek..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* TAB 1: DIREKTORI KLIEN */}
      {activeTab === "CLIENTS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Data Induk Klien Resmi Fynux
              </h2>
              <p className="text-xs text-slate-500">
                Entitas bisnis terdaftar dengan riwayat kontrak, deliverables, dan akumulasi LTV.
              </p>
            </div>
            {isOwner && (
              <button
                type="button"
                onClick={() => setIsCreateClientOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Registrasi Klien Baru
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Nama Instansi / Perusahaan</th>
                    <th className="py-3 px-4">Sektor Industri</th>
                    <th className="py-3 px-4">PIC & No. WhatsApp</th>
                    <th className="py-3 px-4">Onboarding</th>
                    <th className="py-3 px-4 text-right">Lifetime Value (LTV)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClients.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{client.name}</div>
                        {client.website && (
                          <a
                            href={client.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-indigo-600 hover:underline inline-flex items-center gap-1"
                          >
                            {client.website} <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {client.industry || "Umum"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{client.picName}</div>
                        <a
                          href={`https://wa.me/${client.picPhone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-emerald-600 font-semibold hover:underline inline-flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" /> +{client.picPhone}
                        </a>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {formatDateWIB(client.onboardingDate)}
                      </td>
                      <td className="py-3 px-4 text-right font-black font-mono text-slate-900">
                        {formatRupiah(client.totalLtv)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {client.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedClientDetail(client)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          Lihat Profil &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PUSAT GARANSI & KLAIM */}
      {activeTab === "WARRANTIES" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Pusat Pelacakan Garansi Teknis & Klaim Masalah
              </h2>
              <p className="text-xs text-slate-500">
                Standar garansi Fynux (Basic: 3 bln, Business: 6 bln, Enterprise: 12 bln) dihitung sejak tanggal serah terima proyek.
              </p>
            </div>
            {isOwner && (
              <button
                type="button"
                onClick={() => setIsCreateWarrantyOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Terbitkan Garansi Baru
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWarranties.map((w) => (
              <div
                key={w.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        w.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : w.status === "EXPIRING_SOON"
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {w.status}
                    </span>
                    <span className="text-[11px] font-bold text-indigo-700">
                      Tier: {w.tier} ({w.durationMonths} Bulan)
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                    {w.projectName}
                  </h3>
                  <div className="text-xs font-semibold text-slate-600">
                    {w.clientName}
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2">
                    {w.scopeOfSupport}
                  </p>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-[11px]">
                    <div className="flex justify-between text-slate-500">
                      <span>Mulai Garansi:</span>
                      <span className="font-mono">{w.startDate}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Jatuh Tempo:</span>
                      <span className="font-mono">{w.endDate}</span>
                    </div>
                    <div className="flex justify-between font-bold pt-1 border-t border-slate-200/60">
                      <span className="text-slate-700">Sisa Masa Garansi:</span>
                      <span
                        className={`font-mono ${
                          w.daysRemaining <= 0
                            ? "text-rose-600"
                            : w.daysRemaining <= 30
                            ? "text-amber-600"
                            : "text-emerald-700"
                        }`}
                      >
                        {w.daysRemaining > 0
                          ? `${w.daysRemaining} Hari`
                          : "Telah Habis"}
                      </span>
                    </div>
                  </div>

                  {/* Claims preview */}
                  {w.claims.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                        <span>Laporan Isu ({w.claims.length})</span>
                      </div>
                      {w.claims.map((c) => (
                        <div
                          key={c.id}
                          className="p-2 rounded-lg border border-slate-100 bg-slate-50 text-[11px] space-y-1"
                        >
                          <div className="flex items-center justify-between font-semibold">
                            <span className="text-slate-800 line-clamp-1">
                              {c.issueTitle}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                c.status === "RESOLVED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {c.status}
                            </span>
                          </div>
                          {c.status !== "RESOLVED" && (
                            <button
                              type="button"
                              onClick={() => handleResolveClaim(c.id)}
                              className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold"
                            >
                              Tandai Terselesaikan &rarr;
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setClaimWarrantyTarget(w)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800"
                  >
                    <LifeBuoy className="w-3.5 h-3.5" />
                    Klaim Isu Baru
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenRenewal("WARRANTY", w.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Tawari Maintenance
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: KONTRAK MAINTENANCE */}
      {activeTab === "MAINTENANCE" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Kontrak Maintenance & Perpanjangan (Recurring MRR)
              </h2>
              <p className="text-xs text-slate-500">
                Kontrak pemeliharaan rutin pasca garansi: backup terjadwal, patching keamanan, dan monitoring SLA.
              </p>
            </div>
            {isOwner && (
              <button
                type="button"
                onClick={() => setIsCreateMaintenanceOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Buat Kontrak Maintenance Baru
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredContracts.map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {m.contractNumber}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 mt-1">
                        {m.clientName}
                      </h3>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        m.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : "bg-amber-100 text-amber-800 border-amber-200"
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-[10px] text-slate-500">Biaya Kontrak</span>
                      <div className="text-base font-extrabold text-slate-900 font-mono">
                        {formatRupiah(m.price)}
                      </div>
                      <span className="text-[10px] text-indigo-600 font-semibold">
                        Tagihan: {m.billingType}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-[10px] text-slate-500">Masa Berlaku</span>
                      <div className="text-xs font-mono font-semibold text-slate-800">
                        {m.startDate} s.d {m.endDate}
                      </div>
                      <span
                        className={`text-[10px] font-bold ${
                          m.daysRemaining <= 15
                            ? "text-rose-600"
                            : "text-emerald-700"
                        }`}
                      >
                        Sisa {m.daysRemaining} hari lagi
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600">{m.terms}</p>

                  {/* Scope items */}
                  <div className="space-y-1">
                    <div className="text-[11px] font-bold text-slate-700">Cakupan Layanan:</div>
                    <ul className="text-[11px] text-slate-600 list-disc list-inside space-y-0.5">
                      {m.scopeItems.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Pengingat Renewal: {m.renewalReminderDate}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenRenewal("MAINTENANCE", m.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Kirim Penawaran Renewal
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODALS */}
      <CreateClientModal
        isOpen={isCreateClientOpen}
        onClose={() => setIsCreateClientOpen(false)}
        onSuccess={() => window.location.reload()}
      />

      <CreateWarrantyModal
        isOpen={isCreateWarrantyOpen}
        onClose={() => setIsCreateWarrantyOpen(false)}
        onSuccess={() => window.location.reload()}
        clients={clients}
      />

      <CreateWarrantyClaimModal
        isOpen={!!claimWarrantyTarget}
        onClose={() => setClaimWarrantyTarget(null)}
        onSuccess={() => window.location.reload()}
        warranty={claimWarrantyTarget}
      />

      <CreateMaintenanceModal
        isOpen={isCreateMaintenanceOpen}
        onClose={() => setIsCreateMaintenanceOpen(false)}
        onSuccess={() => window.location.reload()}
        clients={clients}
      />

      <RenewalOfferModal
        isOpen={renewalModalOpen}
        onClose={() => setRenewalModalOpen(false)}
        clientName={renewalClientName}
        targetPhone={renewalPhone}
        initialMessage={renewalMessage}
      />

      <ClientDetailModal
        isOpen={!!selectedClientDetail}
        onClose={() => setSelectedClientDetail(null)}
        client={selectedClientDetail}
        warranties={warranties}
        maintenanceContracts={contracts}
        onOpenRenewal={(type, targetId) => {
          setSelectedClientDetail(null);
          handleOpenRenewal(type, targetId);
        }}
      />
    </div>
  );
}
