"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { UserSessionData } from "@/modules/auth/types";
import { ToastProvider } from "@/components/common/Toast";

interface DashboardShellProps {
  session: UserSessionData;
  children: React.ReactNode;
}

export function DashboardShell({ session, children }: DashboardShellProps) {
  const pathname = usePathname();
  const isInbox = pathname === "/inbox" || pathname?.startsWith("/inbox/");
  const isLounge = pathname === "/team-lounge" || pathname?.startsWith("/team-lounge/");
  const isImmersive = isInbox || isLounge;

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("fynux_sidebar_collapsed");
      if (saved === "true") {
        setIsSidebarCollapsed(true);
      }
    } catch {}
  }, []);

  const handleToggleSidebar = () => {
    // If mobile viewport (< 768px), toggle mobile off-canvas drawer
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsMobileSidebarOpen((prev) => !prev);
      return;
    }

    // On desktop, toggle collapse/expand rail
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("fynux_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  return (
    <ToastProvider>
      <div
        className={`flex ${
          isImmersive ? "h-screen overflow-hidden" : "min-h-screen"
        } bg-slate-50/70 text-slate-900 selection:bg-blue-100 selection:text-blue-950 antialiased relative`}
      >
        {/* Mobile Backdrop Overlay */}
        {isMobileSidebarOpen && (
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-30 md:hidden transition-opacity duration-300 animate-ios-fade"
            aria-hidden="true"
          />
        )}

        {/* Responsive Collapsible Sidebar */}
        <Sidebar
          userRole={session.role}
          isCollapsed={isSidebarCollapsed}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onToggleCollapse={handleToggleSidebar}
        />

        {/* Main Content Layout */}
        <div
          className={`flex-1 flex flex-col min-w-0 ${
            isImmersive ? "h-screen overflow-hidden" : ""
          }`}
        >
          <Header
            session={session}
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={handleToggleSidebar}
          />
          <main
            className={
              isImmersive
                ? "flex-1 min-h-0 overflow-hidden w-full flex flex-col p-2 sm:p-3"
                : "flex-1 p-4 sm:p-5 lg:p-6 overflow-y-auto w-full animate-ios-fade"
            }
          >
            <div
              className={
                isImmersive
                  ? "w-full h-full min-w-0 flex-1 flex flex-col overflow-hidden"
                  : "max-w-7xl mx-auto w-full min-w-0"
              }
            >
              {children}
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
