"use client";

import { useState } from "react";
import {
  X,
  Briefcase,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderOpen,
  ExternalLink,
  MessageSquare,
  Send,
  Plus,
  Layers,
  Calendar,
} from "lucide-react";
import { ExternalLink as ExternalLinkType, Project } from "@/modules/projects/types";
import { ProjectStatus } from "@/types/enums";
import {
  addProjectExternalLinkAction,
  sendProjectChatMessageAction,
  updateProjectProgressAction,
  updateProjectStatusAction,
} from "@/modules/projects/projects.actions";
import { formatDateWIB, formatDateTimeWIB } from "@/lib/date";

interface ProjectDetailModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  currentUserId?: string;
  isOwner?: boolean;
}

export function ProjectDetailModal({
  project,
  isOpen,
  onClose,
  onRefresh,
  currentUserId,
  isOwner = true,
}: ProjectDetailModalProps) {
  if (!isOpen || !project) return null;

  const [activeTab, setActiveTab] = useState<"WORKSPACE" | "CHAT" | "LINKS">("WORKSPACE");
  const [progressVal, setProgressVal] = useState<number>(project.progressPercent);
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus>(project.status);
  const [onHoldReason, setOnHoldReason] = useState(project.onHoldReason || "");
  const [chatInput, setChatInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Link State
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkCategory, setNewLinkCategory] = useState<ExternalLinkType["category"]>("DOCUMENT");

  const handleUpdateProgress = async () => {
    setIsSubmitting(true);
    await updateProjectProgressAction(project.id, progressVal);
    setIsSubmitting(false);
    onRefresh();
  };

  const handleUpdateStatus = async () => {
    setIsSubmitting(true);
    await updateProjectStatusAction(
      project.id,
      selectedStatus,
      selectedStatus === "ON_HOLD" ? onHoldReason : undefined
    );
    setIsSubmitting(false);
    onRefresh();
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setIsSubmitting(true);
    await sendProjectChatMessageAction(project.id, chatInput);
    setChatInput("");
    setIsSubmitting(false);
    onRefresh();
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) return;

    setIsSubmitting(true);
    await addProjectExternalLinkAction(
      project.id,
      newLinkTitle,
      newLinkUrl,
      newLinkCategory
    );
    setNewLinkTitle("");
    setNewLinkUrl("");
    setIsSubmitting(false);
    onRefresh();
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(
                  project.status
                )}`}
              >
                {project.status}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Klien: {project.clientName}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-1">
              {project.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 border-b border-slate-200 flex gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("WORKSPACE")}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === "WORKSPACE"
                ? "border-indigo-600 text-indigo-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Workspace & Ruang Lingkup
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("LINKS")}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "LINKS"
                ? "border-indigo-600 text-indigo-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>Berkas Google Drive</span>
            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full text-[10px]">
              {project.externalLinks.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("CHAT")}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "CHAT"
                ? "border-indigo-600 text-indigo-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>Project Chat Internal</span>
            <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded-full text-[10px]">
              {project.chatMessages?.length || 0}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
          {/* TAB 1: WORKSPACE */}
          {activeTab === "WORKSPACE" && (
            <div className="space-y-5">
              {/* Progress Slider */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Persentase Progres Pengerjaan</span>
                  <span className="font-extrabold text-indigo-700 font-mono text-sm">
                    {progressVal}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progressVal}
                  onChange={(e) => setProgressVal(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleUpdateProgress}
                    disabled={isSubmitting || progressVal === project.progressPercent}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors"
                  >
                    Simpan Progres
                  </button>
                </div>
              </div>

              {/* Status Update Card */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-900">
                  Ubah Status Lifecycle Proyek
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Status Proyek
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value as ProjectStatus)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="ACTIVE">Active (Sedang Dikerjakan)</option>
                      <option value="ON_HOLD">On Hold (Ditunda / Blocker)</option>
                      <option value="COMPLETED">Completed (Selesai Serah Terima)</option>
                      {isOwner && <option value="CANCELLED">Cancelled (Dibatalkan Owner)</option>}
                      <option value="ARCHIVED">Archived (Diarsipkan)</option>
                    </select>
                  </div>

                  {selectedStatus === "ON_HOLD" && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Alasan On Hold <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Menunggu materi dari pihak klien..."
                        value={onHoldReason}
                        onChange={(e) => setOnHoldReason(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-amber-300 bg-amber-50 rounded-lg"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleUpdateStatus}
                    disabled={isSubmitting || selectedStatus === project.status}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                  >
                    Perbarui Status Proyek
                  </button>
                </div>
              </div>

              {/* Scope Description */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold">
                  <Briefcase className="w-4 h-4" />
                  Ruang Lingkup Deliverables (Scope of Work)
                </div>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
                  {project.scopeDescription}
                </p>
              </div>

              {/* Info Anggota & Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 font-medium">Target Deadline:</span>
                  <div className="text-slate-800 font-bold mt-0.5">
                    {formatDateWIB(project.deadline)}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 font-medium">Tim Pelaksana:</span>
                  <div className="text-slate-800 font-bold mt-0.5">
                    {project.assignedMemberNames.join(", ")}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LINKS (GOOGLE DRIVE / FIGMA) */}
          {activeTab === "LINKS" && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-900">
                <strong>Kebijakan Berkas Fynux OS:</strong> Dokumen proyek besar disimpan di Google Drive / Figma / GitHub. Sistem menyimpan tautan eksternal terorganisir.
              </div>

              {/* Form Tambah Link Baru */}
              <form onSubmit={handleAddLink} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-indigo-600" /> Tambah Tautan Berkas Eksternal
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Judul Berkas (misal: Aset Logo & Foto)"
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    className="sm:col-span-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                  <input
                    type="url"
                    required
                    placeholder="https://drive.google.com/..."
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    className="sm:col-span-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                  <select
                    value={newLinkCategory}
                    onChange={(e) =>
                      setNewLinkCategory(e.target.value as ExternalLinkType["category"])
                    }
                    className="px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="DOCUMENT">Dokumen (Google Drive)</option>
                    <option value="DESIGN">Desain (Figma)</option>
                    <option value="REPOSITORY">Source Code (GitHub)</option>
                    <option value="OTHER">Lainnya</option>
                  </select>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                  >
                    Simpan Tautan
                  </button>
                </div>
              </form>

              {/* Daftar Link Tersimpan */}
              <div className="space-y-2">
                {project.externalLinks.map((link) => (
                  <div
                    key={link.id}
                    className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{link.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate max-w-sm">
                        {link.url}
                      </div>
                    </div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition-colors"
                    >
                      Buka <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PROJECT CHAT */}
          {activeTab === "CHAT" && (
            <div className="space-y-4 flex flex-col h-[400px]">
              <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-slate-50/60 rounded-xl border border-slate-200">
                {project.chatMessages && project.chatMessages.length > 0 ? (
                  project.chatMessages.map((msg) => (
                    <div key={msg.id} className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-900">{msg.senderName}</span>
                        <span className="text-[10px] text-slate-400">
                          {formatDateTimeWIB(msg.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 text-xs text-slate-400">
                    Belum ada pesan internal pada project chat ini.
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChat} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Ketik pesan internal terkait proyek ini..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !chatInput.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
