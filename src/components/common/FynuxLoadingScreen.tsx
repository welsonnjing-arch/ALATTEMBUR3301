"use client";

import React from "react";
import { FynuxLogo } from "@/components/brand/FynuxLogo";

interface FynuxLoadingScreenProps {
  message?: string;
  submessage?: string;
  fullScreen?: boolean;
}

export function FynuxLoadingScreen({
  message = "Memuat Fynux OS...",
  submessage = "Menyiapkan ruang kerja sistem",
  fullScreen = true,
}: FynuxLoadingScreenProps) {
  const containerClasses = fullScreen
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50/95 backdrop-blur-xs select-none animate-ios-fade"
    : "min-h-[360px] w-full flex flex-col items-center justify-center p-8 select-none animate-ios-fade";

  return (
    <div
      role="status"
      aria-live="polite"
      className={containerClasses}
    >
      <div className="flex flex-col items-center max-w-sm text-center px-6">
        {/* Brand Squircle Box with elegant ambient brand glow */}
        <div className="relative mb-5">
          <div className="w-14 h-14 rounded-xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-center">
            <FynuxLogo size={40} showGlow={false} />
          </div>
          {/* Ambient glow in Fynux brand colors (#2563eb to #7c3aed) */}
          <div
            className="absolute -inset-2 rounded-xl bg-gradient-to-tr from-blue-600/25 via-indigo-500/20 to-purple-600/25 blur-md -z-10 animate-pulse"
            aria-hidden="true"
          />
        </div>

        {/* Clean Contextual Typography */}
        <h2 className="text-base font-semibold tracking-tight text-slate-900">
          {message}
        </h2>
        {submessage && (
          <p className="mt-1 text-xs text-slate-500 font-normal">
            {submessage}
          </p>
        )}

        {/* Sleek Minimalist Indeterminate Progress Bar */}
        <div className="mt-5 w-48 h-1 bg-slate-200/80 rounded-full overflow-hidden relative">
          <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-fynux-progress" />
        </div>
      </div>
    </div>
  );
}
