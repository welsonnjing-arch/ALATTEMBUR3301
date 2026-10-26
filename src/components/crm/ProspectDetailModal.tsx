"use client";

import { useState } from "react";
import {
  X,
  Phone,
  Building2,
  Calendar,
  MessageSquare,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  FileEdit,
  Send,
  Layers,
  Trash2,
} from "lucide-react";
import { Prospect } from "@/modules/crm/types";
import { FailedReason, NextAction, PipelineStage } from "@/types/enums";
import {
  confirmOutreachSentAction,
  deleteProspectAction,
  reactivateProspectAction,
  recordClientReplyAction,
  updateProspectStatusAction,
} from "@/modules/crm/crm.actions";
import { formatDateTimeWIB, formatDateWIB } from "@/lib/date";

interface ProspectDetailModalProps {
  prospect: Prospect | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export function ProspectDetailModal({
  prospect,
  isOpen,
  onClose,
  onRefresh,
}: ProspectDetailModalProps) {
  if (!isOpen || !prospect) return null;

  const [activeTab, setActiveTab] = useState<"DETAILS" | "TIMELINE" | "UPDATE">("DETAILS");
  const [selectedStage, setSelectedStage] = useState<PipelineStage>(prospect.stage);
  const [selectedNextAction, setSelectedNextAction] = useState<NextAction>(prospect.nextAction);
  const [failedReason, setFailedReason] = useState<FailedReason>(prospect.failedReason || "NO_RESPONSE");
  const [replyInput, setReplyInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMarkSentDialog, setShowMarkSentDialog] = useState(false);
  const [outreachNotes, setOutreachNotes] = useState("");

  const handleReachNow = () => {
    // 1. Buat draf pesan pembuka santun berbasis hasil riset
    const greeting = `Halo ${prospect.contactName}, salam kenal dari Fynux Digital Solutions. Kami sempat meninjau perkembangan ${prospect.companyName}...`;
    const waUrl = `https://wa.me/${prospect.whatsappNumber}?text=${encodeURIComponent(greeting)}`;

    // Buka WhatsApp Web di tab baru
    window.open(waUrl, "_blank");

    // Buka dialog konfirmasi pengiriman
    setShowMarkSentDialog(true);
  };

  const handleConfirmSent = async () => {
    setIsProcessing(true);
    await confirmOutreachSentAction(prospect.id, outreachNotes);
    setIsProcessing(false);
    setShowMarkSentDialog(false);
    onRefresh();
  };

  const handleUpdateStatus = async () => {
    setIsProcessing(true);
    await updateProspectStatusAction(
      prospect.id,
      selectedStage,
      selectedNextAction,
      selectedStage === "FAILED" ? failedReason : undefined
    );
    setIsProcessing(false);
    onRefresh();
  };

  const handleRecordReply = async () => {
    if (!replyInput.trim()) return;
    setIsProcessing(true);
    await recordClientReplyAction(prospect.id, replyInput);
    setReplyInput("");
    setIsProcessing(false);
    onRefresh();
  };

  const handleReactivate = async () => {
    if (!confirm("Aktifkan kembali prospek ini dari status Failed?")) return;
    setIsProcessing(true);
    await reactivateProspectAction(prospect.id, "Reaktivasi prospek oleh user");
    setIsProcessing(false);
    onRefresh();
  };

  const handleDelete = async () => {
    const confirmMsg = `Apakah Anda yakin ingin menghapus data prospek "${prospect.companyName}"?\n\nData prospek akan dihapus dari sistem CRM.`;
    if (!window.confirm(confirmMsg)) return;

    setIsProcessing(true);
    const res = await deleteProspectAction(prospect.id);
    setIsProcessing(false);

    if (res.success) {
      onRefresh();
    } else {
      alert(res.error || "Gagal menghapus prospek.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                Stage: {prospect.stage}
              </span>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Action: {prospect.nextAction}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              {prospect.companyName}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isProcessing}
              title="Hapus data prospek ini"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 border-b border-slate-200 flex gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("DETAILS")}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === "DETAILS"
                ? "border-indigo-600 text-indigo-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Konteks Riset & Kontak
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("TIMELINE")}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === "TIMELINE"
                ? "border-indigo-600 text-indigo-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Jadwal Follow-Up ({prospect.followUpLogs?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("UPDATE")}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === "UPDATE"
                ? "border-indigo-600 text-indigo-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Perbarui Status / Respon
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
          {/* TAB 1: DETAILS */}
          {activeTab === "DETAILS" && (
            <div className="space-y-4">
              {/* Kontak & Action Bar */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-slate-500">Kontak Utama</div>
                  <div className="text-sm font-bold text-slate-900">{prospect.contactName}</div>
                  <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-1.5 font-mono">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    +{prospect.whatsappNumber}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReachNow}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Reach Now via WhatsApp
                  </button>
                </div>
              </div>

              {/* Research Notes Box */}
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 text-indigo-700 font-semibold text-xs mb-2">
                  <Sparkles className="w-4 h-4" />
                  Catatan Riset Bebas (Konteks Peluang Bisnis)
                </div>
                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {prospect.researchNotes}
                </p>
              </div>

              {/* Grid Detail Pelengkap */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 font-medium">Pain Points Teridentifikasi:</span>
                  <div className="text-slate-800 font-semibold mt-1">
                    {prospect.painPoints || "Belum dicatat"}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 font-medium">Potensi Layanan Ditawarkan:</span>
                  <div className="text-slate-800 font-semibold mt-1">
                    {prospect.potentialServices || "Basic Website"}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 font-medium">Sales Penanggung Jawab:</span>
                  <div className="text-slate-800 font-semibold mt-1">
                    {prospect.assignedSalesName || "Faiz Aditama (Owner)"}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 font-medium">Jadwal Follow-Up Berikutnya:</span>
                  <div className="text-slate-800 font-semibold mt-1">
                    {formatDateWIB(prospect.nextFollowUpDate)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TIMELINE */}
          {activeTab === "TIMELINE" && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-900">
                <span className="font-semibold">Aturan Mesin Follow-Up:</span> Menggunakan interval kalender (Hari 0 $\rightarrow$ +1 $\rightarrow$ +3 $\rightarrow$ +5 $\rightarrow$ +10 Hari Failed jika tanpa respon).
              </div>

              {prospect.followUpLogs && prospect.followUpLogs.length > 0 ? (
                <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                  {prospect.followUpLogs.map((log) => (
                    <div key={log.id} className="relative flex items-start gap-4 pl-8">
                      <span className="absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full bg-indigo-600 border-2 border-white" />
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">
                            {log.step} ({log.channel})
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatDateTimeWIB(log.confirmedSentAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{log.notes}</p>
                        <div className="text-[10px] text-slate-400 mt-2 font-medium">
                          Dikonfirmasi oleh: {log.sentByUserName}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  Belum ada catatan pengiriman pesan outreach untuk prospek ini.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: UPDATE STATUS & RECORD REPLY */}
          {activeTab === "UPDATE" && (
            <div className="space-y-6">
              {/* Box 1: Catat Balasan Prospek */}
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 font-semibold text-xs">
                  <MessageSquare className="w-4 h-4 text-emerald-700" />
                  Catat Balasan / Respon Masuk dari Prospek
                </div>
                <p className="text-[11px] text-slate-600">
                  Memasukkan balasan prospek akan menghentikan siklus no-response secara otomatis dan mengubah stage ke Responded.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Contoh: Halo mas, boleh kirimkan proposal dan rincian portofolionya?"
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleRecordReply}
                    disabled={isProcessing || !replyInput.trim()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    Simpan Respon
                  </button>
                </div>
              </div>

              {/* Box 2: Perbarui Stage & Next Action */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-4">
                <div className="text-xs font-bold text-slate-900">
                  Perbarui Pipeline Stage & Next Action
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pipeline Stage
                    </label>
                    <select
                      value={selectedStage}
                      onChange={(e) => setSelectedStage(e.target.value as PipelineStage)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                    >
                      <option value="NEW">New (Baru)</option>
                      <option value="CONTACTED">Contacted (Sudah Dihubungi)</option>
                      <option value="RESPONDED">Responded (Membalas)</option>
                      <option value="ENGAGED">Engaged (Percakapan Aktif)</option>
                      <option value="QUALIFIED">Qualified (Meeting Terjadwal)</option>
                      <option value="NEGOTIATION">Negotiation (Negosiasi)</option>
                      <option value="PENDING">Pending (Minta Dihubungi Nanti)</option>
                      <option value="CLOSED_WON">Closed Won (Deal Diterima)</option>
                      <option value="FAILED">Failed (Gagal / Berakhir)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Next Action
                    </label>
                    <select
                      value={selectedNextAction}
                      onChange={(e) => setSelectedNextAction(e.target.value as NextAction)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                    >
                      <option value="REACH_NOW">Reach Now</option>
                      <option value="WAITING_FOR_RESPONSE">Waiting for Response</option>
                      <option value="REPLY_TO_CLIENT">Reply to Client</option>
                      <option value="PREPARE_PROPOSAL">Prepare Proposal</option>
                      <option value="SCHEDULE_MEETING">Schedule Meeting</option>
                      <option value="FOLLOW_UP_SCHEDULED">Follow Up on Scheduled Date</option>
                      <option value="NO_ACTION_REQUIRED">No Action Required</option>
                    </select>
                  </div>
                </div>

                {selectedStage === "FAILED" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Alasan Kegagalan (Failed Reason)
                    </label>
                    <select
                      value={failedReason}
                      onChange={(e) => setFailedReason(e.target.value as FailedReason)}
                      className="w-full px-3 py-2 text-xs border border-rose-300 rounded-lg bg-rose-50 text-rose-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    >
                      <option value="NO_RESPONSE">No Response (Tidak Membalas)</option>
                      <option value="REJECTED">Rejected (Menolak Penawaran)</option>
                      <option value="BUDGET">Budget (Kendala Anggaran)</option>
                      <option value="NOT_A_FIT">Not a Fit (Bukan Target Pasar)</option>
                      <option value="COMPETITOR">Competitor (Memilih Vendor Lain)</option>
                      <option value="ALREADY_HAVE_PROVIDER">Already Have Provider (Sudah Punya Website)</option>
                      <option value="TIMELINE">Timeline (Belum Prioritas Sekarang)</option>
                      <option value="OTHER">Other (Alasan Lainnya)</option>
                    </select>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  {prospect.stage === "FAILED" ? (
                    <button
                      type="button"
                      onClick={handleReactivate}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reaktivasi Prospek
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus Prospek
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleUpdateStatus}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DIALOG KONFIRMASI PENGIRIMAN OUTREACH (MARK AS SENT) */}
      {showMarkSentDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">
                Konfirmasi Pengiriman Pesan
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              WhatsApp Web telah dibuka. Apakah pesan outreach telah benar-benar Anda kirimkan kepada kontak?
            </p>
            <p className="text-[11px] text-indigo-700 bg-indigo-50 p-2.5 rounded-lg border border-indigo-100">
              Mengklik <strong>&quot;Mark as Sent&quot;</strong> akan mencatat riwayat terverifikasi dan menjadwalkan interval follow-up berikutnya.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Outreach (Opsional)
              </label>
              <input
                type="text"
                placeholder="Misal: Dikirim ke Pak Bambang pukul 14:30"
                value={outreachNotes}
                onChange={(e) => setOutreachNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowMarkSentDialog(false)}
                className="px-3 py-1.5 border border-slate-300 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50"
              >
                Belum Terkirim
              </button>
              <button
                type="button"
                onClick={handleConfirmSent}
                disabled={isProcessing}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Mark as Sent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
