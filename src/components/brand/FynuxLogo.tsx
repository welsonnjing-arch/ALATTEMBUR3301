"use client";

import React, { useId } from "react";
import Image from "next/image";

interface FynuxLogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
  showGlow?: boolean;
  priority?: boolean;
  useImage?: boolean;
}

export function FynuxLogo({
  size = 32,
  className = "",
  animated = true,
  showGlow = true,
  priority = false,
  useImage = false,
}: FynuxLogoProps) {
  // Guaranteed unique gradient ID per instance to eliminate DOM ID collisions
  const reactId = useId().replace(/:/g, "_");
  const gradFId = `fynux-grad-f-${reactId}`;
  const gradGlowId = `fynux-grad-glow-${reactId}`;

  return (
    <div
      className={`relative isolate inline-flex items-center justify-center shrink-0 group/fynux-logo select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Ambient subtle glow on hover */}
      {showGlow && (
        <span
          className="absolute inset-0 rounded-xl bg-blue-600/25 opacity-0 blur-md -z-10 transition-opacity duration-300 ease-out group-hover/fynux-logo:opacity-100 group-hover/logo:opacity-100 pointer-events-none"
          aria-hidden="true"
        />
      )}

      {useImage ? (
        <Image
          src="/fynux-logo.png"
          alt="Fynux OS Logo"
          width={size}
          height={size}
          className="w-full h-full object-contain"
          priority={priority}
        />
      ) : (
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full overflow-visible transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/fynux-logo:scale-105 group-hover/logo:scale-105 group-active/fynux-logo:scale-95 group-active/logo:scale-95"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          shapeRendering="geometricPrecision"
        >
          <defs>
            {/* Primary Brand Gradient: Royal Blue -> Indigo -> Violet */}
            <linearGradient id={gradFId} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1d4ed8" />
              <stop offset="40%" stopColor="#2563eb" />
              <stop offset="70%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>

            {/* Glowing Accent Gradient */}
            <linearGradient id={gradGlowId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>

          {/* Unmistakable Bold Capital Letter 'F' (Vertical stem, full top arm, full middle horizontal crossbar in single unified path) */}
          <path
            d="M 26 82 L 26 22 L 78 22 M 26 51 L 66 51"
            stroke={`url(#${gradFId})`}
            strokeWidth="15"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-colors duration-300"
          />

          {/* Subtle top gleam highlight across the full capital F */}
          <path
            d="M 26 82 L 26 22 L 78 22 M 26 51 L 66 51"
            stroke={`url(#${gradGlowId})`}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-0 group-hover/fynux-logo:opacity-75 group-hover/logo:opacity-75 transition-opacity duration-300 pointer-events-none"
          />
        </svg>
      )}
    </div>
  );
}

