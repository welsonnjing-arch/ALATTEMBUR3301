"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Pagination } from "@/components/common/Pagination";
import { useToast } from "@/components/common/Toast";

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
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"CLIENTS" | "WARRANTIES" | "MAINTENANCE">("CLIENTS");
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [warranties, setWarranties] = useState<Warranty[]>(initialWarranties);
  const [contracts, setContracts] = useState<MaintenanceContract[]>(initialContracts);

  useEffect(() => {
    setClients(initialClients);
    setWarranties(initialWarranties);
    setContracts(initialContracts);
  }, [initialClients, initialWarranties, initialContracts]);

  const [searchQuery, setSearchQuery] = useState("");
  const [clientPage, setClientPage] = useState(1);
  const [warrantyPage, setWarrantyPage] = useState(1);
  const [contractPage, setContractPage] = useState(1);
  const PAGE_SIZE = 25;

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

  const totalClientPages = Math.max(1, Math.ceil(filteredClients.length / PAGE_SIZE));
  const safeClientPage = Math.min(clientPage, totalClientPages);
  const paginatedClients = filteredClients.slice(
    (safeClientPage - 1) * PAGE_SIZE,
    safeClientPage * PAGE_SIZE
  );

  const totalWarrantyPages = Math.max(1, Math.ceil(filteredWarranties.length / PAGE_SIZE));
  const safeWarrantyPage = Math.min(warrantyPage, totalWarrantyPages);
  const paginatedWarranties = filteredWarranties.slice(
    (safeWarrantyPage - 1) * PAGE_SIZE,
    safeWarrantyPage * PAGE_SIZE
  );

  const totalContractPages = Math.max(1, Math.ceil(filteredContracts.length / PAGE_SIZE));
  const safeContractPage = Math.min(contractPage, totalContractPages);
  const paginatedContracts = filteredContracts.slice(
    (safeContractPage - 1) * PAGE_SIZE,
    safeContractPage * PAGE_SIZE
  );

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 sm:p-4.5 rounded-xl border border-slate-200/80 shadow-2xs min-w-0">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600 truncate whitespace-nowrap">Total Klien Resmi</span>
            <Users className="w-4 h-4 text-blue-600 shrink-0 ml-1.5" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-slate-900 font-mono tracking-tight truncate whitespace-nowrap">
            {clients.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate whitespace-nowrap">Entitas bisnis & institusi</p>
        </div>

        <div className="bg-white p-4 sm:p-4.5 rounded-xl border border-slate-200/80 shadow-2xs min-w-0">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600 truncate whitespace-nowrap">Akumulasi Nilai LTV</span>
            <Building2 className="w-4 h-4 text-blue-600 shrink-0 ml-1.5" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-slate-900 font-mono tracking-tight truncate whitespace-nowrap">
            {formatRupiah(totalLtv)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate whitespace-nowrap">Total revenue seluruh klien</p>
        </div>

        <div className="bg-white p-4 sm:p-4.5 rounded-xl border border-slate-200/80 shadow-2xs min-w-0">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600 truncate whitespace-nowrap">Garansi Teknis Aktif</span>
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 ml-1.5" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-slate-900 font-mono tracking-tight truncate whitespace-nowrap">
            {activeWarrantiesCount}{" "}
            {expiringWarrantiesCount > 0 && (
              <span className="text-xs text-slate-500 font-normal">
                ({expiringWarrantiesCount} expiring)
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate whitespace-nowrap">Dukungan pasca-deliverables</p>
        </div>

        <div className="bg-white p-4 sm:p-4.5 rounded-xl border border-slate-200/80 shadow-2xs min-w-0">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600 truncate whitespace-nowrap">Kontrak Maintenance</span>
            <Wrench className="w-4 h-4 text-slate-400 shrink-0 ml-1.5" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-slate-900 font-mono tracking-tight truncate whitespace-nowrap">
            {activeContractsCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate whitespace-nowrap">Pemeliharaan & recurring MRR</p>
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
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setClientPage(1);
              setWarrantyPage(1);
              setContractPage(1);
            }}
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

          <div className="table-container-clean w-full overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-2xs">
            <table className="w-full text-left text-xs min-w-[980px]">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 min-w-[200px]">Nama Instansi / Perusahaan</th>
                  <th className="py-3.5 px-4 min-w-[120px]">Sektor Industri</th>
                  <th className="py-3.5 px-4 min-w-[150px]">PIC & No. WhatsApp</th>
                  <th className="py-3.5 px-4 min-w-[110px]">Onboarding</th>
                  <th className="py-3.5 px-4 text-right min-w-[140px]">Lifetime Value (LTV)</th>
                  <th className="py-3.5 px-4 text-center min-w-[100px]">Status</th>
                  <th className="py-3.5 px-4 text-right min-w-[160px] pr-8">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedClients.length > 0 ? (
                  paginatedClients.map((client) => (
                    <tr
                      key={client.id}
                      className="table-row-hover hover:bg-slate-50/80 transition-colors duration-150"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{client.name}</div>
                        {client.website && (
                          <a
                            href={client.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-1 mt-0.5"
                          >
                            {client.website} <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {client.industry || "Umum"}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{client.picName}</div>
                        <a
                          href={`https://wa.me/${client.picPhone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-emerald-600 font-semibold hover:underline inline-flex items-center gap-1 mt-0.5"
                        >
                          <Phone className="w-3 h-3 text-emerald-500" /> +{client.picPhone}
                        </a>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {formatDateWIB(client.onboardingDate)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black font-mono text-slate-900">
                        {formatRupiah(client.totalLtv)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center text-[10px] px-2.5 py-0.5 rounded-md font-bold font-mono bg-slate-900 text-white border border-slate-800">
                          {client.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap min-w-[160px] pr-8">
                        <button
                          type="button"
                          onClick={() => setSelectedClientDetail(client)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50/80 rounded-lg transition-all active-press"
                        >
                          <span>Lihat Profil</span>
                          <span>&rarr;</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <h3 className="text-sm font-semibold text-slate-800">
                        Belum ada klien terdaftar
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {searchQuery
                          ? `Tidak ada hasil pencarian "${searchQuery}".`
                          : "Klien yang telah menyelesaikan deal akan muncul di sini."}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls for Clients Table */}
          {filteredClients.length > 0 && (
            <div className="pt-2">
              <Pagination
                currentPage={safeClientPage}
                totalItems={filteredClients.length}
                pageSize={PAGE_SIZE}
                onPageChange={setClientPage}
                itemLabel="klien"
              />
            </div>
          )}
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
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-500/20 transition-all active-press"
              >
                <Plus className="w-4 h-4" />
                Terbitkan Garansi Baru
              </button>
            )}
          </div>

          {paginatedWarranties.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-200">
              <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Belum ada data garansi proyek</p>
              <p className="text-xs text-slate-400 mt-1">Garansi akan otomatis tercatat atau dapat diterbitkan secara manual saat serah terima proyek.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedWarranties.map((w) => (
                <div
                  key={w.id}
                  className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 space-y-4 flex flex-col justify-between card-hover-lift"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-extrabold font-mono px-2.5 py-0.5 rounded-md border ${
                          w.status === "ACTIVE"
                            ? "bg-slate-900 text-white border-slate-800"
                            : w.status === "EXPIRING_SOON"
                            ? "bg-slate-200 text-slate-800 border-slate-300"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {w.status}
                      </span>
                      <span className="text-[11px] font-bold text-blue-600">
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
                          className="font-mono text-slate-900 font-bold"
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
                                    ? "bg-slate-900 text-white"
                                    : "bg-slate-200 text-slate-700"
                                }`}
                              >
                                {c.status}
                              </span>
                            </div>
                            {c.status !== "RESOLVED" && (
                              <button
                                type="button"
                                onClick={() => handleResolveClaim(c.id)}
                                className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold"
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
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900"
                    >
                      <LifeBuoy className="w-3.5 h-3.5 text-blue-600" />
                      Klaim Isu Baru
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenRenewal("WARRANTY", w.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Tawari Maintenance
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls for Warranties */}
          {filteredWarranties.length > 0 && (
            <div className="pt-2">
              <Pagination
                currentPage={safeWarrantyPage}
                totalItems={filteredWarranties.length}
                pageSize={PAGE_SIZE}
                onPageChange={setWarrantyPage}
                itemLabel="garansi"
              />
            </div>
          )}
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
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-500/20 transition-all active-press"
              >
                <Plus className="w-4 h-4" />
                Buat Kontrak Maintenance Baru
              </button>
            )}
          </div>

          {paginatedContracts.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-200">
              <Wrench className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Belum ada kontrak maintenance aktif</p>
              <p className="text-xs text-slate-400 mt-1">Buat kontrak maintenance baru untuk pemeliharaan rutin pasca garansi proyek.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedContracts.map((m) => (
                <div
                  key={m.id}
                  className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 space-y-4 flex flex-col justify-between card-hover-lift"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                          {m.contractNumber}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 mt-1">
                          {m.clientName}
                        </h3>
                      </div>
                      <span
                        className={`text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-md border ${
                          m.status === "ACTIVE"
                            ? "bg-slate-900 text-white border-slate-800"
                            : "bg-slate-200 text-slate-800 border-slate-300"
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
                        <span className="text-[10px] text-blue-600 font-semibold">
                          Tagihan: {m.billingType}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl">
                        <span className="text-[10px] text-slate-500">Masa Berlaku</span>
                        <div className="text-xs font-mono font-semibold text-slate-800">
                          {m.startDate} s.d {m.endDate}
                        </div>
                        <span
                          className="text-[10px] font-bold text-slate-700"
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
          )}

          {/* Pagination Controls for Maintenance Contracts */}
          {filteredContracts.length > 0 && (
            <div className="pt-2">
              <Pagination
                currentPage={safeContractPage}
                totalItems={filteredContracts.length}
                pageSize={PAGE_SIZE}
                onPageChange={setContractPage}
                itemLabel="kontrak"
              />
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      <CreateClientModal
        isOpen={isCreateClientOpen}
        onClose={() => setIsCreateClientOpen(false)}
        onSuccess={(newClient) => {
          if (newClient) {
            setClients((prev) => [newClient, ...prev]);
          }
          router.refresh();
        }}
      />

      <CreateWarrantyModal
        isOpen={isCreateWarrantyOpen}
        onClose={() => setIsCreateWarrantyOpen(false)}
        onSuccess={(newWarranty) => {
          if (newWarranty) {
            setWarranties((prev) => [newWarranty, ...prev]);
          }
          router.refresh();
        }}
        clients={clients}
      />

      <CreateWarrantyClaimModal
        isOpen={!!claimWarrantyTarget}
        onClose={() => setClaimWarrantyTarget(null)}
        onSuccess={() => router.refresh()}
        warranty={claimWarrantyTarget}
      />

      <CreateMaintenanceModal
        isOpen={isCreateMaintenanceOpen}
        onClose={() => setIsCreateMaintenanceOpen(false)}
        onSuccess={(newContract) => {
          if (newContract) {
            setContracts((prev) => [newContract, ...prev]);
          }
          router.refresh();
        }}
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
