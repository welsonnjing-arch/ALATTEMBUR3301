"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Bell,
  Shield,
  User,
  LogOut,
  RefreshCw,
  PanelLeft,
  Volume2,
  VolumeX,
  ChevronDown,
  Settings,
  Flame,
  Code2,
} from "lucide-react";
import { UserSessionData } from "@/modules/auth/types";
import { logoutAction } from "@/modules/auth/auth.actions";
import { fetchSystemNotificationsAction } from "@/modules/notifications/notifications.actions";
import { UserRole } from "@/types/roles";
import { GlobalSearchModal } from "@/components/common/GlobalSearchModal";
import { NotificationDrawer } from "@/components/common/NotificationDrawer";
import { UserProfileModal } from "@/components/auth/UserProfileModal";
import { useSound } from "@/components/common/SoundProvider";
import { getDismissedNotificationIds } from "@/lib/notifications-client";

interface HeaderProps {
  session?: UserSessionData | null;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export function Header({
  session,
  isSidebarCollapsed = false,
  onToggleSidebar,
}: HeaderProps) {
  const [currentSession, setCurrentSession] = useState<UserSessionData | null | undefined>(session);

  useEffect(() => {
    setCurrentSession(session);
  }, [session]);

  const currentRole = currentSession?.role || "OWNER";
  const userName = currentSession?.fullName || "Faiz Aditama (Owner)";
  const avatarUrl = currentSession?.avatarUrl;
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [avatarUrl]);

  const homeWorkspace =
    currentRole === "DEVELOPER"
      ? { href: "/delivery-workspace", label: "Delivery Workspace", icon: Code2 }
      : currentRole === "SALES"
      ? { href: "/sales-workspace", label: "Sales Workspace", icon: Flame }
      : { href: "/command-center", label: "Command Center", icon: User };

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const { muted: isSoundMuted, toggleMute: toggleSound } = useSound();

  // Load initial notification count so bell badge is only visible when unread notifications exist
  useEffect(() => {
    let isMounted = true;
    async function initCount() {
      try {
        const notifs = await fetchSystemNotificationsAction();
        if (isMounted) {
          const dismissed = getDismissedNotificationIds();
          const active = notifs.filter((n) => !dismissed.includes(n.id));
          setUnreadCount(active.length);
        }
      } catch {}
    }
    initCount();
    return () => {
      isMounted = false;
    };
  }, []);

  // Close profile dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("keydown", handleEsc);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isProfileOpen]);

  // Keyboard shortcut Cmd+K or Ctrl+K for search, Cmd+B or Ctrl+B for sidebar toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        if (onToggleSidebar) onToggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onToggleSidebar]);

  return (
    <>
      <header className="h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-xs px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 select-none">
        {/* Left Side: Search Bar (Sidebar toggle next to search removed) */}
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          {/* Mobile-only menu toggle (hidden on desktop) */}
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Buka Menu"
              className="md:hidden p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all active-press shrink-0"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}

          {/* Global Search Pill Bar (Click or Cmd+K) */}
          <div
            onClick={() => setIsSearchOpen(true)}
            role="button"
            tabIndex={0}
            aria-label="Cari entitas global (Cmd+K)"
            className="flex-1 flex items-center gap-2.5 px-3.5 py-1.5 bg-slate-100/80 hover:bg-white hover:border-blue-400/50 border border-slate-200/70 rounded-full cursor-pointer transition-all duration-150 group shadow-[0_1px_2px_rgba(0,0,0,0.02)] active-press"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
            <span className="text-xs text-slate-400 group-hover:text-slate-600 truncate flex-1 font-normal">
              Cari prospek, client, deal, project, invoice...
            </span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-white group-hover:bg-slate-50 border border-slate-200 rounded shadow-2xs shrink-0">
              <span className="text-[11px]">⌘</span>K
            </kbd>
          </div>
        </div>

        {/* Right Side: Sound Toggle, Role Switcher, Notification & Profile */}
        <div className="flex items-center gap-2.5">
          {/* Audio Click Feedback Toggle Button */}
          <button
            type="button"
            onClick={toggleSound}
            aria-label={isSoundMuted ? "Aktifkan audio klik" : "Bisukan audio klik"}
            title={
              isSoundMuted
                ? "Efek Suara: Mati (Klik untuk aktifkan)"
                : "Efek Suara: Aktif (Klik untuk bisukan)"
            }
            className={`p-2 rounded-lg transition-all active-press ${
              isSoundMuted
                ? "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                : "text-slate-700 hover:bg-slate-100 bg-slate-100/50"
            }`}
          >
            {isSoundMuted ? (
              <VolumeX className="w-4 h-4 text-slate-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-blue-600" />
            )}
          </button>

          {/* In-App Notification Center Button */}
          <button
            type="button"
            onClick={() => setIsNotifOpen(true)}
            aria-label="Notification Center"
            title={
              unreadCount > 0
                ? `Pusat Notifikasi (${unreadCount} notifikasi)`
                : "Pusat Notifikasi"
            }
            className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all active-press cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>

          <div className="h-4 w-px bg-slate-200/80 mx-1 hidden sm:block" />

          {/* Interactive User Profile Trigger & Clean Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              aria-expanded={isProfileOpen}
              aria-haspopup="menu"
              aria-label="Menu Profil Pengguna"
              className={`flex items-center gap-2.5 py-1 pl-1 pr-2.5 rounded-full transition-all duration-200 active-press border cursor-pointer ${
                isProfileOpen
                  ? "bg-slate-100 border-slate-300 shadow-xs"
                  : "border-transparent hover:bg-slate-100/90 hover:border-slate-200/70"
              }`}
            >
              {/* Avatar with image or crisp monochromatic fallback */}
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-slate-100 flex items-center justify-center font-bold text-xs shadow-xs shrink-0 border border-slate-700/40 overflow-hidden">
                  {avatarUrl && !avatarError ? (
                    <img
                      src={avatarUrl}
                      alt={userName}
                      className="w-full h-full object-cover"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    (userName || "U").charAt(0).toUpperCase()
                  )}
                </div>
              </div>

              {/* User Name & Role Pill */}
              <div className="text-left hidden md:block">
                <div className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[130px]">
                  {(userName || "").split(" ")[0]} {(userName || "").split(" ")[1] || ""}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] font-medium text-slate-400">
                    {currentRole}
                  </span>
                </div>
              </div>

              {/* Animated Chevron indicator */}
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                  isProfileOpen ? "rotate-180 text-blue-600" : ""
                }`}
              />
            </button>

            {/* Smooth iOS-Style Floating Profile Dropdown Card */}
            {isProfileOpen && (
              <div
                role="menu"
                aria-orientation="vertical"
                className="absolute right-0 top-full mt-2.5 w-72 bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-900/10 p-2 z-50 animate-ios-fade text-slate-800"
              >
                {/* User Profile Card Header */}
                <div className="p-3 bg-gradient-to-br from-slate-50 to-slate-100/70 rounded-xl border border-slate-200/60 mb-1.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-slate-100 flex items-center justify-center font-bold text-sm shadow-sm border border-slate-700/40 shrink-0 overflow-hidden">
                      {avatarUrl && !avatarError ? (
                        <img
                          src={avatarUrl}
                          alt={userName}
                          className="w-full h-full object-cover"
                          onError={() => setAvatarError(true)}
                        />
                      ) : (
                        (userName || "U").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="overflow-hidden flex-1">
                      <div className="font-semibold text-xs text-slate-900 truncate">
                        {userName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {currentSession?.email || "faiz@fynux.id"}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200/70 font-mono">
                          <Shield className="w-2.5 h-2.5 text-blue-600" />
                          {currentRole}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[9px] text-emerald-600 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          Online
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Role-Aware Menu Items */}
                <div className="space-y-0.5 text-xs font-medium text-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100/80 hover:text-slate-900 transition-colors text-left cursor-pointer"
                    role="menuitem"
                  >
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Profil & Kata Sandi</span>
                  </button>

                  <Link
                    href={homeWorkspace.href}
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100/80 hover:text-slate-900 transition-colors"
                    role="menuitem"
                  >
                    <homeWorkspace.icon className="w-4 h-4 text-slate-400" />
                    <span>{homeWorkspace.label}</span>
                  </Link>

                  {currentRole === "OWNER" && (
                    <Link
                      href="/settings"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100/80 hover:text-slate-900 transition-colors"
                      role="menuitem"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Pengaturan Akun & Audit</span>
                    </Link>
                  )}
                </div>

                {/* Clean Separator */}
                <div className="h-px bg-slate-100 my-1.5 mx-1" />

                {/* Logout Action */}
                <button
                  type="button"
                  onClick={async () => {
                    setIsProfileOpen(false);
                    await logoutAction();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors active-press group cursor-pointer"
                  role="menuitem"
                >
                  <div className="flex items-center gap-2.5">
                    <LogOut className="w-4 h-4 text-rose-500 group-hover:text-rose-600 transition-colors" />
                    <span>Keluar dari Sistem</span>
                  </div>
                  <span className="text-[10px] text-rose-400 font-mono">Logout</span>
                </button>
              </div>
            )}
          </div>
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

      {/* User Profile & Security Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        session={currentSession}
        onSessionUpdated={(updated) => {
          setCurrentSession((prev) => (prev ? { ...prev, ...updated } : prev));
        }}
      />
    </>
  );
}
