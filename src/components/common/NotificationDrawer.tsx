"use client";

import React, { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  X,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  fetchSystemNotificationsAction,
  SystemNotificationItem,
} from "@/modules/notifications/notifications.actions";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCountChange?: (count: number) => void;
}

export function NotificationDrawer({
  isOpen,
  onClose,
  onCountChange,
}: NotificationDrawerProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<SystemNotificationItem[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      const res = await fetchSystemNotificationsAction();
      if (isMounted) {
        setNotifications(res);
        setLoading(false);
        if (onCountChange) {
          onCountChange(res.length);
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [isOpen, onCountChange]);

  const activeNotifs = notifications.filter((n) => !dismissedIds.includes(n.id));

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    if (onCountChange) {
      onCountChange(notifications.length - updated.length);
    }
  };

  const handleNavigate = (url: string) => {
    onClose();
    router.push(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Pusat Notifikasi</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
              {activeNotifs.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {loading ? (
            <div className="text-center py-12 text-xs text-slate-400">
              Memuat notifikasi sistem...
            </div>
          ) : activeNotifs.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="text-xs font-bold text-slate-700">Semua Berjalan Normal</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Tidak ada permintaan approval tertunda, kendala blocker, atau garansi kritis saat ini.
              </p>
            </div>
          ) : (
            activeNotifs.map((item) => (
              <div
                key={item.id}
                onClick={() => handleNavigate(item.url)}
                className={`p-3.5 rounded-xl border text-xs space-y-1.5 cursor-pointer transition-all hover:shadow-sm ${
                  item.severity === "URGENT"
                    ? "bg-rose-50/70 border-rose-200 hover:border-rose-300"
                    : item.severity === "WARNING"
                    ? "bg-amber-50/70 border-amber-200 hover:border-amber-300"
                    : "bg-indigo-50/60 border-indigo-200 hover:border-indigo-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 leading-snug">
                    {item.severity === "URGENT" && (
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                    )}
                    {item.severity === "WARNING" && (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    )}
                    {item.severity === "INFO" && (
                      <Clock className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                    )}
                    <span>{item.title}</span>
                  </div>
                  <button
                    onClick={(e) => handleDismiss(item.id, e)}
                    className="text-slate-400 hover:text-slate-600 p-0.5"
                    title="Tutup notifikasi ini"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {item.description}
                </p>

                <div className="pt-1 flex items-center justify-between text-[10px] text-indigo-700 font-semibold">
                  <span className="flex items-center gap-1">
                    Buka Tindakan <ExternalLink className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <button
            onClick={() => setDismissedIds(notifications.map((n) => n.id))}
            className="text-[11px] text-slate-500 hover:text-slate-800 font-medium"
          >
            Tandai Semua Dibaca
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
