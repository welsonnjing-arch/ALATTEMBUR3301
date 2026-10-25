"use client";

import { Search, Bell, Shield, User } from "lucide-react";

interface HeaderProps {
  userRole?: "OWNER" | "SALES" | "DEVELOPER";
  userName?: string;
}

export function Header({
  userRole = "OWNER",
  userName = "Richard Faiz (Owner)",
}: HeaderProps) {
  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-10">
      {/* Global Search Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari prospek, client, deal, project, invoice... (⌘K)"
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Right Controls: Notifications & User Role Pill */}
      <div className="flex items-center gap-4">
        {/* In-App Notification Center Pill */}
        <button
          type="button"
          aria-label="Notification Center"
          className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
        </button>

        <div className="h-4 w-px bg-slate-200" />

        {/* User Profile Badge */}
        <div className="flex items-center gap-3">
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
                  userRole === "OWNER"
                    ? "bg-purple-100 text-purple-700"
                    : userRole === "SALES"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                <Shield className="w-2.5 h-2.5" />
                {userRole}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
