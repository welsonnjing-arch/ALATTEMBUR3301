"use client";

import { useState } from "react";
import {
  Briefcase,
  FolderPlus,
  Search,
  Clock,
  ExternalLink,
  ChevronRight,
  Users,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Project } from "@/modules/projects/types";
import { ProjectStatus } from "@/types/enums";
import { formatDateWIB } from "@/lib/date";
import { ProjectDetailModal } from "./ProjectDetailModal";
import { CreateProjectModal } from "./CreateProjectModal";

interface ProjectListTableProps {
  initialProjects: Project[];
  userRole?: string;
  isOwner?: boolean;
}

const STATUS_TABS: Array<{ label: string; value: ProjectStatus | "ALL" }> = [
  { label: "Semua", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "On Hold", value: "ON_HOLD" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Archived", value: "ARCHIVED" },
];

export function ProjectListTable({
  initialProjects,
  userRole = "OWNER",
  isOwner = true,
}: ProjectListTableProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filtered = projects.filter((p) => {
    const matchesStatus =
      selectedStatus === "ALL" || p.status === selectedStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.clientName.toLowerCase().includes(q) ||
      p.scopeDescription.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-100 text-emerald-800 border-emerald-200 font-bold";
      case "ON_HOLD":
        return "bg-amber-100 text-amber-800 border-amber-200 font-bold";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800 border-blue-200 font-bold";
      case "DRAFT":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "CANCELLED":
        return "bg-rose-100 text-rose-800 border-rose-200 line-through";
      case "ARCHIVED":
        return "bg-slate-200 text-slate-600 border-slate-300";
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Search & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama proyek, klien, ruang lingkup..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
          />
        </div>

        {isOwner && (
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            Inisialisasi Proyek Baru
          </button>
        )}
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-slate-200">
        {STATUS_TABS.map((tab) => {
          const isActive = selectedStatus === tab.value;
          const count =
            tab.value === "ALL"
              ? projects.length
              : projects.filter((p) => p.status === tab.value).length;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setSelectedStatus(tab.value)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isActive
                  ? "bg-indigo-600 text-white font-semibold shadow-sm"
                  : "text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? "bg-indigo-800 text-indigo-100"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid of Projects */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((proj) => (
            <div
              key={proj.id}
              onClick={() => setSelectedProject(proj)}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`inline-flex items-center text-[10px] px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                      proj.status
                    )}`}
                  >
                    {proj.status}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Deadline: {formatDateWIB(proj.deadline)}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                  {proj.name}
                </h3>
                <div className="text-xs font-semibold text-indigo-700">
                  {proj.clientName}
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {proj.scopeDescription}
                </p>

                {proj.status === "ON_HOLD" && proj.onHoldReason && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span className="line-clamp-1">
                      <strong>On Hold:</strong> {proj.onHoldReason}
                    </span>
                  </div>
                )}
              </div>

              {/* Progress Bar & Footer */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Progress</span>
                    <span className="font-extrabold text-slate-900 font-mono">
                      {proj.progressPercent}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        proj.progressPercent === 100
                          ? "bg-emerald-500"
                          : "bg-indigo-600"
                      }`}
                      style={{ width: `${proj.progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{proj.assignedMemberNames.join(", ")}</span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-indigo-600 font-semibold hover:text-indigo-800">
                    Buka Workspace <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800">
            Tidak ada proyek ditemukan
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Belum ada proyek pengerjaan delivery pada status ini.
          </p>
        </div>
      )}

      {/* Modals */}
      <ProjectDetailModal
        project={selectedProject}
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        onRefresh={() => window.location.reload()}
        isOwner={isOwner}
      />

      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
