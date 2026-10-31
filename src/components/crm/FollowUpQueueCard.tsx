"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Calendar, ExternalLink, CheckCircle2, ChevronRight, Phone, MessageSquare, X } from "lucide-react";
import { Prospect } from "@/modules/crm/types";
import { isFollowUpDueTodayOrOverdue, isFollowUpOverdue } from "@/modules/follow-up/follow-up.service";
import { confirmOutreachSentAction } from "@/modules/crm/crm.actions";
import { formatDateWIB } from "@/lib/date";
import { ModalPortal } from "@/components/common/ModalPortal";

interface FollowUpQueueCardProps {
  prospects: Prospect[];
  onRefresh?: () => void;
}

export function FollowUpQueueCard({ prospects, onRefresh }: FollowUpQueueCardProps) {
  const router = useRouter();
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter prospects that have a follow-up due today or overdue
  const dueProspects = prospects.filter(
    (p) =>
      p.stage !== "CLOSED_WON" &&
      p.stage !== "FAILED" &&
      isFollowUpDueTodayOrOverdue(p.nextFollowUpDate)
  );

  const handleReachNow = (p: Prospect) => {
    const greeting = `Halo ${p.contactName}, salam kenal dari Fynux Digital Solutions...`;
    const waUrl = `https://wa.me/${p.whatsappNumber}?text=${encodeURIComponent(greeting)}`;
    window.open(waUrl, "_blank");
    setSelectedProspect(p);
  };

  const handleConfirmSent = async (prospectId: string) => {
    setIsProcessing(true);
    await confirmOutreachSentAction(prospectId, "Follow-up kalender terkirim.");
    setIsProcessing(false);
    setSelectedProspect(null);
    if (onRefresh) onRefresh();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-6 space-y-4 card-hover-lift">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900">
            Antrean Follow-Up Kalender Hari Ini
          </h2>
        </div>
        <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2.5 py-0.5 rounded-md font-mono border border-blue-200">
          {dueProspects.length} Menunggu Tindakan
        </span>
      </div>

      {dueProspects.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {dueProspects.map((p) => {
            const isOverdue = isFollowUpOverdue(p.nextFollowUpDate);

            return (
              <div
                key={p.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 p-2 rounded-lg transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">
                      {p.companyName}
                    </span>
                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                      {p.followUpStep || "FU"}
                    </span>
                    {isOverdue && (
                      <span className="text-[9px] bg-slate-200 text-slate-800 font-bold px-1.5 py-0.5 rounded border border-slate-300">
                        Terlambat
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Kontak: {p.contactName} (+{p.whatsappNumber})
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                    {p.researchNotes}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => router.push(`/inbox?prospectId=${p.id}`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-semibold rounded-lg shadow-sm transition-all active-press"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Chat di Inbox
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReachNow(p)}
                    title="Buka WhatsApp Web eksternal (wa.me)"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-300 transition-all active-press"
                  >
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                    WA Eksternal
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-xs text-slate-500 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
          <CheckCircle2 className="w-6 h-6 text-blue-600 mx-auto mb-1.5" />
          <span>Tidak ada follow-up jatuh tempo untuk hari ini. Seluruh jadwal aman.</span>
        </div>
      )}

      {/* Confirmation Modal when Reach Now is clicked */}
      {selectedProspect && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] modal-backdrop-clean flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-ios-fade">
            <div className="w-full max-w-md max-h-[88vh] flex flex-col bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden animate-ios-scale relative">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-white">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Konfirmasi Pengiriman Pesan
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1">
                      {selectedProspect.companyName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProspect(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="px-6 py-5 overflow-y-auto flex-1 space-y-3 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  WhatsApp Web dibuka menuju nomor <span className="font-mono font-semibold text-slate-800">+{selectedProspect.whatsappNumber}</span>. Apakah Anda telah mengirimkan pesan tersebut?
                </p>
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-700 leading-relaxed">
                  Menandai terkirim akan mencatat log outreach dan memperbarui siklus jadwal follow-up otomatis.
                </div>
              </div>

              {/* Sticky Action Footer */}
              <div className="px-6 py-4 border-t border-slate-200/80 bg-slate-50/90 rounded-b-2xl flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedProspect(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200/90 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmSent(selectedProspect.id)}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-500/20 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? "Menyimpan..." : "Mark as Sent"}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
