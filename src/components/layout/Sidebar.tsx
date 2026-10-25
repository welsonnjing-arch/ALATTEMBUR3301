"use client";

import Link from "next/link";
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
  BarChart3,
  Settings,
  ShieldAlert,
  Flame,
  Code2,
} from "lucide-react";
import { UserRole } from "@/types/roles";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  // Primary Role Workspaces
  {
    label: "Command Center",
    href: "/command-center",
    icon: LayoutDashboard,
    allowedRoles: ["OWNER"],
  },
  {
    label: "Sales Workspace",
    href: "/sales-workspace",
    icon: Flame,
    allowedRoles: ["SALES", "OWNER"],
  },
  {
    label: "Delivery Workspace",
    href: "/delivery-workspace",
    icon: Code2,
    allowedRoles: ["DEVELOPER", "OWNER"],
  },

  // Operational Modules
  {
    label: "CRM & Prospek",
    href: "/crm",
    icon: Users,
    allowedRoles: ["SALES", "OWNER"],
  },
  {
    label: "WhatsApp Inbox",
    href: "/inbox",
    icon: MessageSquare,
    allowedRoles: ["SALES", "OWNER"],
  },
  {
    label: "Katalog Layanan",
    href: "/catalog",
    icon: BookOpen,
    allowedRoles: ["SALES", "OWNER"],
  },
  {
    label: "Finance & Invoice",
    href: "/finance",
    icon: DollarSign,
    allowedRoles: ["OWNER", "SALES"], // Sales can create draft invoices
  },
  {
    label: "Projects",
    href: "/projects",
    icon: Briefcase,
    allowedRoles: ["DEVELOPER", "SALES", "OWNER"],
  },
  {
    label: "Tasks & To-Do",
    href: "/tasks",
    icon: CheckSquare,
    allowedRoles: ["DEVELOPER", "SALES", "OWNER"],
  },
  {
    label: "Team Board",
    href: "/team-board",
    icon: Kanban,
    allowedRoles: ["DEVELOPER", "SALES", "OWNER"],
  },
  {
    label: "Client Lifecycle",
    href: "/client-lifecycle",
    icon: ShieldCheck,
    allowedRoles: ["DEVELOPER", "SALES", "OWNER"],
  },
  {
    label: "Approval Queue",
    href: "/approval-queue",
    icon: ShieldAlert,
    allowedRoles: ["OWNER"],
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    allowedRoles: ["OWNER", "SALES"],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    allowedRoles: ["OWNER"],
  },
];

interface SidebarProps {
  userRole?: UserRole;
}

export function Sidebar({ userRole = "OWNER" }: SidebarProps) {
  const pathname = usePathname();

  const visibleNavItems = NAV_ITEMS.filter((item) =>
    item.allowedRoles.includes(userRole)
  );

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col h-screen sticky top-0">
      {/* Brand Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            F
          </div>
          <div>
            <div className="font-semibold text-slate-900 tracking-tight text-sm">
              FYNUX OS
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              Internal Operating System
            </div>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Navigasi ({userRole})
        </div>
        {visibleNavItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive ? "text-indigo-600" : "text-slate-400"
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer / System Status */}
      <div className="p-4 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium">Connected</span>
        </div>
        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">
          v1.0-MVP
        </span>
      </div>
    </aside>
  );
}
