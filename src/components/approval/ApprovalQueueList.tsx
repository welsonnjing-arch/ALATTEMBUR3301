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
import { ModalPortal } from "@/components/common/ModalPortal";
import { Pagination } from "@/components/common/Pagination";

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
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 25;

  const filtered = requests.filter((r) =>
    statusFilter === "ALL" ? true : r.status === statusFilter
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRequests = filtered.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE
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
        return "bg-slate-200 text-slate-800 border-slate-300 font-medium";
      case "APPROVED":
        return "bg-slate-900 text-white border-slate-800 font-semibold";
      case "REJECTED":
        return "bg-slate-100 text-slate-500 border-slate-200 line-through";
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
              onClick={() => {
                setStatusFilter(tab);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                isActive
                  ? "bg-slate-900 text-white font-semibold shadow-sm"
                  : "text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              <span>{tab === "ALL" ? "Semua Permohonan" : tab}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                  isActive
                    ? "bg-slate-800 text-slate-200"
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
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {paginatedRequests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 space-y-3 card-hover-lift"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-mono">
                    {req.type}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{req.title}</h3>
                </div>

                <span
                  className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md font-mono border ${getStatusBadge(
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
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
                    >
                      Tolak
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenReview(req, "APPROVED")}
                      className="px-4 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
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

        {/* Pagination Controls for Approval Requests */}
        <div className="pt-2">
          <Pagination
            currentPage={safeCurrentPage}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            itemLabel="permohonan"
          />
        </div>
      </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-blue-600 mx-auto mb-2" />
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
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] modal-backdrop-clean flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-ios-fade">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-md max-h-[88vh] flex flex-col overflow-hidden animate-ios-scale relative">
            {/* Header */}
            <div className="shrink-0 bg-white px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {reviewDecision === "APPROVED" ? "Setujui Permohonan" : "Tolak Permohonan"}
              </h3>
              <button
                type="button"
                onClick={() => setActiveRequest(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReview} className="flex flex-col min-h-0 flex-1">
              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                  Anda akan <strong>{reviewDecision === "APPROVED" ? "menyetujui" : "menolak"}</strong> permohonan: &quot;{activeRequest.title}&quot;.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catatan Review Owner (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Disetujui dengan syarat pembayaran DP minimal 50%..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Sticky Action Footer */}
              <div className="shrink-0 px-6 py-4 border-t border-slate-200/80 bg-slate-50/90 rounded-b-2xl flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveRequest(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-slate-200/90 text-slate-700 text-xs font-semibold rounded-lg bg-white hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? "Menyimpan..." : "Konfirmasi Keputusan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </ModalPortal>
    )}
  </div>
);
}
