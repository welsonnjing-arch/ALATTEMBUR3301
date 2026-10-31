"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  BookOpen,
  DollarSign,
  Briefcase,
  CheckSquare,
  Kanban,
  ShieldCheck,
  HardDrive,
  BarChart3,
  Settings,
  ShieldAlert,
  Flame,
  Code2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelLeft,
  X,
} from "lucide-react";
import { UserRole } from "@/types/roles";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: UserRole[];
  category: "workspaces" | "operations" | "governance";
}

const NAV_ITEMS: NavItem[] = [
  // Primary Role Workspaces
  {
    label: "Command Center",
    href: "/command-center",
    icon: LayoutDashboard,
    allowedRoles: ["OWNER"],
    category: "workspaces",
  },
  {
    label: "Sales Workspace",
    href: "/sales-workspace",
    icon: Flame,
    allowedRoles: ["SALES", "OWNER"],
    category: "workspaces",
  },
  {
    label: "Delivery Workspace",
    href: "/delivery-workspace",
    icon: Code2,
    allowedRoles: ["DEVELOPER", "OWNER"],
    category: "workspaces",
  },

  // Operational Modules
  {
    label: "CRM & Prospek",
    href: "/crm",
    icon: Users,
    allowedRoles: ["SALES", "OWNER"],
    category: "operations",
  },
  {
    label: "WhatsApp Inbox",
    href: "/inbox",
    icon: MessageSquare,
    allowedRoles: ["SALES", "DEVELOPER", "OWNER"],
    category: "operations",
  },
  {
    label: "Katalog Layanan",
    href: "/catalog",
    icon: BookOpen,
    allowedRoles: ["SALES", "OWNER"],
    category: "operations",
  },
  {
    label: "Finance & Invoice",
    href: "/finance",
    icon: DollarSign,
    allowedRoles: ["OWNER", "SALES"],
    category: "operations",
  },
  {
    label: "Projects",
    href: "/projects",
    icon: Briefcase,
    allowedRoles: ["DEVELOPER", "SALES", "OWNER"],
    category: "operations",
  },
  {
    label: "Tasks & To-Do",
    href: "/tasks",
    icon: CheckSquare,
    allowedRoles: ["DEVELOPER", "SALES", "OWNER"],
    category: "operations",
  },
  {
    label: "Team Board",
    href: "/team-board",
    icon: Kanban,
    allowedRoles: ["DEVELOPER", "SALES", "OWNER"],
    category: "operations",
  },
  {
    label: "Client Lifecycle",
    href: "/client-lifecycle",
    icon: ShieldCheck,
    allowedRoles: ["DEVELOPER", "SALES", "OWNER"],
    category: "operations",
  },
  {
    label: "Shared Drive HQ",
    href: "/drive",
    icon: HardDrive,
    allowedRoles: ["OWNER", "DEVELOPER", "SALES"],
    category: "operations",
  },

  // Governance & Intelligence
  {
    label: "Approval Queue",
    href: "/approval-queue",
    icon: ShieldAlert,
    allowedRoles: ["OWNER"],
    category: "governance",
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    allowedRoles: ["OWNER", "SALES"],
    category: "governance",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    allowedRoles: ["OWNER"],
    category: "governance",
  },
];

interface SidebarProps {
  userRole?: UserRole;
  isCollapsed?: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  userRole = "OWNER",
  isCollapsed = false,
  isMobileOpen = false,
  onCloseMobile,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();

  const visibleNavItems = NAV_ITEMS.filter((item) =>
    item.allowedRoles.includes(userRole)
  );

  const renderNavGroup = (
    category: "workspaces" | "operations" | "governance",
    title: string
  ) => {
    const items = visibleNavItems.filter((i) => i.category === category);
    if (items.length === 0) return null;

    return (
      <div key={category} className="space-y-1">
        {/* Section title smoothly transitions height & opacity */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isCollapsed ? "max-h-0 opacity-0 mb-0" : "max-h-6 opacity-100 mb-1.5"
          }`}
        >
          <div className="px-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            {title}
          </div>
        </div>

        {/* Subtle horizontal rule when collapsed */}
        <div
          className={`h-px bg-slate-100 my-2 mx-1 transition-opacity duration-300 ${
            isCollapsed ? "opacity-100" : "opacity-0 h-0 my-0 overflow-hidden"
          }`}
        />

        <div className="space-y-0.5">
          {items.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                onClick={() => {
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`group relative flex items-center rounded-lg text-xs font-medium transition-all duration-200 active-press ${
                  isCollapsed
                    ? "justify-center w-10 h-10 mx-auto px-0"
                    : "gap-2.5 px-3 py-2 w-full"
                } ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold shadow-sm shadow-blue-500/25"
                    : "text-slate-600 hover:bg-slate-100/90 hover:text-slate-900"
                }`}
              >
                <span className="shrink-0 inline-flex items-center justify-center transition-colors duration-200">
                  <Icon
                    className={`w-4 h-4 transition-colors duration-200 ${
                      isActive
                        ? "text-white"
                        : "text-slate-400 group-hover:text-blue-600"
                    }`}
                  />
                </span>

                {/* Label smoothly fades and slides out/in without abrupt DOM unmounting */}
                <span
                  className={`truncate flex-1 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap ${
                    isCollapsed
                      ? "opacity-0 max-w-0 -translate-x-2 pointer-events-none"
                      : "opacity-100 max-w-[190px] translate-x-0"
                  }`}
                >
                  {item.label}
                </span>

                {/* Active Dot Indicator inspired by recent.design */}
                {isActive && (
                  <span
                    data-slot="sidebar-active-dot"
                    aria-hidden="true"
                    className={`w-1.5 h-1.5 rounded-full bg-white shadow-xs shrink-0 transition-all duration-200 ${
                      isCollapsed ? "absolute bottom-1 right-1 ring-1 ring-white/60" : "ml-auto"
                    }`}
                  />
                )}

                {/* Collapsed Tooltip on Hover (fixed positioning avoids parent overflow clipping) */}
                {isCollapsed && (
                  <span className="fixed left-[78px] px-2.5 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-md shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-[60] border border-slate-700/50">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <aside
      className={`border-r border-slate-200/80 bg-white flex flex-col select-none transition-[width,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[width] transform-gpu z-40 ${
        // Mobile Drawer behavior
        isMobileOpen
          ? "fixed inset-y-0 left-0 w-64 shadow-2xl translate-x-0"
          : "fixed inset-y-0 left-0 w-64 -translate-x-full md:translate-x-0"
      } ${
        // Desktop Sticky Collapsible Rail
        isCollapsed ? "md:sticky md:top-0 md:h-screen md:w-[72px]" : "md:sticky md:top-0 md:h-screen md:w-64"
      }`}
      aria-label="Sidebar Navigasi Fynux OS"
    >
      {/* Brand Header */}
      <div
        className={`h-16 flex items-center border-b border-slate-200/80 shrink-0 transition-[padding] duration-200 ${
          isCollapsed ? "justify-center px-0" : "px-4 justify-between"
        }`}
      >
        {isCollapsed ? (
          /* Collapsed Mode: Clean logo trigger to open sidebar */
          <div className="relative flex items-center justify-center">
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Buka Sidebar (⌘B)"
              title="Buka Sidebar (⌘B)"
              className="group/logo relative w-12 h-10 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 px-1"
            >
              <Image
                src="/logo-fynux.png"
                alt="Fynux"
                width={371}
                height={101}
                priority
                className="w-10 h-auto object-contain"
              />

              {/* Collapsed Tooltip on Hover */}
              <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-900 text-white text-[11px] font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover/logo:opacity-100 transition-all duration-200 z-[70] flex items-center gap-1.5 border border-slate-700/60">
                <span>Buka Sidebar</span>
                <kbd className="text-[10px] bg-slate-800 text-slate-300 px-1 py-0.5 rounded font-mono">⌘B</kbd>
              </span>
            </button>
          </div>
        ) : (
          /* Expanded Mode: Full Logo Image and Header Actions */
          <>
            <Link
              href="/command-center"
              className="flex items-center min-w-0 group/logo rounded-lg transition-opacity hover:opacity-90 p-1 -m-1 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              title="Fynux - Command Center"
            >
              <Image
                src="/logo-fynux.png"
                alt="Fynux"
                width={371}
                height={101}
                priority
                className="h-8 md:h-[34px] w-auto object-contain max-w-[145px]"
              />
            </Link>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-1">
              {onCloseMobile && (
                <button
                  type="button"
                  onClick={onCloseMobile}
                  aria-label="Tutup Menu"
                  className="md:hidden p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-all active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {onToggleCollapse && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  aria-label="Ciutkan Sidebar"
                  title="Ciutkan Sidebar (⌘B)"
                  className="hidden md:inline-flex p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-all active:scale-95"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 no-scrollbar">
        {renderNavGroup("workspaces", "Workspaces")}
        {renderNavGroup("operations", "Operasional")}
        {renderNavGroup("governance", "Tata Kelola")}
      </div>

      {/* Footer / System Status */}
      <div className="p-3 border-t border-slate-200/80 text-xs text-slate-500 flex items-center justify-between shrink-0 bg-slate-50/50">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          {!isCollapsed && (
            <span className="font-medium text-slate-600 text-[10px] whitespace-nowrap">
              Online
            </span>
          )}
        </div>
        {!isCollapsed && (
          <span className="bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-600 font-mono text-[9px] whitespace-nowrap">
            v1.0-MVP
          </span>
        )}
      </div>
    </aside>
  );
}
