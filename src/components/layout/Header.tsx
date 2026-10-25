"use client";

import { useEffect, useState } from "react";
import { Search, Bell, Shield, User, LogOut, RefreshCw } from "lucide-react";
import { UserSessionData } from "@/modules/auth/types";
import { logoutAction, switchRoleDevAction } from "@/modules/auth/auth.actions";
import { UserRole } from "@/types/roles";
import { GlobalSearchModal } from "@/components/common/GlobalSearchModal";
import { NotificationDrawer } from "@/components/common/NotificationDrawer";

interface HeaderProps {
  session?: UserSessionData | null;
}

export function Header({ session }: HeaderProps) {
  const currentRole = session?.role || "OWNER";
  const userName = session?.fullName || "Faiz Aditama (Owner)";

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);

  // Keyboard shortcut Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSwitchRole = async (target: UserRole) => {
    await switchRoleDevAction(target);
  };

  return (
    <>
      <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-10">
        {/* Global Search Bar (Click or Cmd+K) */}
        <div className="flex-1 max-w-md">
          <div
            onClick={() => setIsSearchOpen(true)}
            className="relative cursor-pointer group"
          >
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-hover:text-indigo-600 transition-colors" />
            <input
              type="text"
              readOnly
              placeholder="Cari prospek, client, deal, project, invoice... (⌘K)"
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 group-hover:bg-slate-100/80 border border-slate-200 rounded-lg cursor-pointer transition-all text-slate-900 placeholder:text-slate-400 select-none"
            />
          </div>
        </div>

        {/* Right Controls: Dev Switcher, Notifications & User Role Pill */}
        <div className="flex items-center gap-3">
          {/* Quick Role Switcher (Dev Mode) */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-[10px]">
            <span className="text-slate-400 px-1 font-semibold flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Test:
            </span>
            <button
              type="button"
              onClick={() => handleSwitchRole("OWNER")}
              className={`px-1.5 py-0.5 rounded font-medium transition-colors ${
                currentRole === "OWNER"
                  ? "bg-purple-600 text-white font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Owner
            </button>
            <button
              type="button"
              onClick={() => handleSwitchRole("SALES")}
              className={`px-1.5 py-0.5 rounded font-medium transition-colors ${
                currentRole === "SALES"
                  ? "bg-amber-600 text-white font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sales
            </button>
            <button
              type="button"
              onClick={() => handleSwitchRole("DEVELOPER")}
              className={`px-1.5 py-0.5 rounded font-medium transition-colors ${
                currentRole === "DEVELOPER"
                  ? "bg-blue-600 text-white font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Dev
            </button>
          </div>

          {/* In-App Notification Center Button */}
          <button
            type="button"
            onClick={() => setIsNotifOpen(true)}
            aria-label="Notification Center"
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount !== 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          <div className="h-4 w-px bg-slate-200" />

          {/* User Profile Badge */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <User className="w-4 h-4" />
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-slate-900 leading-tight">
                {userName}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                    currentRole === "OWNER"
                      ? "bg-purple-100 text-purple-700"
                      : currentRole === "SALES"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  <Shield className="w-2.5 h-2.5" />
                  {currentRole}
                </span>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={() => logoutAction()}
            title="Keluar dari sistem"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Modals */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      <NotificationDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        onCountChange={(count) => setUnreadCount(count)}
      />
    </>
  );
}
