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
      {/* Top Welcome & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-xl border border-slate-800">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
            Fynux OS • Executive Control
          </span>
          <h1 className="text-2xl font-black mt-2 tracking-tight">
            Command Center Faiz Aditama
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Pusat kendali komprehensif bisnis Fynux Digital Solutions: visibilitas keuangan real-time, pipeline penjualan, delivery proyek, dan governance approval.
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap gap-2">
          <Link
            href="/finance"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Receipt className="w-3.5 h-3.5" />
            Invoice & Kas
          </Link>
          <Link
            href="/crm"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            CRM & Pipeline
          </Link>
          <Link
            href="/approval-queue"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            Persetujuan ({governanceMetrics.pendingApprovalsCount})
          </Link>
        </div>
      </div>

      {/* Critical Attention Banners */}
      {(governanceMetrics.pendingApprovalsCount > 0 ||
        projectsMetrics.blockedTasksCount > 0 ||
        crmMetrics.followUpDueTodayCount > 0 ||
        retentionMetrics.warrantiesExpiringCount > 0) && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-800 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Perhatian & Tindakan Kritis Hari Ini
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1">
            {governanceMetrics.pendingApprovalsCount > 0 && (
              <Link
                href="/approval-queue"
                className="p-3 bg-white rounded-xl border border-amber-200 shadow-xs hover:border-amber-400 transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="text-[10px] text-slate-500">Persetujuan Komersial</div>
                  <div className="text-sm font-bold text-rose-600">
                    {governanceMetrics.pendingApprovalsCount} Menunggu Keputusan
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
              </Link>
            )}

            {projectsMetrics.blockedTasksCount > 0 && (
              <Link
                href="/tasks"
                className="p-3 bg-white rounded-xl border border-amber-200 shadow-xs hover:border-amber-400 transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="text-[10px] text-slate-500">Task Terkendala (Blocked)</div>
                  <div className="text-sm font-bold text-amber-700">
                    {projectsMetrics.blockedTasksCount} Task Membutuhkan Aksi
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700" />
              </Link>
            )}

            {crmMetrics.followUpDueTodayCount > 0 && (
              <Link
                href="/crm"
                className="p-3 bg-white rounded-xl border border-amber-200 shadow-xs hover:border-amber-400 transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="text-[10px] text-slate-500">Antrean Follow-Up CRM</div>
                  <div className="text-sm font-bold text-indigo-700">
                    {crmMetrics.followUpDueTodayCount} Prospek Terjadwal
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-700" />
              </Link>
            )}

            {retentionMetrics.warrantiesExpiringCount > 0 && (
              <Link
                href="/client-lifecycle"
                className="p-3 bg-white rounded-xl border border-amber-200 shadow-xs hover:border-amber-400 transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="text-[10px] text-slate-500">Garansi Segera Habis (&lt;30h)</div>
                  <div className="text-sm font-bold text-purple-700">
                    {retentionMetrics.warrantiesExpiringCount} Siap Ditawari Maintenance
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-purple-700" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Row 1: Finansial & Profitabilitas Eksekutif */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          1. Metrik Keuangan & Likuiditas Kas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500">Kas Masuk (Paid Invoices)</span>
            <div className="text-2xl font-black text-emerald-700 font-mono mt-2">
              {formatRupiah(financials.totalPaid)}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Pembayaran terverifikasi lunas</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500">Total Faktur Diterbitkan</span>
            <div className="text-2xl font-black text-slate-900 font-mono mt-2">
              {formatRupiah(financials.totalIssued)}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">{financials.invoicesCount} Faktur terbit format FYN</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500">Piutang Berjalan (Unpaid)</span>
            <div className="text-2xl font-black text-amber-600 font-mono mt-2">
              {formatRupiah(financials.totalOutstanding)}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Faktur jatuh tempo / menunggu transfer</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500">Estimasi Laba Bersih</span>
            <div className="text-2xl font-black text-indigo-700 font-mono mt-2">
              {financials.profitability.profit !== null
                ? formatRupiah(financials.profitability.profit)
                : "Belum Dihitung"}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {financials.profitability.marginPercent !== null
                ? `Margin Laba: ${financials.profitability.marginPercent}%`
                : "Biaya produksi belum lengkap"}
            </p>
          </div>
        </div>
      </div>

      {/* Row 2: Pipeline Penjualan & CRM */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          2. Pipeline Penjualan & Konversi Prospek
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Total Prospek Teriset</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-2">
              {crmMetrics.totalProspects}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Diverifikasi & riset awal wajib terisi</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Deal Aktif & Negosiasi</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700 font-mono mt-2">
              {crmMetrics.activeDealsCount} Deal
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Potensi Pipeline: {formatRupiah(crmMetrics.pipelineValue)}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Jadwal Kalender Follow-Up</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-700 font-mono mt-2">
              {crmMetrics.followUpDueTodayCount}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Sesuai jeda hari kalender (Day 0, +1, +3, +5, +10)</p>
          </div>
        </div>
      </div>

      {/* Row 3: Operasional Delivery Proyek & Retensi Klien */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Proyek Aktif */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Delivery Operasional Proyek</h3>
              <p className="text-[11px] text-slate-500">Status milestone dan kesehatan pengerjaan</p>
            </div>
            <Link
              href="/projects"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Lihat Proyek &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-xs text-slate-500 font-medium">Proyek Aktif</div>
              <div className="text-lg font-black text-slate-900 mt-1 font-mono">
                {projectsMetrics.activeProjectsCount}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-xs text-slate-500 font-medium">Rata-rata Progress</div>
              <div className="text-lg font-black text-indigo-600 mt-1 font-mono">
                {projectsMetrics.avgProgress}%
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-xs text-slate-500 font-medium">Task Terkendala</div>
              <div className="text-lg font-black text-rose-600 mt-1 font-mono">
                {projectsMetrics.blockedTasksCount}
              </div>
            </div>
          </div>
        </div>

        {/* Retensi Klien & Maintenance */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Retensi & Kontrak Pemeliharaan</h3>
              <p className="text-[11px] text-slate-500">Masa garansi dan recurring revenue</p>
            </div>
            <Link
              href="/client-lifecycle"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Buka Lifecycle &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-xs text-slate-500 font-medium">Klien Resmi</div>
              <div className="text-lg font-black text-slate-900 mt-1 font-mono">
                {retentionMetrics.activeClientsCount}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-xs text-slate-500 font-medium">Garansi Segera Habis</div>
              <div className="text-lg font-black text-amber-600 mt-1 font-mono">
                {retentionMetrics.warrantiesExpiringCount}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-xs text-slate-500 font-medium">Kontrak Maintenance</div>
              <div className="text-lg font-black text-purple-600 mt-1 font-mono">
                {retentionMetrics.maintenanceActiveCount}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
