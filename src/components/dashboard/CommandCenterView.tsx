"use client";

import React from "react";
import {
  TrendingUp,
  Receipt,
  Users,
  Briefcase,
  ShieldAlert,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Wrench,
  CheckCircle2,
  DollarSign,
  Plus,
  Compass,
} from "lucide-react";
import Link from "next/link";
import { formatRupiah } from "@/lib/currency";
import { formatDateWIB } from "@/lib/date";
import { PendingRegistrationBanner } from "./PendingRegistrationBanner";

interface CommandCenterViewProps {
  financials: {
    totalIssued: number;
    totalPaid: number;
    totalOutstanding: number;
    profitability: {
      profit: number | null;
      marginPercent: number | null;
      isCostComplete: boolean;
    };
    invoicesCount: number;
  };
  crmMetrics: {
    totalProspects: number;
    activeDealsCount: number;
    pipelineValue: number;
    followUpDueTodayCount: number;
  };
  projectsMetrics: {
    activeProjectsCount: number;
    blockedTasksCount: number;
    avgProgress: number;
  };
  governanceMetrics: {
    pendingApprovalsCount: number;
  };
  retentionMetrics: {
    activeClientsCount: number;
    warrantiesExpiringCount: number;
    maintenanceActiveCount: number;
  };
}

export function CommandCenterView({
  financials,
  crmMetrics,
  projectsMetrics,
  governanceMetrics,
  retentionMetrics,
}: CommandCenterViewProps) {
  return (
    <div className="space-y-6">
      {/* Pending Google Auth Registration Banner for Owner */}
      <PendingRegistrationBanner />

      {/* Top Welcome Executive Panel (Recent.design aesthetic) */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl text-white shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-800/90 border border-slate-700/80 text-slate-300 font-mono text-[10px] tracking-wider uppercase">
              <span>FYNUX OS • EXECUTIVE CONTROL</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mt-2.5 tracking-tight text-white">
              Command Center Faiz Aditama
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              Pusat kendali komprehensif bisnis Fynux Digital Solutions: visibilitas keuangan real-time, pipeline penjualan, delivery proyek, dan governance approval.
            </p>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link
              href="/finance"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-500/20 transition-all active-press"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Invoice & Kas</span>
            </Link>
            <Link
              href="/crm"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700/80 transition-all active-press"
            >
              <Users className="w-3.5 h-3.5" />
              <span>CRM & Pipeline</span>
            </Link>
            <Link
              href="/approval-queue"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700/80 transition-all active-press"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
              <span>Persetujuan ({governanceMetrics.pendingApprovalsCount})</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Critical Attention Banners - Clean Refined Light Executive Card with Brand Accent */}
      {(governanceMetrics.pendingApprovalsCount > 0 ||
        projectsMetrics.blockedTasksCount > 0 ||
        crmMetrics.followUpDueTodayCount > 0 ||
        retentionMetrics.warrantiesExpiringCount > 0) && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 space-y-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-slate-500">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight">Perhatian & Tindakan Kritis Hari Ini</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono font-medium uppercase tracking-wider">Action Items</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-xs pt-0.5">
            {governanceMetrics.pendingApprovalsCount > 0 && (
              <Link
                href="/approval-queue"
                className="p-3 bg-slate-50/80 hover:bg-white hover:border-blue-300 hover:shadow-xs rounded-lg border border-slate-200/80 transition-all flex items-center justify-between group active-press min-w-0"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="text-[11px] text-slate-500 font-medium truncate whitespace-nowrap">Persetujuan Komersial</div>
                  <div className="flex items-center gap-1.5 mt-1 min-w-0">
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md bg-blue-100 text-blue-700 font-mono text-xs font-bold shrink-0">
                      {governanceMetrics.pendingApprovalsCount}
                    </span>
                    <span className="text-xs sm:text-[13px] font-semibold text-slate-900 truncate whitespace-nowrap">
                      Menunggu Keputusan
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
              </Link>
            )}

            {projectsMetrics.blockedTasksCount > 0 && (
              <Link
                href="/tasks"
                className="p-3 bg-slate-50/80 hover:bg-white hover:border-rose-300 hover:shadow-xs rounded-lg border border-slate-200/80 transition-all flex items-center justify-between group active-press min-w-0"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="text-[11px] text-slate-500 font-medium truncate whitespace-nowrap">Task Terkendala (Blocked)</div>
                  <div className="flex items-center gap-1.5 mt-1 min-w-0">
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md bg-rose-100 text-rose-700 font-mono text-xs font-bold shrink-0">
                      {projectsMetrics.blockedTasksCount}
                    </span>
                    <span className="text-xs sm:text-[13px] font-semibold text-slate-900 truncate whitespace-nowrap">
                      Butuh Intervensi
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
              </Link>
            )}

            {crmMetrics.followUpDueTodayCount > 0 && (
              <Link
                href="/crm"
                className="p-3 bg-slate-50/80 hover:bg-white hover:border-amber-300 hover:shadow-xs rounded-lg border border-slate-200/80 transition-all flex items-center justify-between group active-press min-w-0"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="text-[11px] text-slate-500 font-medium truncate whitespace-nowrap">Antrean Follow-Up CRM</div>
                  <div className="flex items-center gap-1.5 mt-1 min-w-0">
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md bg-amber-100 text-amber-800 font-mono text-xs font-bold shrink-0">
                      {crmMetrics.followUpDueTodayCount}
                    </span>
                    <span className="text-xs sm:text-[13px] font-semibold text-slate-900 truncate whitespace-nowrap">
                      Prospek Terjadwal
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
              </Link>
            )}

            {retentionMetrics.warrantiesExpiringCount > 0 && (
              <Link
                href="/client-lifecycle"
                className="p-3 bg-slate-50/80 hover:bg-white hover:border-purple-300 hover:shadow-xs rounded-lg border border-slate-200/80 transition-all flex items-center justify-between group active-press min-w-0"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="text-[11px] text-slate-500 font-medium truncate whitespace-nowrap">Garansi Segera Habis (&lt;30h)</div>
                  <div className="flex items-center gap-1.5 mt-1 min-w-0">
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md bg-purple-100 text-purple-700 font-mono text-xs font-bold shrink-0">
                      {retentionMetrics.warrantiesExpiringCount}
                    </span>
                    <span className="text-xs sm:text-[13px] font-semibold text-slate-900 truncate whitespace-nowrap">
                      Siap Renewal
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Row 1: Finansial & Profitabilitas Eksekutif */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            1. Metrik Keuangan & Likuiditas Kas
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 sm:p-4.5 rounded-xl border border-slate-200/80 shadow-2xs card-hover-lift min-w-0">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-semibold text-slate-600 truncate whitespace-nowrap">Kas Masuk (Paid Invoices)</span>
              <DollarSign className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1.5" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono mt-2 tracking-tight truncate whitespace-nowrap">
              {formatRupiah(financials.totalPaid)}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 truncate whitespace-nowrap">Pembayaran terverifikasi lunas</p>
          </div>

          <div className="bg-white p-4 sm:p-4.5 rounded-xl border border-slate-200/80 shadow-2xs card-hover-lift min-w-0">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-semibold text-slate-600 truncate whitespace-nowrap">Total Faktur Diterbitkan</span>
              <Receipt className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1.5" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono mt-2 tracking-tight truncate whitespace-nowrap">
              {formatRupiah(financials.totalIssued)}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 truncate whitespace-nowrap">{financials.invoicesCount} Faktur terbit format FYN</p>
          </div>

          <div className="bg-white p-4 sm:p-4.5 rounded-xl border border-slate-200/80 shadow-2xs card-hover-lift min-w-0">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-semibold text-slate-600 truncate whitespace-nowrap">Piutang Berjalan (Unpaid)</span>
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1.5" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono mt-2 tracking-tight truncate whitespace-nowrap">
              {formatRupiah(financials.totalOutstanding)}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 truncate whitespace-nowrap">Faktur jatuh tempo / menunggu transfer</p>
          </div>

          <div className="bg-white p-4 sm:p-4.5 rounded-xl border border-slate-200/80 shadow-2xs card-hover-lift min-w-0">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-semibold text-slate-600 truncate whitespace-nowrap">Estimasi Laba Bersih</span>
              <TrendingUp className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1.5" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono mt-2 tracking-tight truncate whitespace-nowrap">
              {financials.profitability.profit !== null
                ? formatRupiah(financials.profitability.profit)
                : "Belum Dihitung"}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 truncate whitespace-nowrap">
              {financials.profitability.marginPercent !== null
                ? `Margin Laba: ${financials.profitability.marginPercent}%`
                : "Biaya produksi belum lengkap"}
            </p>
          </div>
        </div>
      </section>

      {/* Row 2: Pipeline Penjualan & CRM */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            2. Pipeline Penjualan & Konversi Prospek
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <div className="bg-white p-4 sm:p-4.5 rounded-xl border border-slate-200/80 shadow-2xs card-hover-lift min-w-0">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold text-slate-600 truncate whitespace-nowrap">Total Prospek Teriset</span>
              <Users className="w-4 h-4 text-blue-600 shrink-0 ml-1.5" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono mt-2 tracking-tight truncate whitespace-nowrap">
              {crmMetrics.totalProspects}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 truncate whitespace-nowrap">Diverifikasi & riset awal wajib terisi</p>
          </div>

          <div className="bg-white p-4 sm:p-4.5 rounded-xl border border-slate-200/80 shadow-2xs card-hover-lift min-w-0">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold text-slate-600 truncate whitespace-nowrap">Deal Aktif & Negosiasi</span>
              <TrendingUp className="w-4 h-4 text-blue-600 shrink-0 ml-1.5" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono mt-2 tracking-tight truncate whitespace-nowrap">
              {crmMetrics.activeDealsCount} Deal
            </div>
            <p className="text-[10px] text-slate-400 mt-1 truncate whitespace-nowrap">
              Potensi Pipeline: {formatRupiah(crmMetrics.pipelineValue)}
            </p>
          </div>

          <div className="bg-white p-4 sm:p-4.5 rounded-xl border border-slate-200/80 shadow-2xs card-hover-lift min-w-0">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold text-slate-600 truncate whitespace-nowrap">Jadwal Kalender Follow-Up</span>
              <Clock className="w-4 h-4 text-slate-400 shrink-0 ml-1.5" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono mt-2 tracking-tight truncate whitespace-nowrap">
              {crmMetrics.followUpDueTodayCount}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 truncate whitespace-nowrap">Sesuai jeda hari kalender (Day 0, +1, +3, +5, +10)</p>
          </div>
        </div>
      </section>

      {/* Row 3: Operasional Delivery Proyek & Retensi Klien */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Proyek Aktif */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-4.5 shadow-2xs space-y-3.5 card-hover-lift">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 whitespace-nowrap">Delivery Operasional Proyek</h3>
              <p className="text-[11px] text-slate-500 whitespace-nowrap">Status milestone dan kesehatan pengerjaan</p>
            </div>
            <Link
              href="/projects"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1 active-press whitespace-nowrap"
            >
              <span>Lihat Proyek</span>
              <span>&rarr;</span>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 sm:p-3 bg-slate-50/80 border border-slate-100 rounded-lg min-w-0">
              <div className="text-[11px] sm:text-xs text-slate-500 font-medium truncate whitespace-nowrap">Proyek Aktif</div>
              <div className="text-base sm:text-lg font-bold text-slate-900 mt-1 font-mono whitespace-nowrap">
                {projectsMetrics.activeProjectsCount}
              </div>
            </div>
            <div className="p-2.5 sm:p-3 bg-slate-50/80 border border-slate-100 rounded-lg min-w-0">
              <div className="text-[11px] sm:text-xs text-slate-500 font-medium truncate whitespace-nowrap">Rata Progress</div>
              <div className="text-base sm:text-lg font-bold text-slate-900 mt-1 font-mono whitespace-nowrap">
                {projectsMetrics.avgProgress}%
              </div>
            </div>
            <div className="p-2.5 sm:p-3 bg-slate-50/80 border border-slate-100 rounded-lg min-w-0">
              <div className="text-[11px] sm:text-xs text-slate-500 font-medium truncate whitespace-nowrap">Task Blocker</div>
              <div className="text-base sm:text-lg font-bold text-slate-900 mt-1 font-mono whitespace-nowrap">
                {projectsMetrics.blockedTasksCount}
              </div>
            </div>
          </div>
        </div>

        {/* Retensi Klien & Maintenance */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-4.5 shadow-2xs space-y-3.5 card-hover-lift">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 whitespace-nowrap">Retensi & Kontrak Pemeliharaan</h3>
              <p className="text-[11px] text-slate-500 whitespace-nowrap">Masa garansi dan recurring revenue</p>
            </div>
            <Link
              href="/client-lifecycle"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1 active-press whitespace-nowrap"
            >
              <span>Buka Lifecycle</span>
              <span>&rarr;</span>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 sm:p-3 bg-slate-50/80 border border-slate-100 rounded-lg min-w-0">
              <div className="text-[11px] sm:text-xs text-slate-500 font-medium truncate whitespace-nowrap">Klien Resmi</div>
              <div className="text-base sm:text-lg font-bold text-slate-900 mt-1 font-mono whitespace-nowrap">
                {retentionMetrics.activeClientsCount}
              </div>
            </div>
            <div className="p-2.5 sm:p-3 bg-slate-50/80 border border-slate-100 rounded-lg min-w-0">
              <div className="text-[11px] sm:text-xs text-slate-500 font-medium truncate whitespace-nowrap">Garansi Habis</div>
              <div className="text-base sm:text-lg font-bold text-slate-900 mt-1 font-mono whitespace-nowrap">
                {retentionMetrics.warrantiesExpiringCount}
              </div>
            </div>
            <div className="p-2.5 sm:p-3 bg-slate-50/80 border border-slate-100 rounded-lg min-w-0">
              <div className="text-[11px] sm:text-xs text-slate-500 font-medium truncate whitespace-nowrap">Maintenance</div>
              <div className="text-base sm:text-lg font-bold text-slate-900 mt-1 font-mono whitespace-nowrap">
                {retentionMetrics.maintenanceActiveCount}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
