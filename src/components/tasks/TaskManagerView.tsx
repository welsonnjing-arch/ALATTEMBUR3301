"use client";

import { useState, useEffect } from "react";
import {
  CheckSquare,
  Plus,
  Clock,
  AlertTriangle,
  User,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  Layers,
  LayoutGrid,
  List,
  Search,
  Filter,
} from "lucide-react";
import { CreateTaskInput, Task } from "@/modules/projects/types";
import { TaskPriority, TaskStatus } from "@/types/enums";
import { createTaskAction, updateTaskStatusAction } from "@/modules/projects/projects.actions";
import { formatDateWIB } from "@/lib/date";
import { ModalPortal } from "@/components/common/ModalPortal";
import { Pagination } from "@/components/common/Pagination";
import { playClickSound } from "@/lib/audio";
import { useToast } from "@/components/common/Toast";
import { TaskDetailModal } from "./TaskDetailModal";

interface TaskManagerViewProps {
  initialTasks: Task[];
  projectsList: Array<{ id: string; name: string }>;
  currentUserId?: string;
}

const COLUMNS: Array<{ label: string; status: TaskStatus; color: string }> = [
  { label: "To Do", status: "TODO", color: "border-slate-300" },
  { label: "In Progress", status: "IN_PROGRESS", color: "border-blue-500" },
  { label: "Blocked (Ada Kendala)", status: "BLOCKED", color: "border-slate-400" },
  { label: "Done (Selesai)", status: "DONE", color: "border-slate-800" },
];

const STATUS_TABS: Array<{ label: string; value: TaskStatus | "ALL" }> = [
  { label: "Semua Status", value: "ALL" },
  { label: "To Do", value: "TODO" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Blocked", value: "BLOCKED" },
  { label: "Done", value: "DONE" },
];

const BOARD_PAGE_SIZE = 6;
const LIST_PAGE_SIZE = 15;

export function TaskManagerView({
  initialTasks,
  projectsList,
  currentUserId,
}: TaskManagerViewProps) {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [viewMode, setViewMode] = useState<"BOARD" | "LIST">("BOARD");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");
  const [selectedStatusTab, setSelectedStatusTab] = useState<TaskStatus | "ALL">("ALL");

  // Keep state synchronized with server-revalidated props
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Per-column pagination state for Kanban Board
  const [columnPages, setColumnPages] = useState<Record<TaskStatus, number>>({
    TODO: 1,
    IN_PROGRESS: 1,
    BLOCKED: 1,
    DONE: 1,
  });

  // Table pagination state for List View
  const [listCurrentPage, setListCurrentPage] = useState<number>(1);

  // Detail Modal State
  const [selectedDetailTask, setSelectedDetailTask] = useState<Task | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [blockedModalTask, setBlockedModalTask] = useState<Task | null>(null);
  const [blockedReasonInput, setBlockedReasonInput] = useState("");

  // Keep selectedDetailTask synchronized with latest task data
  useEffect(() => {
    if (selectedDetailTask) {
      const fresh = tasks.find((t) => t.id === selectedDetailTask.id);
      if (fresh) {
        setSelectedDetailTask(fresh);
      }
    }
  }, [tasks]);

  // Create Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskProjId, setNewTaskProjId] = useState(projectsList[0]?.id || "");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("MEDIUM");
  const [newTaskDeadline, setNewTaskDeadline] = useState(
    new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filter handlers
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setColumnPages({ TODO: 1, IN_PROGRESS: 1, BLOCKED: 1, DONE: 1 });
    setListCurrentPage(1);
  };

  const handleProjectFilterChange = (projId: string) => {
    setSelectedProjectId(projId);
    setColumnPages({ TODO: 1, IN_PROGRESS: 1, BLOCKED: 1, DONE: 1 });
    setListCurrentPage(1);
  };

  const handleColPageChange = (status: TaskStatus, newPage: number, totalPages: number) => {
    playClickSound("soft");
    const clamped = Math.max(1, Math.min(newPage, totalPages));
    setColumnPages((prev) => ({
      ...prev,
      [status]: clamped,
    }));
  };

  // Filter tasks by search query and project
  const filteredTasks = tasks.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.title.toLowerCase().includes(q) ||
      (t.projectName && t.projectName.toLowerCase().includes(q)) ||
      (t.primaryPicName && t.primaryPicName.toLowerCase().includes(q)) ||
      (t.description && t.description.toLowerCase().includes(q));

    const matchesProject =
      selectedProjectId === "ALL" || t.projectId === selectedProjectId;

    return matchesSearch && matchesProject;
  });

  const handleStatusChange = async (task: Task, nextStatus: TaskStatus, reason?: string) => {
    if (nextStatus === "BLOCKED" && !reason) {
      setBlockedModalTask(task);
      setBlockedReasonInput(task.blockedReason || "");
      return;
    }

    const res = await updateTaskStatusAction(task.id, nextStatus, reason);
    if (res.success) {
      toast.success(`Task "${task.title}" berhasil dipindahkan`);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, status: nextStatus, blockedReason: nextStatus === "BLOCKED" ? reason : undefined }
            : t
        )
      );
    }
  };

  const handleConfirmBlocked = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockedModalTask) return;

    const res = await updateTaskStatusAction(
      blockedModalTask.id,
      "BLOCKED",
      blockedReasonInput || "Terkendala kelengkapan data klien"
    );

    if (res.success) {
      toast.info(`Task "${blockedModalTask.title}" ditandai terkendala`);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === blockedModalTask.id
            ? {
                ...t,
                status: "BLOCKED",
                blockedReason: blockedReasonInput || "Terkendala kelengkapan data klien",
              }
            : t
        )
      );
      setBlockedModalTask(null);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setIsSubmitting(true);
    const input: CreateTaskInput = {
      title: newTaskTitle,
      description: newTaskDesc,
      projectId: newTaskProjId || undefined,
      primaryPicId: currentUserId || "33333333-3333-3333-3333-333333333333",
      priority: newTaskPriority,
      deadline: newTaskDeadline,
    };

    const res = await createTaskAction(input);
    if (res.success && res.task) {
      toast.success(`Task "${res.task.title}" berhasil dibuat`);
      setTasks((prev) => [res.task!, ...prev]);
      setColumnPages((prev) => ({ ...prev, TODO: 1 }));
      setListCurrentPage(1);
      setIsCreateOpen(false);
      setNewTaskTitle("");
      setNewTaskDesc("");
    }
    setIsSubmitting(false);
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case "URGENT":
        return "bg-slate-900 text-white border-slate-800 font-bold";
      case "HIGH":
        return "bg-slate-200 text-slate-800 border-slate-300 font-semibold";
      case "MEDIUM":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "LOW":
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  // List View filtered & paginated records
  const listTasks =
    selectedStatusTab === "ALL"
      ? filteredTasks
      : filteredTasks.filter((t) => t.status === selectedStatusTab);

  const listTotalPages = Math.max(1, Math.ceil(listTasks.length / LIST_PAGE_SIZE));
  const safeListPage = Math.min(listCurrentPage, listTotalPages);
  const pagedListTasks = listTasks.slice(
    (safeListPage - 1) * LIST_PAGE_SIZE,
    safeListPage * LIST_PAGE_SIZE
  );

  return (
    <div className="space-y-6">
      {/* Toolbar Controls */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Bar & Project Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1 max-w-2xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari judul task, proyek, PIC, atau rincian deskripsi..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  title="Hapus pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Proyek:</span>
              </div>
              <select
                value={selectedProjectId}
                onChange={(e) => handleProjectFilterChange(e.target.value)}
                className="text-xs bg-slate-50 hover:bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Proyek ({tasks.length})</option>
                {projectsList.map((p) => {
                  const count = tasks.filter((t) => t.projectId === p.id).length;
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* View Mode Toggle & Add Task */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {/* View Mode Toggle (Board vs Table List) */}
            <div className="flex items-center bg-slate-100/90 p-0.5 rounded-lg border border-slate-200/70 text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  playClickSound("soft");
                  setViewMode("BOARD");
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all active-press ${
                  viewMode === "BOARD"
                    ? "bg-white text-slate-900 font-bold shadow-xs border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Board</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playClickSound("soft");
                  setViewMode("LIST");
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all active-press ${
                  viewMode === "LIST"
                    ? "bg-white text-slate-900 font-bold shadow-xs border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Daftar</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors active-press cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Task</span>
            </button>
          </div>
        </div>

        {/* Status Filter Tabs (Only shown in List View) */}
        {viewMode === "LIST" && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 scrollbar-none">
            {STATUS_TABS.map((tab) => {
              const count =
                tab.value === "ALL"
                  ? filteredTasks.length
                  : filteredTasks.filter((t) => t.status === tab.value).length;
              const isActive = selectedStatusTab === tab.value;

              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => {
                    playClickSound("soft");
                    setSelectedStatusTab(tab.value);
                    setListCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all active-press shrink-0 flex items-center gap-1.5 border ${
                    isActive
                      ? "bg-slate-900 text-white border-slate-900 font-bold shadow-2xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? "bg-slate-800 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* VIEW MODE 1: KANBAN BOARD WITH PER-COLUMN PAGINATION */}
      {viewMode === "BOARD" && (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4 items-start">
          {COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.status);
            const colTotalPages = Math.max(1, Math.ceil(colTasks.length / BOARD_PAGE_SIZE));
            const colCurrentPage = Math.min(columnPages[col.status] || 1, colTotalPages);
            const colPagedTasks = colTasks.slice(
              (colCurrentPage - 1) * BOARD_PAGE_SIZE,
              colCurrentPage * BOARD_PAGE_SIZE
            );

            return (
              <div
                key={col.status}
                className={`bg-slate-50/90 rounded-xl border-t-4 ${col.color} border-slate-200 border-x border-b p-4 space-y-3 shadow-2xs min-h-[500px] flex flex-col`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {col.label}
                  </span>
                  <span className="text-[10px] font-bold font-mono bg-white text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                    {colTasks.length}
                  </span>
                </div>

                {/* Tasks List */}
                <div className="space-y-3 flex-1">
                  {colPagedTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => {
                        playClickSound("soft");
                        setSelectedDetailTask(task);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          playClickSound("soft");
                          setSelectedDetailTask(task);
                        }
                      }}
                      title="Klik untuk melihat detail lengkap task"
                      className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-3 shadow-2xs card-hover-lift cursor-pointer hover:border-slate-300 hover:shadow-md transition-all active-press group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded-md border ${getPriorityBadge(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>
                        {task.deadline && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatDateWIB(task.deadline)}
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                        {task.title}
                      </h4>

                      {task.projectName && (
                        <div className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded w-fit border border-blue-200/50">
                          {task.projectName}
                        </div>
                      )}

                      {task.description && (
                        <p className="text-[11px] text-slate-600 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {task.status === "BLOCKED" && task.blockedReason && (
                        <div className="p-2 bg-slate-100 border border-slate-200 rounded text-[11px] text-slate-700 flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                          <span>{task.blockedReason}</span>
                        </div>
                      )}

                      {/* Footer Task: PIC & Status Changer */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1 text-slate-600">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-xs">{task.primaryPicName}</span>
                        </div>

                        <select
                          value={task.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleStatusChange(task, e.target.value as TaskStatus);
                          }}
                          className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 font-medium text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="BLOCKED">Blocked</option>
                          <option value="DONE">Done</option>
                        </select>
                      </div>
                    </div>
                  ))}

                  {colTasks.length === 0 && (
                    <div className="text-center py-16 text-slate-400 text-xs italic">
                      {searchQuery || selectedProjectId !== "ALL"
                        ? "Tidak ada task yang cocok"
                        : "Tidak ada task"}
                    </div>
                  )}
                </div>

                {/* Per-Column Pagination Footer Controls */}
                <div className="pt-2.5 mt-auto border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500 select-none">
                  <span className="font-medium font-mono text-slate-500">
                    {colTasks.length > 0 ? (
                      <>
                        {(colCurrentPage - 1) * BOARD_PAGE_SIZE + 1}-
                        {Math.min(colCurrentPage * BOARD_PAGE_SIZE, colTasks.length)} dari{" "}
                        <span className="font-semibold text-slate-700 font-mono">
                          {colTasks.length}
                        </span>
                      </>
                    ) : (
                      "0 task"
                    )}
                  </span>

                  {colTotalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleColPageChange(col.status, colCurrentPage - 1, colTotalPages)}
                        disabled={colCurrentPage <= 1}
                        aria-label={`Halaman sebelumnya untuk ${col.label}`}
                        title="Halaman Sebelumnya"
                        className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors active-press cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] font-mono font-bold px-1 text-slate-700">
                        {colCurrentPage}/{colTotalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleColPageChange(col.status, colCurrentPage + 1, colTotalPages)}
                        disabled={colCurrentPage >= colTotalPages}
                        aria-label={`Halaman berikutnya untuk ${col.label}`}
                        title="Halaman Berikutnya"
                        className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors active-press cursor-pointer"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: TABLE LIST VIEW WITH SHARED PAGINATION COMPONENT */}
      {viewMode === "LIST" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Task & Rincian</th>
                    <th className="px-4 py-3">Proyek</th>
                    <th className="px-4 py-3">PIC Utama</th>
                    <th className="px-4 py-3">Prioritas</th>
                    <th className="px-4 py-3">Deadline</th>
                    <th className="px-4 py-3 text-right">Status Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagedListTasks.map((task) => (
                    <tr
                      key={task.id}
                      onClick={() => {
                        playClickSound("soft");
                        setSelectedDetailTask(task);
                      }}
                      title="Klik untuk melihat detail lengkap task"
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3 max-w-sm">
                        <div className="font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {task.description}
                          </div>
                        )}
                        {task.status === "BLOCKED" && task.blockedReason && (
                          <div className="mt-1.5 p-1.5 bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-700 flex items-start gap-1">
                            <AlertTriangle className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
                            <span>{task.blockedReason}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {task.projectName ? (
                          <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/50 inline-block">
                            {task.projectName}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{task.primaryPicName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded-md border ${getPriorityBadge(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 text-[11px]">
                        {task.deadline ? formatDateWIB(task.deadline) : "-"}
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={task.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleStatusChange(task, e.target.value as TaskStatus);
                          }}
                          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-medium text-slate-800 cursor-pointer focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:bg-slate-100 transition-colors"
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="BLOCKED">Blocked</option>
                          <option value="DONE">Done</option>
                        </select>
                      </td>
                    </tr>
                  ))}

                  {listTasks.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-slate-400">
                        <CheckSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-xs text-slate-700">
                          Tidak ada task yang cocok
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Coba ubah kata kunci pencarian atau filter status yang dipilih.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Shared Pagination Controls for List View */}
          {listTasks.length > 0 && (
            <div className="pt-2">
              <Pagination
                currentPage={safeListPage}
                totalItems={listTasks.length}
                pageSize={LIST_PAGE_SIZE}
                onPageChange={(page) => {
                  setListCurrentPage(page);
                }}
                itemLabel="task"
              />
            </div>
          )}
        </div>
      )}

      {/* MODAL BLOCKED REASON */}
      {blockedModalTask && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] modal-backdrop-clean flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-ios-fade">
            <div className="w-full max-w-md max-h-[88vh] flex flex-col bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden animate-ios-scale relative">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-white">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-slate-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Tandai Task sebagai Blocked
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1">
                      Task: &quot;{blockedModalTask.title}&quot;
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setBlockedModalTask(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmBlocked} className="flex flex-col min-h-0 flex-1">
                {/* Scrollable Form Body */}
                <div className="px-6 py-5 overflow-y-auto flex-1 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Alasan Hambatan / Data yang Ditunggu <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Jelaskan kendala teknis atau materi yang masih ditunggu dari pihak klien..."
                      value={blockedReasonInput}
                      onChange={(e) => setBlockedReasonInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
                    />
                  </div>
                </div>

                {/* Sticky Modal Footer */}
                <div className="px-6 py-4 border-t border-slate-200/80 flex items-center justify-end gap-3 shrink-0 bg-slate-50/90 rounded-b-2xl">
                  <button
                    type="button"
                    onClick={() => setBlockedModalTask(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200/90 rounded-lg transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    Simpan Status Blocked
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL TAMBAH TASK BARU */}
      {isCreateOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] modal-backdrop-clean flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-ios-fade">
            <div className="w-full max-w-md max-h-[88vh] flex flex-col bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-white">
                <h3 className="text-base font-bold text-slate-900">
                  Tambah Task Baru
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="flex flex-col min-h-0 flex-1">
                {/* Scrollable Form Body */}
                <div className="px-6 py-5 overflow-y-auto flex-1 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Judul Task <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Misal: Slicing UI Header & Banner Promo"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Proyek Terkait (Opsional)
                    </label>
                    <select
                      value={newTaskProjId}
                      onChange={(e) => setNewTaskProjId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                    >
                      <option value="">Task Perusahaan Umum (Non-Proyek)</option>
                      {projectsList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Prioritas
                      </label>
                      <select
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Deadline
                      </label>
                      <input
                        type="date"
                        value={newTaskDeadline}
                        onChange={(e) => setNewTaskDeadline(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Deskripsi / Kriteria Selesai
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Rincian checklist pengerjaan..."
                      value={newTaskDesc}
                      onChange={(e) => setNewTaskDesc(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Sticky Modal Footer */}
                <div className="px-6 py-4 border-t border-slate-200/80 flex items-center justify-end gap-3 shrink-0 bg-slate-50/90 rounded-b-2xl">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200/90 rounded-lg transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? "Menyimpan..." : "Simpan Task"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL DETAIL TASK LENGKAP */}
      <TaskDetailModal
        task={selectedDetailTask}
        isOpen={!!selectedDetailTask}
        onClose={() => setSelectedDetailTask(null)}
        onStatusChange={(task, newStatus, reason) => {
          handleStatusChange(task, newStatus, reason);
        }}
      />
    </div>
  );
}
