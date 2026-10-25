"use client";

import React from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Briefcase,
  Bot,
  ShieldCheck,
  CheckCircle2,
  PieChart,
  ArrowUpRight,
  Activity,
  Layers,
} from "lucide-react";
import { formatRupiah } from "@/lib/currency";

interface AnalyticsDashboardViewProps {
  stats: {
    totalProspects: number;
    researchedCount: number;
    outreachSentCount: number;
    negotiatingCount: number;
    wonCount: number;
    closingRate: number;
    totalRevenuePaid: number;
    serviceBreakdown: Array<{
      name: string;
      category: string;
      count: number;
      revenue: number;
      color: string;
    }>;
    projectStats: {
      total: number;
      active: number;
      completed: number;
      onTimeRate: number;
      avgDurationDays: number;
    };
    aiAgentMetrics: {
      draftsGenerated: number;
      approvalAccuracy: number;
    };
    retentionMetrics: {
      totalClients: number;
      activeWarranties: number;
      activeMaintenance: number;
      retentionRate: number;
    };
  };
}

export function AnalyticsDashboardView({ stats }: AnalyticsDashboardViewProps) {
  return (
    <div className="space-y-6">
      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Sales Closing Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700 font-mono">
            {stats.closingRate}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {stats.wonCount} Deal Won dari {stats.totalProspects} Prospek Teriset
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Delivery On-Time SLA</span>
            <Briefcase className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-700 font-mono">
            {stats.projectStats.onTimeRate}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Rata-rata siklus pengerjaan: {stats.projectStats.avgDurationDays} hari
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">AI Assistant Assistance</span>
            <Bot className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-purple-700 font-mono">
            {stats.aiAgentMetrics.draftsGenerated} Draf
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Akurasi kepatuhan guardrail: {stats.aiAgentMetrics.approvalAccuracy}%
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Client Retention Rate</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-blue-700 font-mono">
            {stats.retentionMetrics.retentionRate}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {stats.retentionMetrics.activeMaintenance} Kontrak Maintenance Berjalan
          </p>
        </div>
      </div>

      {/* Row 2: Sales Funnel & Service Revenue Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Conversion Funnel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Corong Konversi Penjualan (Sales Funnel)
              </h3>
              <p className="text-[11px] text-slate-500">
                Pipeline prospek teriset hingga tahap penerimaan deal
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-600 font-mono">
              {stats.totalProspects} Prospek
            </span>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>1. Prospek Baru Teriset (100% Wajib Riset)</span>
                <span className="font-mono">{stats.researchedCount}</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-400 rounded-full w-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>2. Outreach Pertama Terkirim (Day 0)</span>
                <span className="font-mono">{stats.outreachSentCount}</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{
                    width: `${
                      stats.researchedCount > 0
                        ? (stats.outreachSentCount / stats.researchedCount) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>3. Negosiasi & Proposal Penawaran</span>
                <span className="font-mono">{stats.negotiatingCount}</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{
                    width: `${
                      stats.researchedCount > 0
                        ? (stats.negotiatingCount / stats.researchedCount) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>4. Kesepakatan Diterima (Deal Won)</span>
                <span className="font-mono">{stats.wonCount}</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${
                      stats.researchedCount > 0
                        ? (stats.wonCount / stats.researchedCount) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown by Catalog Category */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Distribusi Pendapatan per Kategori Layanan
              </h3>
              <p className="text-[11px] text-slate-500">
                Porsi kontribusi katalog layanan Fynux Digital Solutions
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 font-mono">
              {formatRupiah(stats.totalRevenuePaid)}
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {stats.serviceBreakdown.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-bold text-slate-800">{item.name}</span>
                  </div>
                  <span className="font-black font-mono text-slate-900">
                    {formatRupiah(item.revenue)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 pl-4">
                  <span>Kategori: {item.category}</span>
                  <span>{item.count} Paket Terjual</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: SLA & AI Assistance Guardrail Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            Kecepatan Delivery & Resolusi Garansi
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Metrik operasional serah terima proyek dan penanganan keluhan bug garansi:
          </p>
          <div className="grid grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500 text-[10px]">Waktu Respon Klaim</span>
              <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                &lt; 24 Jam
              </div>
              <span className="text-[10px] text-emerald-600">Sesuai SLA Garansi</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500 text-[10px]">Penyelesaian Patch Bug</span>
              <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                100%
              </div>
              <span className="text-[10px] text-indigo-600">Terverifikasi normal</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Bot className="w-4 h-4 text-purple-600" />
            AI Guardrail & Kepatuhan Komersial
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            AI Sales Agent dilarang keras membuat komitmen harga atau termin tanpa tiket persetujuan resmi Owner:
          </p>
          <div className="grid grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500 text-[10px]">Diverifikasi Manusia</span>
              <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                100% Human-in-Loop
              </div>
              <span className="text-[10px] text-emerald-600">Sales mereview sebelum kirim</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500 text-[10px]">Tiket Approval Terpicu</span>
              <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                Otomatis
              </div>
              <span className="text-[10px] text-purple-600">Saat terdeteksi diskon/komitmen</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
