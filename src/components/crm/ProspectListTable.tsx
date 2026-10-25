"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  Plus,
  Phone,
  Calendar,
  Clock,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Building2,
  Users,
} from "lucide-react";
import { Prospect } from "@/modules/crm/types";
import { PipelineStage } from "@/types/enums";
import { CreateProspectModal } from "./CreateProspectModal";
import { ProspectDetailModal } from "./ProspectDetailModal";
import { isFollowUpDueTodayOrOverdue, isFollowUpOverdue } from "@/modules/follow-up/follow-up.service";
import { formatDateWIB } from "@/lib/date";

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
  const [prospects, setProspects] = useState<Prospect[]>(initialProspects);
  const [selectedStage, setSelectedStage] = useState<PipelineStage | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);

  // Filter List
  const filteredProspects = prospects.filter((p) => {
    const matchesStage = selectedStage === "ALL" || p.stage === selectedStage;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      p.companyName.toLowerCase().includes(q) ||
      p.contactName.toLowerCase().includes(q) ||
      p.whatsappNumber.includes(q) ||
      p.researchNotes.toLowerCase().includes(q);

    return matchesStage && matchesSearch;
  });

  const getStageBadgeColor = (stage: PipelineStage) => {
    switch (stage) {
      case "NEW":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "CONTACTED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "RESPONDED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "ENGAGED":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "QUALIFIED":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "NEGOTIATION":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "PENDING":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "CLOSED_WON":
        return "bg-emerald-600 text-white font-bold border-emerald-600";
      case "FAILED":
        return "bg-rose-100 text-rose-700 border-rose-200";
    }
  };

  const getNextActionBadgeColor = (action: string) => {
    switch (action) {
      case "REACH_NOW":
        return "text-emerald-700 bg-emerald-50 border-emerald-200";
      case "WAITING_FOR_RESPONSE":
        return "text-slate-600 bg-slate-50 border-slate-200";
      case "REPLY_TO_CLIENT":
        return "text-indigo-700 bg-indigo-50 border-indigo-200";
      case "PREPARE_PROPOSAL":
        return "text-amber-700 bg-amber-50 border-amber-200";
      case "SCHEDULE_MEETING":
        return "text-purple-700 bg-purple-50 border-purple-200";
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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
          />
        </div>

        {/* Create Button */}
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Input Prospek Riset Baru
        </button>
      </div>

      {/* Stage Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-slate-200">
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
              onClick={() => setSelectedStage(tab.value)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isActive
                  ? "bg-indigo-600 text-white font-semibold shadow-sm"
                  : "text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? "bg-indigo-800 text-indigo-100"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredProspects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Perusahaan & Kontak</th>
                  <th className="py-3 px-4">WhatsApp</th>
                  <th className="py-3 px-4">Pipeline Stage</th>
                  <th className="py-3 px-4">Next Action</th>
                  <th className="py-3 px-4">Jadwal Follow-Up</th>
                  <th className="py-3 px-4">PIC Sales</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredProspects.map((p) => {
                  const isDue = isFollowUpDueTodayOrOverdue(p.nextFollowUpDate);
                  const isOverdue = isFollowUpOverdue(p.nextFollowUpDate);

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => setSelectedProspect(p)}
                    >
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
                          className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getStageBadgeColor(
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
                                  ? "text-amber-700 font-semibold"
                                  : "text-slate-600"
                              }`}
                            >
                              {formatDateWIB(p.nextFollowUpDate)}
                            </span>
                            {isDue && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1 rounded ml-1">
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
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProspect(p);
                          }}
                          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold text-xs px-2.5 py-1 rounded hover:bg-indigo-50 transition-colors"
                        >
                          Detail <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
      <CreateProspectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />

      <ProspectDetailModal
        prospect={selectedProspect}
        isOpen={!!selectedProspect}
        onClose={() => setSelectedProspect(null)}
        onRefresh={() => {
          setSelectedProspect(null);
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
}
