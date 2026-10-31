"use client";

import { useState, useEffect } from "react";
import {
  Folder,
  Upload,
  Plus,
  Search,
  Grid,
  List as ListIcon,
  Star,
  Download,
  Eye,
  Trash2,
  MoreVertical,
  HardDrive,
  ChevronRight,
  FolderPlus,
  Edit3,
  FolderSymlink,
  CheckCircle2,
  FileText,
  Layers,
  ArrowUpDown,
} from "lucide-react";
import {
  DriveBreadcrumb,
  DriveFilterCategory,
  DriveItem,
  DriveStats,
} from "@/modules/drive/types";
import {
  deleteDriveItemAction,
  fetchDriveBreadcrumbsAction,
  fetchDriveItemsAction,
  fetchDriveStatsAction,
  toggleStarDriveItemAction,
} from "@/modules/drive/drive.actions";
import { formatBytes, getFileCategory, getFileIcon, getFolderColorStyle } from "./DriveHelpers";
import { CreateFolderModal } from "./CreateFolderModal";
import { FileUploadModal } from "./FileUploadModal";
import { FilePreviewModal } from "./FilePreviewModal";
import { RenameItemModal } from "./RenameItemModal";
import { MoveItemModal } from "./MoveItemModal";
import { formatDateWIB } from "@/lib/date";
import { playClickSound } from "@/lib/audio";
import { useToast } from "@/components/common/Toast";
import { ModalPortal } from "@/components/common/ModalPortal";

interface DriveViewProps {
  initialItems: DriveItem[];
  initialStats: DriveStats;
  currentUser: {
    id: string;
    name: string;
    role: string;
  };
}

export function DriveView({
  initialItems,
  initialStats,
  currentUser,
}: DriveViewProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<DriveItem[]>(initialItems);
  const [stats, setStats] = useState<DriveStats>(initialStats);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<DriveBreadcrumb[]>([
    { id: null, name: "HQ Drive" },
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<DriveFilterCategory>("ALL");
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("GRID");
  const [sortBy, setSortBy] = useState<"NAME" | "DATE" | "SIZE">("NAME");

  // Modals
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<DriveItem | null>(null);
  const [renameItem, setRenameItem] = useState<DriveItem | null>(null);
  const [moveItem, setMoveItem] = useState<DriveItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<DriveItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Active Menu Dropdown ID
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Refresh items when currentFolderId, searchQuery, or activeFilter changes
  const reloadItems = async (folderId = currentFolderId) => {
    const freshItems = await fetchDriveItemsAction({
      parentId: folderId,
      search: searchQuery || undefined,
      filter: activeFilter,
      isStarred: activeFilter === "STARRED",
    });
    setItems(freshItems);

    const freshBreadcrumbs = await fetchDriveBreadcrumbsAction(folderId);
    setBreadcrumbs(freshBreadcrumbs);

    const freshStats = await fetchDriveStatsAction();
    setStats(freshStats);
  };

  useEffect(() => {
    reloadItems(currentFolderId);
  }, [currentFolderId, activeFilter]);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    const freshItems = await fetchDriveItemsAction({
      parentId: q.trim() ? undefined : currentFolderId,
      search: q.trim() || undefined,
      filter: activeFilter,
      isStarred: activeFilter === "STARRED",
    });
    setItems(freshItems);
  };

  const navigateToFolder = (folderId: string | null) => {
    playClickSound("soft");
    setSearchQuery("");
    setCurrentFolderId(folderId);
    setActiveMenuId(null);
  };

  const handleToggleStar = async (item: DriveItem) => {
    playClickSound("soft");
    const res = await toggleStarDriveItemAction(item.id);
    if (res.success) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isStarred: res.isStarred } : i))
      );
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);

    const res = await deleteDriveItemAction(itemToDelete.id);
    if (res.success) {
      toast.success(
        `${itemToDelete.type === "FOLDER" ? "Folder" : "File"} "${itemToDelete.name}" berhasil dihapus`
      );
      setItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
      setItemToDelete(null);
      const freshStats = await fetchDriveStatsAction();
      setStats(freshStats);
    } else {
      toast.error(res.error || "Gagal menghapus item.");
    }
    setIsDeleting(false);
  };

  // Group items into Folders and Files
  const folders = items.filter((i) => i.type === "FOLDER");
  const files = items.filter((i) => i.type === "FILE");

  // Sorting
  const sortItems = <T extends DriveItem>(arr: T[]): T[] => {
    return [...arr].sort((a, b) => {
      if (sortBy === "NAME") return a.name.localeCompare(b.name);
      if (sortBy === "DATE") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (sortBy === "SIZE") return b.size - a.size;
      return 0;
    });
  };

  const sortedFolders = sortItems(folders);
  const sortedFiles = sortItems(files);

  // Storage calculation percentage
  const usedPercent = Math.min(
    100,
    Math.max(1, (stats.totalStorageBytes / stats.storageLimitBytes) * 100)
  );

  const FILTER_TABS: Array<{ label: string; value: DriveFilterCategory }> = [
    { label: "Semua File", value: "ALL" },
    { label: "Folder", value: "FOLDER" },
    { label: "Dokumen", value: "DOCUMENT" },
    { label: "Gambar & Desain", value: "IMAGE" },
    { label: "Media Audio/Video", value: "MEDIA" },
    { label: "Arsip (ZIP)", value: "ARCHIVE" },
    { label: "Berbintang", value: "STARRED" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header & Quota Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-50 text-blue-700 border border-blue-200/70 rounded-md">
                <HardDrive className="w-4 h-4" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Shared Drive HQ — Fynux OS
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Direktori file bersama internal tim Fynux OS. Terenkripsi, berkecepatan tinggi, dan tersimpan persisten di server Ubuntu VPS.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                playClickSound("soft");
                setIsCreateFolderOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            >
              <FolderPlus className="w-4 h-4 text-blue-600" />
              <span>Folder Baru</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playClickSound("soft");
                setIsUploadOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload File</span>
            </button>
          </div>
        </div>

        {/* Quota Progress Bar Banner */}
        <div className="p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">Kapasitas Penyimpanan HQ:</span>
              <span className="font-mono text-slate-600">
                {formatBytes(stats.totalStorageBytes)} terpakai dari {formatBytes(stats.storageLimitBytes)} (100 GB VPS Root Storage)
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/50 w-fit">
              {stats.totalFiles} File • {stats.totalFolders} Folder
            </span>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${usedPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Drive Workspace Panel */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col min-h-[600px]">
        {/* Navigation & Controls Toolbar */}
        <div className="p-4 border-b border-slate-200/80 space-y-3 bg-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Breadcrumb Path Navigation */}
            <div className="flex items-center gap-1.5 text-xs overflow-x-auto scrollbar-none py-1">
              {breadcrumbs.map((b, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <div key={idx} className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => navigateToFolder(b.id)}
                      className={`font-semibold hover:text-blue-600 transition-colors cursor-pointer ${
                        isLast ? "text-slate-900 font-bold" : "text-slate-500"
                      }`}
                    >
                      {b.name}
                    </button>
                    {!isLast && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  </div>
                );
              })}
            </div>

            {/* Search Bar & Layout Switcher */}
            <div className="flex items-center gap-2.5">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari file, ekstensi, uploader..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors shadow-2xs"
                />
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "NAME" | "DATE" | "SIZE")}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 font-medium text-slate-700 cursor-pointer shadow-2xs"
              >
                <option value="NAME">Nama (A-Z)</option>
                <option value="DATE">Terbaru</option>
                <option value="SIZE">Ukuran</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound("soft");
                    setViewMode("GRID");
                  }}
                  className={`p-1 rounded-md transition-colors cursor-pointer ${
                    viewMode === "GRID" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Tampilan Grid (Bento)"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound("soft");
                    setViewMode("LIST");
                  }}
                  className={`p-1 rounded-md transition-colors cursor-pointer ${
                    viewMode === "LIST" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Tampilan Tabel (List)"
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1 border-t border-slate-100">
            {FILTER_TABS.map((tab) => {
              const isActive = activeFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => {
                    playClickSound("soft");
                    setActiveFilter(tab.value);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer border ${
                    isActive
                      ? "bg-slate-900 text-white border-slate-900 font-bold shadow-2xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 flex-1 space-y-6">
          {/* Folders Section (Only shown if folders exist and not filtered out) */}
          {sortedFolders.length > 0 && (
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Folder ({sortedFolders.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {sortedFolders.map((folder) => {
                  const style = getFolderColorStyle(folder.color);
                  return (
                    <div
                      key={folder.id}
                      onDoubleClick={() => navigateToFolder(folder.id)}
                      className={`p-3.5 rounded-xl border ${style.border} ${style.bg} hover:shadow-md transition-all flex items-center justify-between group cursor-pointer`}
                      title="Klik ganda untuk membuka folder"
                    >
                      <div
                        className="flex items-center gap-3 truncate min-w-0 flex-1"
                        onClick={() => navigateToFolder(folder.id)}
                      >
                        <Folder className={`w-5 h-5 ${style.icon} shrink-0`} />
                        <div className="truncate">
                          <span className="text-xs font-bold text-slate-900 truncate block">
                            {folder.name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {folder.itemCount || 0} item
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStar(folder);
                          }}
                          className={`p-1 rounded hover:bg-white/80 transition-colors cursor-pointer ${
                            folder.isStarred ? "text-amber-500" : "text-slate-400 opacity-0 group-hover:opacity-100"
                          }`}
                          title={folder.isStarred ? "Hapus dari Berbintang" : "Tandai Berbintang"}
                        >
                          <Star className={`w-3.5 h-3.5 ${folder.isStarred ? "fill-amber-500" : ""}`} />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === folder.id ? null : folder.id);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-white/80 transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuId === folder.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-7 w-40 bg-white border border-slate-200 rounded-lg shadow-xl z-20 py-1 text-xs"
                          >
                            <button
                              type="button"
                              onClick={() => navigateToFolder(folder.id)}
                              className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Folder className="w-3.5 h-3.5 text-slate-400" />
                              <span>Buka Folder</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRenameItem(folder);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                              <span>Ganti Nama</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setMoveItem(folder);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                            >
                              <FolderSymlink className="w-3.5 h-3.5 text-slate-400" />
                              <span>Pindahkan</span>
                            </button>
                            <div className="border-t border-slate-100 my-1" />
                            <button
                              type="button"
                              onClick={() => {
                                setItemToDelete(folder);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer font-medium"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus Folder</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Files Section */}
          {sortedFiles.length > 0 && (
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                File ({sortedFiles.length})
              </span>

              {/* GRID VIEW */}
              {viewMode === "GRID" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
                  {sortedFiles.map((file) => (
                    <div
                      key={file.id}
                      onDoubleClick={() => {
                        playClickSound("soft");
                        setPreviewItem(file);
                      }}
                      className="bg-white border border-slate-200/90 rounded-xl p-4 space-y-3 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group cursor-pointer"
                      title="Klik ganda untuk membuka pratinjau file"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 shrink-0">
                          {getFileIcon(file.extension, "w-6 h-6")}
                        </div>

                        <div className="flex items-center gap-1 shrink-0 relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStar(file);
                            }}
                            className={`p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer ${
                              file.isStarred ? "text-amber-500" : "text-slate-400 opacity-0 group-hover:opacity-100"
                            }`}
                            title={file.isStarred ? "Hapus dari Berbintang" : "Tandai Berbintang"}
                          >
                            <Star className={`w-3.5 h-3.5 ${file.isStarred ? "fill-amber-500" : ""}`} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === file.id ? null : file.id);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {/* File Dropdown Menu */}
                          {activeMenuId === file.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-7 w-44 bg-white border border-slate-200 rounded-lg shadow-xl z-20 py-1 text-xs"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewItem(file);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-400" />
                                <span>Pratinjau File</span>
                              </button>
                              <a
                                href={`/api/drive/download/${file.id}`}
                                download={file.name}
                                onClick={() => setActiveMenuId(null)}
                                className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5 text-slate-400" />
                                <span>Download File</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => {
                                  setRenameItem(file);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                                <span>Ganti Nama</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMoveItem(file);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                              >
                                <FolderSymlink className="w-3.5 h-3.5 text-slate-400" />
                                <span>Pindahkan</span>
                              </button>
                              <div className="border-t border-slate-100 my-1" />
                              <button
                                type="button"
                                onClick={() => {
                                  setItemToDelete(file);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer font-medium"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus File</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-900 truncate leading-snug">
                          {file.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                          <span>{formatBytes(file.size)}</span>
                          <span>•</span>
                          <span>{formatDateWIB(file.createdAt)}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                        <span className="truncate">Oleh {file.uploadedByUserName}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewItem(file);
                          }}
                          className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                        >
                          Lihat
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* LIST / TABLE VIEW */}
              {viewMode === "LIST" && (
                <div className="border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="px-4 py-3">Nama File</th>
                          <th className="px-4 py-3">Tipe</th>
                          <th className="px-4 py-3">Ukuran</th>
                          <th className="px-4 py-3">Diupload Oleh</th>
                          <th className="px-4 py-3">Tanggal</th>
                          <th className="px-4 py-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sortedFiles.map((file) => (
                          <tr
                            key={file.id}
                            onDoubleClick={() => setPreviewItem(file)}
                            className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                          >
                            <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2.5 max-w-sm truncate">
                              {getFileIcon(file.extension, "w-4 h-4 shrink-0")}
                              <span className="truncate">{file.name}</span>
                              {file.isStarred && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                            </td>
                            <td className="px-4 py-3 text-[11px] text-slate-500">
                              {getFileCategory(file.extension)}
                            </td>
                            <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                              {formatBytes(file.size)}
                            </td>
                            <td className="px-4 py-3 text-[11px]">
                              {file.uploadedByUserName}
                            </td>
                            <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                              {formatDateWIB(file.createdAt)}
                            </td>
                            <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setPreviewItem(file)}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                  title="Pratinjau"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <a
                                  href={`/api/drive/download/${file.id}`}
                                  download={file.name}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                  title="Download"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => setItemToDelete(file)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Hapus"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {sortedFolders.length === 0 && sortedFiles.length === 0 && (
            <div className="py-20 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto text-slate-400">
                <Folder className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">
                {searchQuery
                  ? `Tidak ada file yang cocok dengan "${searchQuery}"`
                  : "Folder ini masih kosong"}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Mulai unggah dokumen atau buat folder baru untuk mengorganisasi file tim HQ Fynux.
              </p>
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(true)}
                  className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 cursor-pointer shadow-sm"
                >
                  Upload File Sekarang
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        currentParentId={currentFolderId}
        currentParentName={breadcrumbs[breadcrumbs.length - 1]?.name}
        onSuccess={() => reloadItems(currentFolderId)}
      />

      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        currentParentId={currentFolderId}
        currentParentName={breadcrumbs[breadcrumbs.length - 1]?.name}
        onSuccess={() => reloadItems(currentFolderId)}
      />

      <FilePreviewModal
        item={previewItem}
        isOpen={!!previewItem}
        onClose={() => setPreviewItem(null)}
      />

      <RenameItemModal
        item={renameItem}
        isOpen={!!renameItem}
        onClose={() => setRenameItem(null)}
        onSuccess={() => reloadItems(currentFolderId)}
      />

      <MoveItemModal
        item={moveItem}
        isOpen={!!moveItem}
        onClose={() => setMoveItem(null)}
        allFolders={items.filter((i) => i.type === "FOLDER")}
        onSuccess={() => reloadItems(currentFolderId)}
      />

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] modal-backdrop-clean flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-ios-fade">
            <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 animate-ios-scale">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg shrink-0 border border-rose-200/60">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Konfirmasi Hapus {itemToDelete.type === "FOLDER" ? "Folder" : "File"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Apakah Anda yakin ingin menghapus &quot;{itemToDelete.name}&quot;?
                    {itemToDelete.type === "FOLDER" && (
                      <span className="text-rose-600 block mt-1 font-semibold">
                        Peringatan: Seluruh file dan subfolder di dalamnya juga akan dihapus permanen dari VPS.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isDeleting ? "Menghapus..." : "Ya, Hapus Permanen"}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
