"use client";

import { useState } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  AlertTriangle,
  FileText,
  DollarSign,
} from "lucide-react";
import { ApprovalRequest } from "@/modules/approval/types";
import { ApprovalStatus } from "@/types/enums";
import { reviewApprovalAction } from "@/modules/approval/approval.actions";
import { formatDateTimeWIB } from "@/lib/date";

interface ApprovalQueueListProps {
  initialRequests: ApprovalRequest[];
  isOwner?: boolean;
}

export function ApprovalQueueList({
  initialRequests,
  isOwner = true,
}: ApprovalQueueListProps) {
  const [requests, setRequests] = useState<ApprovalRequest[]>(initialRequests);
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | "ALL">("ALL");
  const [activeRequest, setActiveRequest] = useState<ApprovalRequest | null>(null);
  const [reviewDecision, setReviewDecision] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = requests.filter((r) =>
    statusFilter === "ALL" ? true : r.status === statusFilter
  );

  const handleOpenReview = (
    req: ApprovalRequest,
    decision: "APPROVED" | "REJECTED"
  ) => {
    setActiveRequest(req);
    setReviewDecision(decision);
    setReviewNotes("");
  };

  const handleConfirmReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequest) return;

    setIsSubmitting(true);
    const res = await reviewApprovalAction(
      activeRequest.id,
      reviewDecision,
      reviewNotes
    );

    if (res.success) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === activeRequest.id
            ? {
                ...r,
                status: reviewDecision,
                reviewedAt: new Date().toISOString(),
                reviewNotes: reviewNotes || undefined,
              }
            : r
        )
      );
      setActiveRequest(null);
    }
    setIsSubmitting(false);
  };

  const getStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "APPROVED":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "REJECTED":
        return "bg-rose-100 text-rose-800 border-rose-200";
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs">
        {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((tab) => {
          const isActive = statusFilter === tab;
          const count =
            tab === "ALL"
              ? requests.length
              : requests.filter((r) => r.status === tab).length;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                isActive
                  ? "bg-indigo-600 text-white font-semibold shadow-sm"
                  : "text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              <span>{tab === "ALL" ? "Semua Permohonan" : tab}</span>
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

      {/* List Permohonan */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                    {req.type}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{req.title}</h3>
                </div>

                <span
                  className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(
                    req.status
                  )}`}
                >
                  {req.status}
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                {req.description}
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 gap-2">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Diajukan oleh: <strong>{req.requestedByUserName}</strong></span>
                  <span>·</span>
                  <span>{formatDateTimeWIB(req.createdAt)}</span>
                </div>

                {req.status === "PENDING" && isOwner && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenReview(req, "REJECTED")}
                      className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg border border-rose-200 transition-colors"
                    >
                      Tolak
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenReview(req, "APPROVED")}
                      className="px-4 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                    >
                      Setujui
                    </button>
                  </div>
                )}

                {req.status !== "PENDING" && (
                  <div className="text-[11px] text-slate-500">
                    Ditinjau pada: {formatDateTimeWIB(req.reviewedAt)}{" "}
                    {req.reviewNotes && `(Catatan: ${req.reviewNotes})`}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800">
            Antrean Persetujuan Bersih
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Tidak ada permohonan tindakan komersial pada status ini.
          </p>
        </div>
      )}

      {/* MODAL KONFIRMASI REVIEW OLEH OWNER */}
      {activeRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {reviewDecision === "APPROVED" ? "Setujui Permohonan" : "Tolak Permohonan"}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Anda akan <strong>{reviewDecision === "APPROVED" ? "menyetujui" : "menolak"}</strong> permohonan: &quot;{activeRequest.title}&quot;.
            </p>

            <form onSubmit={handleConfirmReview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Review Owner (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Disetujui dengan syarat pembayaran DP minimal 50%..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveRequest(null)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-1.5 text-white text-xs font-semibold rounded-lg shadow-sm ${
                    reviewDecision === "APPROVED"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {isSubmitting ? "Menyimpan..." : "Konfirmasi Keputusan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
