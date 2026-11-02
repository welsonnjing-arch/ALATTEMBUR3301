"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { playClickSound } from "@/lib/audio";

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  className?: string;
}

export function Pagination({
  currentPage,
  totalItems,
  pageSize = 25,
  onPageChange,
  itemLabel = "data",
  className = "",
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalItems);

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      playClickSound("soft");
      onPageChange(page);
    }
  };

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  };

  const pages = getPageNumbers();

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-white/95 border border-slate-200/80 rounded-xl shadow-2xs text-xs ${className}`}
    >
      {/* Information text */}
      <div className="text-slate-500 font-medium select-none">
        Menampilkan{" "}
        <span className="font-semibold text-slate-800 font-mono">
          {startIndex}
        </span>{" "}
        -{" "}
        <span className="font-semibold text-slate-800 font-mono">
          {endIndex}
        </span>{" "}
        dari{" "}
        <span className="font-semibold text-slate-900 font-mono">
          {totalItems}
        </span>{" "}
        {itemLabel}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1.5 self-end sm:self-auto select-none">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Halaman Sebelumnya"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200/90 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active-press font-medium"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Prev</span>
        </button>

        {/* Numeric Page Buttons */}
        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-slate-400 font-mono"
                >
                  ...
                </span>
              );
            }

            const pageNum = Number(p);
            const isActive = pageNum === currentPage;

            return (
              <button
                key={`page-${pageNum}`}
                type="button"
                onClick={() => handlePageClick(pageNum)}
                aria-current={isActive ? "page" : undefined}
                className={`min-w-[30px] h-[30px] px-2 flex items-center justify-center rounded-lg text-xs font-mono transition-all active-press ${
                  isActive
                    ? "bg-slate-900 text-white font-bold shadow-xs border border-slate-900"
                    : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 font-medium"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Halaman Berikutnya"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200/90 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active-press font-medium"
        >
          <span className="hidden xs:inline">Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
