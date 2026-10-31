"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Plus,
  Upload,
  Phone,
  Calendar,
  Clock,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Building2,
  Users,
  Trash2,
  Shuffle,
} from "lucide-react";
import { Prospect } from "@/modules/crm/types";
import { PipelineStage } from "@/types/enums";
import { CreateProspectModal } from "./CreateProspectModal";
import { ProspectDetailModal } from "./ProspectDetailModal";
import { BulkImportModal } from "./BulkImportModal";
import { BulkDistributeModal } from "./BulkDistributeModal";
import {
  deleteProspectAction,
  bulkDeleteProspectsAction,
} from "@/modules/crm/crm.actions";
import { isFollowUpDueTodayOrOverdue, isFollowUpOverdue } from "@/modules/follow-up/follow-up.service";
import { formatDateWIB } from "@/lib/date";
import { Pagination } from "@/components/common/Pagination";
import { useToast } from "@/components/common/Toast";

interface ProspectListTableProps {
  initialProspects: Prospect[];
  onRefresh?: () => void;
  userRole?: string;
}

const STAGE_TABS: Array<{ label: string; value: PipelineStage | "ALL" }> = [
  { label: "Semua", value: "ALL" },
  { label: "New", value: "NEW" },
  { label: "Contacted", value: "CONTACTED" },
  { label: "Responded", value: "RESPONDED" },
  { label: "Engaged", value: "ENGAGED" },
  { label: "Qualified", value: "QUALIFIED" },
  { label: "Negotiation", value: "NEGOTIATION" },
  { label: "Pending", value: "PENDING" },
  { label: "Closed Won", value: "CLOSED_WON" },
  { label: "Failed", value: "FAILED" },
];

export function ProspectListTable({
  initialProspects,
  onRefresh,
  userRole = "OWNER",
}: ProspectListTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [prospects, setProspects] = useState<Prospect[]>(initialProspects);

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      router.refresh();
    }
  };
  const [selectedStage, setSelectedStage] = useState<PipelineStage | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [isDistributeBulkOpen, setIsDistributeBulkOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 25;

  useEffect(() => {
    setProspects(initialProspects);
    setSelectedIds([]);
  }, [initialProspects]);

  // Filter List
  const filteredProspects = prospects.filter((p) => {
    const matchesStage = selectedStage === "ALL" || p.stage === selectedStage;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      p.companyName?.toLowerCase().includes(q) ||
      p.contactName?.toLowerCase().includes(q) ||
      p.whatsappNumber?.includes(q) ||
      (p.researchNotes || "")?.toLowerCase().includes(q);

    return matchesStage && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProspects.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedProspects = filteredProspects.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE
  );

  const getStageBadgeColor = (stage: PipelineStage) => {
    switch (stage) {
      case "NEW":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "CONTACTED":
        return "bg-blue-50 text-blue-700 border-blue-200/80";
      case "RESPONDED":
        return "bg-blue-100 text-blue-800 border-blue-300 font-semibold";
      case "ENGAGED":
        return "bg-slate-100 text-slate-800 border-slate-300 font-medium";
      case "QUALIFIED":
        return "bg-slate-200 text-slate-800 border-slate-300 font-medium";
      case "NEGOTIATION":
        return "bg-slate-800 text-white border-slate-700 font-medium";
      case "PENDING":
        return "bg-slate-100 text-slate-600 border-slate-200";
      case "CLOSED_WON":
        return "bg-slate-900 text-white font-bold border-slate-800";
      case "FAILED":
        return "bg-slate-100 text-slate-500 border-slate-200 line-through";
    }
  };

  const getNextActionBadgeColor = (action: string) => {
    switch (action) {
      case "REACH_NOW":
        return "text-blue-700 bg-blue-50 border-blue-200";
      case "WAITING_FOR_RESPONSE":
        return "text-slate-600 bg-slate-50 border-slate-200";
      case "REPLY_TO_CLIENT":
        return "text-slate-900 bg-slate-100 border-slate-300 font-semibold";
      case "PREPARE_PROPOSAL":
        return "text-slate-800 bg-slate-100 border-slate-200";
      case "SCHEDULE_MEETING":
        return "text-blue-700 bg-blue-50 border-blue-200";
      default:
        return "text-slate-600 bg-slate-100 border-slate-200";
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari perusahaan, kontak, WA, atau kata kunci riset..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsBulkImportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200/90 shadow-2xs transition-all active-press"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Bulk Import CSV / Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-500/20 transition-all active-press"
          >
            <Plus className="w-4 h-4" />
            <span>Input Prospek Riset Baru</span>
          </button>
        </div>
      </div>

      {/* Stage Filter Tabs (Recent.design style horizontal pills) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        {STAGE_TABS.map((tab) => {
          const isActive = selectedStage === tab.value;
          const count =
            tab.value === "ALL"
              ? prospects.length
              : prospects.filter((p) => p.stage === tab.value).length;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setSelectedStage(tab.value);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 active-press ${
                isActive
                  ? "bg-slate-900 text-white font-semibold shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                  isActive
                    ? "bg-slate-800 text-slate-200"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden w-full">
        {/* Bulk Action Toolbar */}
        {selectedIds.length > 0 && (
          <div className="p-3 bg-rose-50 border-b border-rose-200 flex items-center justify-between text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-rose-900 font-semibold">
              <span className="w-5 h-5 rounded-md font-mono bg-rose-200 text-rose-800 text-[11px] font-bold flex items-center justify-center">
                {selectedIds.length}
              </span>
              <span>Prospek dipilih</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-xs font-medium transition-colors"
              >
                Batalkan Pilihan
              </button>
              <button
                type="button"
                onClick={() => setIsDistributeBulkOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
              >
                <Shuffle className="w-3.5 h-3.5 text-blue-600" />
                <span>Bagi Rata ke Sales ({selectedIds.length})</span>
              </button>
              <button
                type="button"
                disabled={isDeletingBulk}
                onClick={async () => {
                  if (
                    confirm(
                      `Apakah Anda yakin ingin menghapus ${selectedIds.length} prospek terpilih sekaligus?\n\nData prospek akan dihapus dari sistem CRM.`
                    )
                  ) {
                    setIsDeletingBulk(true);
                    const res = await bulkDeleteProspectsAction(selectedIds);
                    setIsDeletingBulk(false);
                    if (res.success) {
                      toast.success(`${selectedIds.length} prospek berhasil dihapus`);
                      setProspects((prev) =>
                        prev.filter((p) => !selectedIds.includes(p.id))
                      );
                      setSelectedIds([]);
                      handleRefresh();
                    } else {
                      alert(res.error || "Gagal menghapus prospek terpilih.");
                    }
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {isDeletingBulk
                    ? "Menghapus..."
                    : `Hapus ${selectedIds.length} Terpilih`}
                </span>
              </button>
            </div>
          </div>
        )}

        {filteredProspects.length > 0 ? (
          <>
            <div className="table-container-clean w-full overflow-x-auto border-0 rounded-none shadow-none">
            <table className="w-full text-left text-xs min-w-[1020px]">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredProspects.length > 0 &&
                        selectedIds.length === filteredProspects.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(filteredProspects.map((p) => p.id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4 min-w-[200px]">Perusahaan & Kontak</th>
                  <th className="py-3.5 px-4 min-w-[130px]">WhatsApp</th>
                  <th className="py-3.5 px-4 min-w-[120px]">Pipeline Stage</th>
                  <th className="py-3.5 px-4 min-w-[130px]">Next Action</th>
                  <th className="py-3.5 px-4 min-w-[130px]">Jadwal Follow-Up</th>
                  <th className="py-3.5 px-4 min-w-[130px]">PIC Sales</th>
                  <th className="py-3.5 px-4 text-right min-w-[160px] pr-8">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedProspects.map((p) => {
                  const isDue = isFollowUpDueTodayOrOverdue(p.nextFollowUpDate);
                  const isOverdue = isFollowUpOverdue(p.nextFollowUpDate);
                  const isSelected = selectedIds.includes(p.id);

                  return (
                    <tr
                      key={p.id}
                      className={`table-row-hover hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        isSelected ? "bg-indigo-50/40" : ""
                      }`}
                      onClick={() => setSelectedProspect(p)}
                    >
                      {/* Checkbox Pilihan */}
                      <td
                        className="py-3 px-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (e.target.checked) {
                              setSelectedIds((prev) => [...prev, p.id]);
                            } else {
                              setSelectedIds((prev) =>
                                prev.filter((id) => id !== p.id)
                              );
                            }
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* Perusahaan & Kontak */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {p.companyName}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {p.contactName}
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-1 max-w-xs">
                          {p.researchNotes}
                        </p>
                      </td>

                      {/* WhatsApp */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono text-slate-800">
                          +{p.whatsappNumber}
                        </span>
                      </td>

                      {/* Pipeline Stage */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md border font-mono ${getStageBadgeColor(
                            p.stage
                          )}`}
                        >
                          {p.stage}
                        </span>
                      </td>

                      {/* Next Action */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded border ${getNextActionBadgeColor(
                            p.nextAction
                          )}`}
                        >
                          {p.nextAction}
                        </span>
                      </td>

                      {/* Jadwal Follow-Up */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {p.nextFollowUpDate ? (
                          <div className="flex items-center gap-1">
                            <Clock
                              className={`w-3.5 h-3.5 ${
                                isOverdue
                                  ? "text-rose-500"
                                  : isDue
                                  ? "text-amber-500"
                                  : "text-slate-400"
                              }`}
                            />
                            <span
                              className={`font-medium ${
                                isOverdue
                                  ? "text-rose-600 font-bold"
                                  : isDue
                                  ? "text-blue-700 font-semibold"
                                  : "text-slate-600"
                              }`}
                            >
                              {formatDateWIB(p.nextFollowUpDate)}
                            </span>
                            {isDue && (
                              <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-200 font-bold px-1.5 py-0.2 rounded ml-1">
                                Hari Ini
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* PIC Sales */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 text-[11px]">
                        {p.assignedSalesName || "Faiz Aditama (Owner)"}
                      </td>

                      {/* Aksi */}
                      <td
                        className="py-3.5 px-4 text-right whitespace-nowrap min-w-[160px] pr-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedProspect(p)}
                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold text-xs px-2.5 py-1 rounded-lg hover:bg-indigo-50 transition-all active-press"
                          >
                            <span>Detail</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              if (
                                confirm(
                                  `Apakah Anda yakin ingin menghapus data prospek "${p.companyName}"?`
                                )
                              ) {
                                const res = await deleteProspectAction(p.id);
                                if (res.success) {
                                  toast.success(`Prospek "${p.companyName}" berhasil dihapus`);
                                  setProspects((prev) =>
                                    prev.filter((item) => item.id !== p.id)
                                  );
                                  setSelectedIds((prev) =>
                                    prev.filter((id) => id !== p.id)
                                  );
                                  handleRefresh();
                                } else {
                                  alert(res.error || "Gagal menghapus prospek.");
                                }
                              }
                            }}
                            title="Hapus Prospek"
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

            {/* Pagination Controls (25 Data Per Page) */}
            <div className="p-4 border-t border-slate-200/80 bg-slate-50/40">
              <Pagination
                currentPage={safeCurrentPage}
                totalItems={filteredProspects.length}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
                itemLabel="prospek"
              />
            </div>
          </>
        ) : (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">
              Tidak ada prospek ditemukan
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery
                ? `Tidak ada hasil untuk pencarian "${searchQuery}" pada stage ini.`
                : "Belum ada prospek riset yang tersimpan pada stage ini."}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <BulkDistributeModal
        isOpen={isDistributeBulkOpen}
        onClose={() => setIsDistributeBulkOpen(false)}
        selectedProspectIds={selectedIds}
        onSuccess={() => {
          setSelectedIds([]);
          handleRefresh();
        }}
      />

      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onSuccess={() => {
          handleRefresh();
        }}
        existingPhones={prospects.map((p) => p.whatsappNumber)}
      />

      <CreateProspectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(newProspect) => {
          if (newProspect) {
            setProspects((prev) => [newProspect, ...prev]);
          }
          handleRefresh();
        }}
      />

      <ProspectDetailModal
        prospect={selectedProspect}
        isOpen={!!selectedProspect}
        onClose={() => setSelectedProspect(null)}
        onRefresh={() => {
          setSelectedProspect(null);
          handleRefresh();
        }}
      />
    </div>
  );
}
