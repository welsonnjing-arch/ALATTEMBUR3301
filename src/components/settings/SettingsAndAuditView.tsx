"use client";

import React, { useState } from "react";
import {
  Settings,
  Calendar,
  Users,
  Shield,
  FileText,
  Search,
  Filter,
  CreditCard,
  Bot,
  Clock,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { AuditLogEntry } from "@/lib/logger";
import { ActivityCategory } from "@/types/enums";
import { formatDateWIB } from "@/lib/date";

interface SettingsAndAuditViewProps {
  initialLogs: AuditLogEntry[];
  currentUserRole?: string;
}

export function SettingsAndAuditView({
  initialLogs,
  currentUserRole = "OWNER",
}: SettingsAndAuditViewProps) {
  const [activeTab, setActiveTab] = useState<"SETTINGS" | "AUDIT_LOGS">("AUDIT_LOGS");
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const filteredLogs = initialLogs.filter((log) => {
    const matchesCategory =
      selectedCategory === "ALL" || log.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      log.action.toLowerCase().includes(q) ||
      (log.actorEmail && log.actorEmail.toLowerCase().includes(q)) ||
      (log.targetType && log.targetType.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  const getCategoryColor = (cat: ActivityCategory) => {
    switch (cat) {
      case "FINANCE":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "CRM":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "PROJECT":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "SECURITY":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "AI":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "SYSTEM":
        return "bg-purple-100 text-purple-800 border-purple-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("AUDIT_LOGS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "AUDIT_LOGS"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Audit Trail & Activity Log ({initialLogs.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("SETTINGS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "SETTINGS"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          Konfigurasi Bisnis & Aturan Sistem
        </button>
      </div>

      {/* TAB 1: AUDIT LOGS */}
      {activeTab === "AUDIT_LOGS" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Log Audit & Jejak Aktivitas Terstruktur
              </h2>
              <p className="text-xs text-slate-500">
                Catatan immutable aktivitas seluruh aktor sistem (siapa melakukan apa, kapan, dan detail objek).
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari aksi, aktor, target..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            {(
              ["ALL", "FINANCE", "CRM", "PROJECT", "AI", "SYSTEM", "SECURITY"] as const
            ).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-slate-900 text-white font-semibold"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Log Table / List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Waktu (WIB)</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Aksi / Aktivitas</th>
                    <th className="py-3 px-4">Aktor / Email</th>
                    <th className="py-3 px-4">Target Objek</th>
                    <th className="py-3 px-4 text-right">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                        {formatDateWIB(log.timestamp)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${getCategoryColor(
                            log.category
                          )}`}
                        >
                          {log.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {log.actorEmail || log.actorId}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {log.targetType || "-"}: {log.targetId || "-"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
                        >
                          Metadata &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredLogs.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-slate-400 text-xs italic"
                      >
                        Tidak ada catatan log aktivitas yang cocok dengan filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SETTINGS & CONFIGURATION */}
      {activeTab === "SETTINGS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Follow-up rules */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm">
              <Calendar className="w-4 h-4" />
              Aturan Kalender Follow-Up (Hari Kalender)
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Jadwal interval perhitungan tanggal follow-up otomatis berbasis hari kalender (bukan hari kerja):
            </p>
            <div className="space-y-2 text-xs pt-1">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Initial Contact:</span>
                <span className="font-semibold text-slate-900">Day 0 (Setelah riset disetujui)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Follow-Up #1:</span>
                <span className="font-semibold text-slate-900">+1 Hari dari Day 0</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Follow-Up #2:</span>
                <span className="font-semibold text-slate-900">+3 Hari dari FU #1</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Follow-Up #3:</span>
                <span className="font-semibold text-slate-900">+5 Hari dari FU #2</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-600 font-medium">Auto-Status Failed:</span>
                <span className="font-semibold text-slate-900">+10 Hari dari FU #3</span>
              </div>
            </div>
          </div>

          {/* Payment Gateway & Invoicing */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm">
              <CreditCard className="w-4 h-4" />
              Integrasi Pembayaran & Rekening Resmi
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Konfigurasi saluran pembayaran resmi Fynux Digital Solutions:
            </p>
            <div className="space-y-3 text-xs pt-1">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>Transfer Bank BCA (Manual Verifikasi)</span>
                  <span className="text-emerald-600 text-[10px]">AKTIF</span>
                </div>
                <div className="text-slate-500 text-[11px]">
                  No. Rekening: <strong>1690466455</strong> a.n Faiz Aditama
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>Duitku Payment Gateway (Automated)</span>
                  <span className="text-emerald-600 text-[10px]">AKTIF</span>
                </div>
                <div className="text-slate-500 text-[11px]">
                  Metode: QRIS Dinamis & Virtual Account (BCA, Mandiri, BNI, BRI)
                </div>
              </div>
            </div>
          </div>

          {/* AI Sales Assistant Guardrails */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 text-purple-700 font-semibold text-sm">
              <Bot className="w-4 h-4" />
              AI Sales Agent (Gemini 1.5 Flash)
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Sistem AI asisten percakapan WhatsApp beroperasi dengan batas pengamanan ketat:
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                <span>Hanya merekomendasikan harga resmi dari Service Catalog</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                <span>Wajib menyetujui tiket approval jika klien menawar diskon</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                <span>Deterministic Fallback aktif jika API kuota terbatas</span>
              </div>
            </div>
          </div>

          {/* RBAC & Governance */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm">
              <Shield className="w-4 h-4" />
              Struktur Akses Peran & Wewenang
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tiga hierarki peran baku dalam Fynux OS:
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <strong className="text-purple-700">1. Owner (Faiz Aditama):</strong>
                <p className="text-slate-600 mt-0.5">Akses penuh seluruh modul, approval komersial, command center & analitik margin.</p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <strong className="text-amber-700">2. Sales:</strong>
                <p className="text-slate-600 mt-0.5">Riset prospek, Shared Inbox WA, draft proposal, dan antrean follow-up.</p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <strong className="text-blue-700">3. Developer:</strong>
                <p className="text-slate-600 mt-0.5">Workspace pengerjaan proyek, PIC task mandiri, link aset Google Drive/repo.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* METADATA INSPECTOR MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Metadata Audit Log: {selectedLog.action}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  {formatDateWIB(selectedLog.timestamp)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-2 py-1"
              >
                Tutup
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-500">ID Log:</span>
                <div className="font-mono text-slate-800">{selectedLog.id}</div>
              </div>
              <div>
                <span className="text-slate-500">Aktor:</span>
                <div className="font-semibold text-slate-800">
                  {selectedLog.actorEmail || selectedLog.actorId}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Kategori & Target:</span>
                <div className="font-mono text-slate-800">
                  {selectedLog.category} &rarr; {selectedLog.targetType || "N/A"}: {selectedLog.targetId || "N/A"}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Metadata Payload:</span>
                <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto mt-1 max-h-56">
                  {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
