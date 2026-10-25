"use client";

import { useState } from "react";
import {
  CheckSquare,
  Plus,
  Clock,
  AlertTriangle,
  User,
  Users,
  ChevronRight,
  X,
  Calendar,
  Layers,
} from "lucide-react";
import { CreateTaskInput, Task } from "@/modules/projects/types";
import { TaskPriority, TaskStatus } from "@/types/enums";
import { createTaskAction, updateTaskStatusAction } from "@/modules/projects/projects.actions";
import { formatDateWIB } from "@/lib/date";

interface TaskManagerViewProps {
  initialTasks: Task[];
  projectsList: Array<{ id: string; name: string }>;
  currentUserId?: string;
}

const COLUMNS: Array<{ label: string; status: TaskStatus; color: string }> = [
  { label: "To Do", status: "TODO", color: "border-slate-300" },
  { label: "In Progress", status: "IN_PROGRESS", color: "border-indigo-400" },
  { label: "Blocked (Ada Kendala)", status: "BLOCKED", color: "border-rose-400" },
  { label: "Done (Selesai)", status: "DONE", color: "border-emerald-400" },
];

export function TaskManagerView({
  initialTasks,
  projectsList,
  currentUserId,
}: TaskManagerViewProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [blockedModalTask, setBlockedModalTask] = useState<Task | null>(null);
  const [blockedReasonInput, setBlockedReasonInput] = useState("");

  // Create Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskProjId, setNewTaskProjId] = useState(projectsList[0]?.id || "");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("MEDIUM");
  const [newTaskDeadline, setNewTaskDeadline] = useState(
    new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStatusChange = async (task: Task, nextStatus: TaskStatus) => {
    if (nextStatus === "BLOCKED") {
      setBlockedModalTask(task);
      setBlockedReasonInput("");
      return;
    }

    await updateTaskStatusAction(task.id, nextStatus);
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus, blockedReason: undefined } : t))
    );
  };

  const handleConfirmBlocked = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockedModalTask) return;

    await updateTaskStatusAction(
      blockedModalTask.id,
      "BLOCKED",
      blockedReasonInput || "Terkendala kelengkapan data klien"
    );

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
      setTasks((prev) => [res.task!, ...prev]);
      setIsCreateOpen(false);
      setNewTaskTitle("");
      setNewTaskDesc("");
    }
    setIsSubmitting(false);
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case "URGENT":
        return "bg-rose-100 text-rose-800 border-rose-200 font-bold";
      case "HIGH":
        return "bg-amber-100 text-amber-800 border-amber-200 font-semibold";
      case "MEDIUM":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "LOW":
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Universal To-Do Board (Mandiri Tanpa Dependensi)
          </h2>
          <p className="text-xs text-slate-500">
            Tepat 1 PIC utama per task, kolaborator pendukung, dan deteksi blocker.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Task Baru
        </button>
      </div>

      {/* 4 Columns Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.status);

          return (
            <div
              key={col.status}
              className={`bg-slate-50 rounded-2xl border-t-4 ${col.color} border-slate-200 border-x border-b p-4 space-y-3 shadow-sm min-h-[450px] flex flex-col`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {col.label}
                </span>
                <span className="text-xs font-bold bg-white text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks List */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-[9px] px-2 py-0.2 rounded-full border ${getPriorityBadge(
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

                    <h4 className="text-xs font-bold text-slate-900 leading-snug">
                      {task.title}
                    </h4>

                    {task.projectName && (
                      <div className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded w-fit">
                        {task.projectName}
                      </div>
                    )}

                    {task.description && (
                      <p className="text-[11px] text-slate-600 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    {task.status === "BLOCKED" && task.blockedReason && (
                      <div className="p-2 bg-rose-50 border border-rose-200 rounded text-[11px] text-rose-800 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0 mt-0.5" />
                        <span>{task.blockedReason}</span>
                      </div>
                    )}

                    {/* Footer Task: PIC & Status Changer */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1 text-slate-600">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold">{task.primaryPicName}</span>
                      </div>

                      <select
                        value={task.status}
                        onChange={(e) =>
                          handleStatusChange(task, e.target.value as TaskStatus)
                        }
                        className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 font-medium text-slate-700"
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
                  <div className="text-center py-12 text-slate-400 text-xs italic">
                    Kosong
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL BLOCKED REASON */}
      {blockedModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              Tandai Task sebagai Blocked
            </h3>
            <p className="text-xs text-slate-500">
              Task: &quot;{blockedModalTask.title}&quot;
            </p>
            <form onSubmit={handleConfirmBlocked} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alasan Hambatan / Data yang Ditunggu <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Jelaskan kendala teknis atau materi yang masih ditunggu dari pihak klien..."
                  value={blockedReasonInput}
                  onChange={(e) => setBlockedReasonInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-rose-300 bg-rose-50 rounded-lg focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBlockedModalTask(null)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Simpan Status Blocked
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH TASK BARU */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Tambah Task Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
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
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Proyek Terkait (Opsional)
                </label>
                <select
                  value={newTaskProjId}
                  onChange={(e) => setNewTaskProjId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
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
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
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
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
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
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3.5 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
