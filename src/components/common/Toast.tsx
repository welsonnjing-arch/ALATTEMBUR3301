"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
  action?: ToastAction;
}

export interface ToastOptions {
  type?: ToastType;
  message: string;
  description?: string;
  duration?: number;
  action?: ToastAction;
}

interface ToastContextValue {
  toast: {
    (options: ToastOptions): string;
    success: (message: string, description?: string, action?: ToastAction) => string;
    error: (message: string, description?: string, action?: ToastAction) => string;
    info: (message: string, description?: string, action?: ToastAction) => string;
  };
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 3500; // 3.5s auto-dismiss

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup all timers on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (options: ToastOptions): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const duration = options.duration ?? DEFAULT_DURATION;

      const newToast: ToastItem = {
        id,
        type: options.type || "info",
        message: options.message,
        description: options.description,
        duration,
        action: options.action,
      };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        const timer = setTimeout(() => {
          dismissToast(id);
        }, duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [dismissToast]
  );

  const toastMethods = useMemo(() => {
    const fn = (options: ToastOptions) => addToast(options);
    fn.success = (message: string, description?: string, action?: ToastAction) =>
      addToast({ type: "success" as const, message, description, action });
    fn.error = (message: string, description?: string, action?: ToastAction) =>
      addToast({ type: "error" as const, message, description, action });
    fn.info = (message: string, description?: string, action?: ToastAction) =>
      addToast({ type: "info" as const, message, description, action });
    return fn;
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toast: toastMethods, dismissToast }}>
      {children}
      {/* Toast Viewport Container */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-[99999] flex flex-col gap-2 max-w-sm sm:max-w-md w-full px-4 sm:px-0 pointer-events-none"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            role="status"
            className="pointer-events-auto flex items-start gap-3 bg-slate-900/95 text-slate-100 border border-slate-800 shadow-md backdrop-blur-md rounded-lg p-3 sm:px-4 sm:py-3 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
          >
            {item.type === "success" && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            )}
            {item.type === "error" && (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            {item.type === "info" && (
              <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            )}

            <div className="flex-1 min-w-0 pr-1">
              <p className="text-xs font-semibold text-slate-100 leading-snug break-words">
                {item.message}
              </p>
              {item.description && (
                <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5 break-words">
                  {item.description}
                </p>
              )}
              {item.action && (
                <button
                  type="button"
                  onClick={() => {
                    item.action?.onClick();
                    dismissToast(item.id);
                  }}
                  className="mt-2 inline-flex items-center px-2.5 py-1 text-[11px] font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-md transition-colors"
                >
                  {item.action.label}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => dismissToast(item.id)}
              className="text-slate-400 hover:text-slate-200 p-0.5 rounded transition-colors shrink-0"
              aria-label="Tutup notifikasi"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
