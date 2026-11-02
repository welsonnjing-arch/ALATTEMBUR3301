"use client";

import { useEffect, useRef } from "react";

export function CustomCursor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only activate custom cursor on desktop fine pointer devices
    if (typeof window === "undefined" || !window.matchMedia("(pointer: fine)").matches) {
      return;
    }

    document.body.classList.add("has-custom-cursor");

    let mouseX = -100;
    let mouseY = -100;
    let isVisible = false;
    let isClicking = false;
    let isHovering = false;
    let isTextInput = false;
    let lastTarget: HTMLElement | null = null;
    let rafId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      const target = e.target as HTMLElement | null;
      const inputActive = Boolean(
        target && target.closest('input, textarea, select, [contenteditable="true"]')
      );

      if (inputActive !== isTextInput) {
        isTextInput = inputActive;
        if (rootRef.current) {
          rootRef.current.style.opacity = isTextInput ? "0" : "1";
        }
      }

      if (!isVisible && !isTextInput) {
        isVisible = true;
        if (rootRef.current) {
          rootRef.current.style.opacity = "1";
        }
      }

      if (target && target !== lastTarget && rootRef.current) {
        lastTarget = target;
        const interactive =
          !isTextInput &&
          Boolean(
            target.closest(
              'a, button, [role="button"], [role="tab"], [role="switch"], [role="menuitem"], [role="checkbox"], select, label, [data-clickable]'
            )
          );

        if (interactive !== isHovering) {
          isHovering = interactive;
          rootRef.current.dataset.hover = isHovering ? "true" : "false";
        }
      }
    };

    const onMouseDown = () => {
      isClicking = true;
      if (rootRef.current) {
        rootRef.current.dataset.clicking = "true";
      }
    };

    const onMouseUp = () => {
      isClicking = false;
      if (rootRef.current) {
        rootRef.current.dataset.clicking = "false";
      }
    };

    const onMouseLeave = () => {
      isVisible = false;
      lastTarget = null;
      if (rootRef.current) {
        rootRef.current.style.opacity = "0";
      }
    };

    const onMouseEnter = () => {
      isVisible = true;
      if (rootRef.current && !isTextInput) {
        rootRef.current.style.opacity = "1";
      }
    };

    let prevMouseX = -999;
    let prevMouseY = -999;

    // Ultra-lightweight RAF loop running at 60-144fps without ANY React re-renders
    const render = () => {
      if (arrowRef.current && (Math.abs(mouseX - prevMouseX) > 0.05 || Math.abs(mouseY - prevMouseY) > 0.05)) {
        // Tip is at (1.5, 1.5) in the 24x24 SVG, scaled to 18px (0.75x) gives ~1.1px offset for pixel-perfect tip point
        arrowRef.current.style.transform = `translate3d(${mouseX - 1.1}px, ${mouseY - 1.1}px, 0)`;
        prevMouseX = mouseX;
        prevMouseY = mouseY;
      }

      rafId = requestAnimationFrame(render);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    window.addEventListener("mouseup", onMouseUp, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    render();

    return () => {
      document.body.classList.remove("has-custom-cursor");
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="custom-cursor-root"
      aria-hidden="true"
    >
      {/* Designer Precision Pointer Arrow (Exact delta geometry from Image 2 with Brand Colors) */}
      <div ref={arrowRef} className="custom-cursor-arrow">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="cursor-arrow-svg transition-transform duration-150 ease-out"
          style={{ filter: "drop-shadow(0 2px 4px rgba(15, 23, 42, 0.35))" }}
        >
          <defs>
            {/* Idle Theme: Deep Slate with Royal Blue Brand Accent */}
            <linearGradient id="cursorBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="45%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>

            {/* Hover Theme: Vibrant Brand Gradient (Royal Blue to Violet) */}
            <linearGradient id="cursorHoverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1d68d8" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>

          {/* Precision Delta Arrowhead Path strictly matching Image 2 with crisp white border */}
          <path
            d="M 1.5 1.5 L 8.3 21.5 L 12.6 13.3 L 21.1 8.7 Z"
            className="cursor-path transition-all duration-200"
            fill="url(#cursorBodyGrad)"
            stroke="#ffffff"
            strokeWidth="1.6"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
