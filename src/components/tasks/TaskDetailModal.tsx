"use client";

import { useState } from "react";
import {
  X,
  CheckSquare,
  Clock,
  Calendar,
  User,
  Users,
  AlertTriangle,
  FolderGit2,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { Task } from "@/modules/projects/types";
import { TaskPriority, TaskStatus } from "@/types/enums";
import { formatDateWIB, formatDateTimeWIB } from "@/lib/date";
import { ModalPortal } from "@/components/common/ModalPortal";
import { playClickSound } from "@/lib/audio";

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (task: Task, newStatus: TaskStatus, reason?: string) => void;
}

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  onStatusChange,
}: TaskDetailModalProps) {
  if (!isOpen || !task) return null;

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case "URGENT":
        return "bg-rose-100 text-rose-800 border-rose-300 font-bold";
      case "HIGH":
        return "bg-amber-100 text-amber-800 border-amber-300 font-semibold";
      case "MEDIUM":
        return "bg-blue-50 text-blue-700 border-blue-200 font-medium";
      case "LOW":
        return "bg-slate-100 text-slate-700 border-slate-200 font-medium";
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case "TODO":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "IN_PROGRESS":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "BLOCKED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "DONE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case "TODO":
        return "To Do";
      case "IN_PROGRESS":
        return "In Progress";
      case "BLOCKED":
        return "Blocked (Terkendala)";
      case "DONE":
        return "Done (Selesai)";
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] modal-backdrop-clean flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-ios-fade">
        <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden animate-ios-scale">
          {/* Header Modal */}
          <div className="px-6 py-4 border-b border-slate-200/80 flex items-start justify-between shrink-0 bg-white">
            <div className="space-y-1.5 pr-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${getPriorityBadge(
                    task.priority
                  )}`}
                >
                  Prioritas: {task.priority}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getStatusBadge(
                    task.status
                  )}`}
                >
                  {getStatusLabel(task.status)}
                </span>
                {task.isOverdue && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                    Overdue
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {task.title}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => {
                playClickSound("soft");
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
              title="Tutup (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Detail Task */}
          <div className="px-6 py-5 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700">
            {/* Proyek Terkait */}
            <div className="flex items-center gap-2 p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl">
              <FolderGit2 className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="flex-1 truncate">
                <span className="text-[10px] text-slate-400 font-medium block">
                  Proyek Terkait
                </span>
                <span className="font-semibold text-slate-900 text-xs truncate">
                  {task.projectName || "Task Umum Perusahaan (Non-Proyek)"}
                </span>
              </div>
            </div>

            {/* Alert Status Blocked jika ada kendala */}
            {task.status === "BLOCKED" && task.blockedReason && (
              <div className="p-3.5 bg-rose-50 border border-rose-200/90 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-rose-900 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Kendala / Hambatan Teknis (Blocked)</span>
                </div>
                <p className="text-[11px] text-rose-800 leading-relaxed pl-5 whitespace-pre-wrap">
                  {task.blockedReason}
                </p>
              </div>
            )}

            {/* Rincian Deskripsi / Kriteria Selesai */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider block">
                Deskripsi & Kriteria Pengerjaan
              </span>
              <div className="p-4 bg-slate-50/60 border border-slate-200/80 rounded-xl">
                {task.description ? (
                  <p className="whitespace-pre-wrap text-slate-800 text-xs leading-relaxed font-sans">
                    {task.description}
                  </p>
                ) : (
                  <p className="text-slate-400 italic text-xs">
                    Belum ada deskripsi rincian yang ditambahkan untuk task ini.
                  </p>
                )}
              </div>
            </div>

            {/* Grid Informasi PIC & Tenggat Waktu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* PIC & Kolaborator */}
              <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Penanggung Jawab (PIC)
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                    {task.primaryPicName.charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-slate-900 truncate">
                      {task.primaryPicName}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Penanggung Jawab Utama
                    </div>
                  </div>
                </div>

                {task.collaboratorNames && task.collaboratorNames.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 block mb-1">
                      Kolaborator:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {task.collaboratorNames.map((name, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-100 rounded text-[11px] text-slate-700"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Deadline & Riwayat */}
              <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Tenggat & Riwayat
                </span>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Deadline:
                    </span>
                    <span className="font-semibold text-slate-900 font-mono">
                      {task.deadline ? formatDateWIB(task.deadline) : "Tidak ditentukan"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Dibuat:
                    </span>
                    <span className="text-slate-700 font-mono">
                      {formatDateTimeWIB(task.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Terakhir Update:</span>
                    <span className="text-slate-700 font-mono">
                      {formatDateTimeWIB(task.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Status Action Toolbar */}
            {onStatusChange && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Ubah Status Task Cepat:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound("soft");
                      onStatusChange(task, "TODO");
                    }}
                    className={`px-3 py-2 rounded-lg font-semibold text-xs border transition-all text-center cursor-pointer ${
                      task.status === "TODO"
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    To Do
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playClickSound("soft");
                      onStatusChange(task, "IN_PROGRESS");
                    }}
                    className={`px-3 py-2 rounded-lg font-semibold text-xs border transition-all text-center cursor-pointer ${
                      task.status === "IN_PROGRESS"
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    In Progress
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playClickSound("soft");
                      onStatusChange(task, "BLOCKED");
                    }}
                    className={`px-3 py-2 rounded-lg font-semibold text-xs border transition-all text-center cursor-pointer ${
                      task.status === "BLOCKED"
                        ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Blocked
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playClickSound("soft");
                      onStatusChange(task, "DONE");
                    }}
                    className={`px-3 py-2 rounded-lg font-semibold text-xs border transition-all text-center cursor-pointer ${
                      task.status === "DONE"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Modal Footer */}
          <div className="px-6 py-3.5 border-t border-slate-200/80 flex items-center justify-between shrink-0 bg-slate-50/90 rounded-b-2xl">
            <span className="text-[11px] text-slate-400 font-mono">
              Task ID: {task.id}
            </span>
            <button
              type="button"
              onClick={() => {
                playClickSound("soft");
                onClose();
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
