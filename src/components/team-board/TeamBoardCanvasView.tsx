"use client";

import React, { useRef, useState } from "react";
import {
  Bell,
  BookOpen,
  Target,
  Lightbulb,
  Plus,
  Search,
  User,
  Calendar,
  X,
  FileText,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Upload,
  Trash2,
  Paperclip,
  Image as ImageIcon,
  ChevronDown,
  Layers,
  Edit3,
  Bold,
  Italic,
  Strikethrough,
  Type,
} from "lucide-react";
import { BoardAttachment, TeamBoardItem, TextStyleConfig } from "@/modules/projects/types";
import {
  createTeamBoardItemAction,
  deleteTeamBoardItemAction,
  updateTeamBoardItemAction,
  updateTeamBoardItemPositionAction,
} from "@/modules/projects/projects.actions";
import { DocumentPreviewModal } from "./DocumentPreviewModal";

interface TeamBoardCanvasViewProps {
  initialItems: TeamBoardItem[];
  currentUserRole?: string;
}

// Helper to determine whether an attachment is an image
function isImageAttachment(att: BoardAttachment): boolean {
  return (
    att.type.startsWith("image/") ||
    att.url.startsWith("data:image/") ||
    /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(att.name)
  );
}

// Helper to compile CSS classes for typography
function getStyleClasses(
  style?: TextStyleConfig,
  defaultSize: string = "text-xs",
  defaultWeight: string = "font-normal"
): string {
  let sizeClass: string = defaultSize;
  if (style?.size === "xs") sizeClass = "text-xs";
  else if (style?.size === "sm") sizeClass = "text-sm";
  else if (style?.size === "base") sizeClass = "text-base";
  else if (style?.size === "lg") sizeClass = "text-lg";
  else if (style?.size === "xl") sizeClass = "text-xl";

  const weightClass = style?.bold ? "font-bold" : defaultWeight;
  const italicClass = style?.italic ? "italic" : "";
  const strikeClass = style?.strikethrough ? "line-through text-slate-400 opacity-80" : "";

  return `${sizeClass} ${weightClass} ${italicClass} ${strikeClass}`.trim();
}

// Mini text styling toolbar component
interface TextFormatToolbarProps {
  label: string;
  style: TextStyleConfig;
  onChange: (updated: TextStyleConfig) => void;
  sizeOptions?: Array<{ label: string; value: TextStyleConfig["size"] }>;
}

function TextFormatToolbar({
  label,
  style,
  onChange,
  sizeOptions = [
    { label: "Normal", value: "sm" },
    { label: "Besar", value: "base" },
    { label: "XL", value: "lg" },
  ],
}: TextFormatToolbarProps) {
  return (
    <div className="flex items-center justify-between text-xs py-1 border-b border-slate-800/80 mb-1">
      <span className="text-[11px] font-semibold text-slate-400">{label}</span>
      <div className="flex items-center gap-1.5">
        {/* Size dropdown / pills */}
        <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
          {sizeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...style, size: opt.value })}
              className={`px-1.5 py-0.5 text-[10px] rounded font-medium transition-colors ${
                (style.size || sizeOptions[0].value) === opt.value
                  ? "bg-brand-orange text-white font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Bold Toggle */}
        <button
          type="button"
          onClick={() => onChange({ ...style, bold: !style.bold })}
          title="Tebal (Bold)"
          className={`p-1 rounded border transition-colors ${
            style.bold
              ? "bg-brand-orange/20 border-brand-orange text-brand-orange font-bold"
              : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
          }`}
        >
          <Bold className="w-3 h-3" />
        </button>

        {/* Italic Toggle */}
        <button
          type="button"
          onClick={() => onChange({ ...style, italic: !style.italic })}
          title="Miring (Italic)"
          className={`p-1 rounded border transition-colors ${
            style.italic
              ? "bg-brand-orange/20 border-brand-orange text-brand-orange"
              : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
          }`}
        >
          <Italic className="w-3 h-3" />
        </button>

        {/* Strikethrough Toggle */}
        <button
          type="button"
          onClick={() => onChange({ ...style, strikethrough: !style.strikethrough })}
          title="Coret (Strikethrough)"
          className={`p-1 rounded border transition-colors ${
            style.strikethrough
              ? "bg-brand-orange/20 border-brand-orange text-brand-orange"
              : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
          }`}
        >
          <Strikethrough className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export function TeamBoardCanvasView({
  initialItems,
  currentUserRole = "OWNER",
}: TeamBoardCanvasViewProps) {
  const [items, setItems] = useState<TeamBoardItem[]>(initialItems);
  const [selectedCategory, setSelectedCategory] = useState<
    "ALL" | "ANNOUNCEMENT" | "SOP" | "TARGET" | "IDEA"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Canvas Viewport Pan & Zoom State
  const [pan, setPan] = useState({ x: 30, y: 30 });
  const [zoom, setZoom] = useState(1.0);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Node Dragging State
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Node Resizing State
  const [resizingId, setResizingId] = useState<string | null>(null);
  const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, width: 380, height: 260 });

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<BoardAttachment | null>(null);

  // Form State (for both Create & Edit)
  const [category, setCategory] = useState<TeamBoardItem["category"]>("ANNOUNCEMENT");
  const [title, setTitle] = useState("");
  const [titleStyle, setTitleStyle] = useState<TextStyleConfig>({ size: "base", bold: true });
  const [subtitle, setSubtitle] = useState("");
  const [subtitleStyle, setSubtitleStyle] = useState<TextStyleConfig>({ size: "sm", bold: false });
  const [content, setContent] = useState("");
  const [contentStyle, setContentStyle] = useState<TextStyleConfig>({ size: "xs", bold: false });
  const [colorTheme, setColorTheme] = useState<TeamBoardItem["colorTheme"]>("indigo");
  const [attachments, setAttachments] = useState<BoardAttachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const canvasRef = useRef<HTMLDivElement>(null);

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesCategory =
      selectedCategory === "ALL" || item.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
      item.content.toLowerCase().includes(q) ||
      item.authorName.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  // Zoom handlers
  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.min(2.0, Math.max(0.3, Math.round((prev + delta) * 10) / 10)));
  };

  const handleResetView = () => {
    setPan({ x: 30, y: 30 });
    setZoom(1.0);
  };

  // Canvas Mouse Events for Panning, Dragging, Resizing
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".canvas-node")) return;
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
    } else if (draggingId) {
      const nodeX = (e.clientX - pan.x) / zoom - dragOffsetRef.current.x;
      const nodeY = (e.clientY - pan.y) / zoom - dragOffsetRef.current.y;
      setItems((prev) =>
        prev.map((item) =>
          item.id === draggingId
            ? { ...item, x: Math.round(nodeX), y: Math.round(nodeY) }
            : item
        )
      );
    } else if (resizingId) {
      const deltaX = (e.clientX - resizeStartRef.current.mouseX) / zoom;
      const deltaY = (e.clientY - resizeStartRef.current.mouseY) / zoom;
      const newWidth = Math.max(280, resizeStartRef.current.width + deltaX);
      const newHeight = Math.max(200, resizeStartRef.current.height + deltaY);

      setItems((prev) =>
        prev.map((item) =>
          item.id === resizingId
            ? { ...item, width: Math.round(newWidth), height: Math.round(newHeight) }
            : item
        )
      );
    }
  };

  const handleMouseUp = async () => {
    if (isPanning) {
      setIsPanning(false);
    }
    if (draggingId) {
      const draggedNode = items.find((i) => i.id === draggingId);
      if (draggedNode && draggedNode.x !== undefined && draggedNode.y !== undefined) {
        await updateTeamBoardItemPositionAction(
          draggedNode.id,
          draggedNode.x,
          draggedNode.y,
          draggedNode.width,
          draggedNode.height
        );
      }
      setDraggingId(null);
    }
    if (resizingId) {
      const resizedNode = items.find((i) => i.id === resizingId);
      if (resizedNode && resizedNode.x !== undefined && resizedNode.y !== undefined) {
        await updateTeamBoardItemPositionAction(
          resizedNode.id,
          resizedNode.x,
          resizedNode.y,
          resizedNode.width,
          resizedNode.height
        );
      }
      setResizingId(null);
    }
  };

  // Node Drag Start
  const handleNodeHeaderMouseDown = (e: React.MouseEvent, item: TeamBoardItem) => {
    e.stopPropagation();
    const itemX = item.x ?? 100;
    const itemY = item.y ?? 100;
    const mouseCanvasX = (e.clientX - pan.x) / zoom;
    const mouseCanvasY = (e.clientY - pan.y) / zoom;
    dragOffsetRef.current = {
      x: mouseCanvasX - itemX,
      y: mouseCanvasY - itemY,
    };
    setDraggingId(item.id);
  };

  // Node Resize Start
  const handleResizeMouseDown = (e: React.MouseEvent, item: TeamBoardItem) => {
    e.stopPropagation();
    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      width: item.width ?? 380,
      height: item.height ?? 260,
    };
    setResizingId(item.id);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: TeamBoardItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNodeId(item.id);
    setCategory(item.category);
    setTitle(item.title);
    setTitleStyle(item.titleStyle || { size: "base", bold: true });
    setSubtitle(item.subtitle || "");
    setSubtitleStyle(item.subtitleStyle || { size: "sm", bold: false });
    setContent(item.content);
    setContentStyle(item.contentStyle || { size: "xs", bold: false });
    setColorTheme(item.colorTheme || "indigo");
    setAttachments(item.attachments || []);
    setErrorMessage("");
    setIsModalOpen(true);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingNodeId(null);
    setCategory("ANNOUNCEMENT");
    setTitle("");
    setTitleStyle({ size: "base", bold: true });
    setSubtitle("");
    setSubtitleStyle({ size: "sm", bold: false });
    setContent("");
    setContentStyle({ size: "xs", bold: false });
    setColorTheme("indigo");
    setAttachments([]);
    setErrorMessage("");
    setIsModalOpen(true);
  };

  // Delete Node
  const handleDeleteNode = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Hapus kotak kanban ini dari team board?")) {
      await deleteTeamBoardItemAction(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  // File Upload Handlers (converts to base64 DataURL for instant local preview)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        const isImg = file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.name);
        const newAttachment: BoardAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          type: isImg ? "image" : file.type || "document",
          url,
        };
        setAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachment = (attId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  // Save Node (Create or Update)
  const handleSaveNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorMessage("Judul dan deskripsi wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      if (editingNodeId) {
        // Update existing node
        const updates: Partial<TeamBoardItem> = {
          category,
          title: title.trim(),
          titleStyle,
          subtitle: subtitle.trim() || undefined,
          subtitleStyle,
          content: content.trim(),
          contentStyle,
          colorTheme,
          attachments,
        };

        const res = await updateTeamBoardItemAction(editingNodeId, updates);
        if (res.success) {
          setItems((prev) =>
            prev.map((item) =>
              item.id === editingNodeId ? { ...item, ...updates } : item
            )
          );
          setIsModalOpen(false);
        } else {
          setErrorMessage(res.error || "Gagal memperbarui kotak kanban.");
        }
      } else {
        // Create new node in the visible canvas area
        const spawnX = Math.round((400 - pan.x) / zoom);
        const spawnY = Math.round((200 - pan.y) / zoom);

        const res = await createTeamBoardItemAction(category, title, content, {
          subtitle,
          titleStyle,
          subtitleStyle,
          contentStyle,
          colorTheme,
          attachments,
          x: spawnX,
          y: spawnY,
          width: 400,
          height: 320,
        });

        if (res.success && res.item) {
          setItems([res.item, ...items]);
          setIsModalOpen(false);
        } else {
          setErrorMessage(res.error || "Gagal menyimpan kotak kanban.");
        }
      }
    } catch {
      setErrorMessage("Terjadi kesalahan saat memproses data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getThemeStyles = (theme?: TeamBoardItem["colorTheme"]) => {
    switch (theme) {
      case "emerald":
        return {
          border: "border-emerald-500/40 hover:border-emerald-500/70",
          badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
          accentBar: "bg-emerald-500",
        };
      case "amber":
        return {
          border: "border-amber-500/40 hover:border-amber-500/70",
          badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/30",
          accentBar: "bg-amber-500",
        };
      case "purple":
        return {
          border: "border-purple-500/40 hover:border-purple-500/70",
          badgeBg: "bg-purple-500/20 text-purple-300 border-purple-500/30",
          accentBar: "bg-purple-500",
        };
      case "rose":
        return {
          border: "border-rose-500/40 hover:border-rose-500/70",
          badgeBg: "bg-rose-500/20 text-rose-300 border-rose-500/30",
          accentBar: "bg-rose-500",
        };
      case "slate":
        return {
          border: "border-slate-600 hover:border-slate-500",
          badgeBg: "bg-slate-700 text-slate-300 border-slate-600",
          accentBar: "bg-slate-500",
        };
      case "indigo":
      default:
        return {
          border: "border-indigo-500/40 hover:border-indigo-500/70",
          badgeBg: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
          accentBar: "bg-indigo-500",
        };
    }
  };

  const getCategoryIcon = (cat: TeamBoardItem["category"]) => {
    switch (cat) {
      case "ANNOUNCEMENT":
        return <Bell className="w-3.5 h-3.5 text-amber-400" />;
      case "SOP":
        return <BookOpen className="w-3.5 h-3.5 text-blue-400" />;
      case "TARGET":
        return <Target className="w-3.5 h-3.5 text-emerald-400" />;
      case "IDEA":
        return <Lightbulb className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-130px)] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 select-none shadow-2xl flex flex-col">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-30 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: Title & Dropdown Filter */}
        <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-2 rounded-xl shadow-lg pointer-events-auto">
          <div className="flex items-center gap-2 px-2 border-r border-slate-800">
            <Layers className="w-4 h-4 text-brand-orange" />
            <span className="text-xs font-bold text-white hidden sm:inline">
              Canvas Kanban
            </span>
          </div>

          {/* Kategori Dropdown */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) =>
                setSelectedCategory(
                  e.target.value as "ALL" | "ANNOUNCEMENT" | "SOP" | "TARGET" | "IDEA"
                )
              }
              className="appearance-none bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 pl-3 pr-8 py-1.5 rounded-lg focus:outline-none focus:border-brand-orange transition-colors cursor-pointer"
            >
              <option value="ALL">Semua Kategori ({items.length})</option>
              <option value="ANNOUNCEMENT">
                Pengumuman ({items.filter((i) => i.category === "ANNOUNCEMENT").length})
              </option>
              <option value="SOP">
                SOP Operasional ({items.filter((i) => i.category === "SOP").length})
              </option>
              <option value="TARGET">
                Target Perusahaan ({items.filter((i) => i.category === "TARGET").length})
              </option>
              <option value="IDEA">
                Ide & Brainstorming ({items.filter((i) => i.category === "IDEA").length})
              </option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Quick Search */}
          <div className="relative w-40 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kanban..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/70 border border-slate-700 text-xs text-slate-200 pl-8 pr-2.5 py-1.5 rounded-lg focus:outline-none focus:border-brand-orange"
            />
          </div>
        </div>

        {/* Right: Add Box Button */}
        <div className="pointer-events-auto">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Tambah Kotak Kanvas
          </button>
        </div>
      </div>

      {/* Floating Canvas HUD (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-30 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1.5 rounded-xl shadow-xl text-slate-200">
        <button
          onClick={() => handleZoom(-0.1)}
          title="Zoom Out"
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span className="text-xs font-mono font-bold px-2 text-slate-300 min-w-[50px] text-center">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={() => handleZoom(0.1)}
          title="Zoom In"
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1" />

        <button
          onClick={handleResetView}
          title="Reset View 1:1"
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          Reset View
        </button>

        <span className="hidden md:inline text-[10px] text-slate-500 pl-2 pr-1 border-l border-slate-800">
          Geser: Drag background • Pindahkan: Drag header
        </span>
      </div>

      {/* Main Interactive Canvas Area */}
      <div
        ref={canvasRef}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`flex-1 w-full h-full relative overflow-hidden select-none ${
          isPanning ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{
          backgroundColor: "#030712",
          backgroundImage: `radial-gradient(circle, #334155 1px, transparent 1px)`,
          backgroundSize: `${30 * zoom}px ${30 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      >
        {/* Transformable Canvas Viewport */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
          className="absolute inset-0 pointer-events-auto"
        >
          {filteredItems.map((item) => {
            const styles = getThemeStyles(item.colorTheme);
            const posX = item.x ?? 100;
            const posY = item.y ?? 100;
            const nodeWidth = item.width ?? 380;
            const nodeHeight = item.height ?? 280;

            const imageAttachments = item.attachments?.filter(isImageAttachment) || [];
            const docAttachments = item.attachments?.filter((att) => !isImageAttachment(att)) || [];

            return (
              <div
                key={item.id}
                className={`canvas-node absolute bg-slate-900/95 backdrop-blur-md rounded-2xl border ${styles.border} shadow-2xl flex flex-col group transition-shadow hover:shadow-indigo-500/10`}
                style={{
                  left: `${posX}px`,
                  top: `${posY}px`,
                  width: `${nodeWidth}px`,
                  height: `${nodeHeight}px`,
                }}
              >
                {/* Header (Draggable Handle + Actions) */}
                <div
                  onMouseDown={(e) => handleNodeHeaderMouseDown(e, item)}
                  className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between cursor-move bg-slate-950/40 rounded-t-2xl"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${styles.badgeBg}`}
                    >
                      {getCategoryIcon(item.category)}
                      {item.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 mr-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>

                    {/* Edit button */}
                    <button
                      onClick={(e) => handleOpenEdit(item, e)}
                      title="Ubah teks & style kotak ini"
                      className="text-slate-400 hover:text-brand-orange p-1 rounded transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDeleteNode(item.id, e)}
                      title="Hapus kotak ini"
                      className="text-slate-400 hover:text-rose-400 p-1 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Content Body: Judul, Subjudul, Deskripsi, Preview Gambar, Dokumen */}
                <div className="p-4 flex-1 overflow-y-auto space-y-2.5">
                  {/* Judul dengan Custom Style */}
                  <h3
                    className={`text-white leading-tight ${getStyleClasses(
                      item.titleStyle,
                      "text-base",
                      "font-extrabold"
                    )}`}
                  >
                    {item.title}
                  </h3>

                  {/* Subjudul dengan Custom Style */}
                  {item.subtitle && (
                    <h4
                      className={`text-brand-orange leading-snug ${getStyleClasses(
                        item.subtitleStyle,
                        "text-xs",
                        "font-semibold"
                      )}`}
                    >
                      {item.subtitle}
                    </h4>
                  )}

                  {/* Deskripsi dengan Custom Style */}
                  <p
                    className={`text-slate-300 leading-relaxed whitespace-pre-line ${getStyleClasses(
                      item.contentStyle,
                      "text-xs",
                      "font-normal"
                    )}`}
                  >
                    {item.content}
                  </p>

                  {/* 1. PREVIEW GAMBAR LANGSUNG DI KANVAS */}
                  {imageAttachments.length > 0 && (
                    <div className="pt-2">
                      <div className="text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1 uppercase tracking-wider">
                        <ImageIcon className="w-3 h-3 text-brand-orange" />
                        Lampiran Gambar ({imageAttachments.length})
                      </div>

                      {imageAttachments.length === 1 ? (
                        <div
                          onClick={() => setPreviewAttachment(imageAttachments[0])}
                          className="relative rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950/60 max-h-48 cursor-pointer group/img hover:border-brand-orange transition-all shadow-md"
                        >
                          <img
                            src={imageAttachments[0].url}
                            alt={imageAttachments[0].name}
                            className="w-full h-40 object-cover group-hover/img:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold text-white backdrop-blur-xs">
                            Klik untuk Memperbesar Gambar
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {imageAttachments.map((img) => (
                            <div
                              key={img.id}
                              onClick={() => setPreviewAttachment(img)}
                              className="relative rounded-lg overflow-hidden border border-slate-700/80 bg-slate-950/60 h-24 cursor-pointer group/img hover:border-brand-orange transition-all shadow-sm"
                            >
                              <img
                                src={img.url}
                                alt={img.name}
                                className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-bold text-white text-center p-1">
                                Perbesar
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. DOKUMEN NON-GAMBAR (PDF, DOCS) */}
                  {docAttachments.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/60 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Paperclip className="w-3 h-3" /> Berkas Dokumen ({docAttachments.length})
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {docAttachments.map((att) => (
                          <button
                            key={att.id}
                            type="button"
                            onClick={() => setPreviewAttachment(att)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-[11px] text-slate-200 transition-colors group/att"
                          >
                            <FileText className="w-3.5 h-3.5 text-brand-orange" />
                            <span className="max-w-[150px] truncate">{att.name}</span>
                            <span className="text-[9px] text-slate-500 group-hover/att:text-brand-orange font-bold">
                              Preview &rarr;
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer (Author Info) */}
                <div className="px-4 py-2 border-t border-slate-800/70 flex items-center justify-between text-[10px] text-slate-400 bg-slate-950/20 rounded-b-2xl">
                  <span className="flex items-center gap-1 truncate">
                    <User className="w-3 h-3 text-slate-500" />
                    {item.authorName}
                  </span>
                  <span className="text-slate-600 font-mono">Fynux Internal</span>
                </div>

                {/* Custom Resize Corner Handle (Bottom-Right) */}
                <div
                  onMouseDown={(e) => handleResizeMouseDown(e, item)}
                  title="Tarik sudut untuk mengubah ukuran kotak"
                  className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-center justify-center text-slate-600 hover:text-white transition-colors"
                >
                  <svg className="w-3 h-3 opacity-60" viewBox="0 0 6 6" fill="currentColor">
                    <circle cx="5" cy="5" r="1" />
                    <circle cx="5" cy="2" r="1" />
                    <circle cx="2" cy="5" r="1" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Buat / Edit Kotak Kanvas */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              {editingNodeId ? (
                <>
                  <Edit3 className="w-5 h-5 text-brand-orange" />
                  Ubah Kotak Kanban di Kanvas
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 text-brand-orange" />
                  Buat Kotak Kanban Baru di Kanvas
                </>
              )}
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Atur 3 teks (Judul, Subjudul, Deskripsi) dengan gaya tipografi kustom serta lampirkan gambar/dokumen.
            </p>

            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSaveNode} className="space-y-4">
              {/* Kategori */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kategori Dokumen <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCategory("ANNOUNCEMENT");
                      setColorTheme("amber");
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      category === "ANNOUNCEMENT"
                        ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                        : "bg-slate-800/50 border-slate-700 text-slate-400"
                    }`}
                  >
                    <Bell className="w-4 h-4 text-amber-400" />
                    Pengumuman
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCategory("SOP");
                      setColorTheme("indigo");
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      category === "SOP"
                        ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                        : "bg-slate-800/50 border-slate-700 text-slate-400"
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    SOP Operasional
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCategory("TARGET");
                      setColorTheme("emerald");
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      category === "TARGET"
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                        : "bg-slate-800/50 border-slate-700 text-slate-400"
                    }`}
                  >
                    <Target className="w-4 h-4 text-emerald-400" />
                    Target & Goal
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCategory("IDEA");
                      setColorTheme("purple");
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      category === "IDEA"
                        ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                        : "bg-slate-800/50 border-slate-700 text-slate-400"
                    }`}
                  >
                    <Lightbulb className="w-4 h-4 text-purple-400" />
                    Ide / Brainstorming
                  </button>
                </div>
              </div>

              {/* Tema Warna Kotak */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Warna Border & Aksen Kotak
                </label>
                <div className="flex items-center gap-2">
                  {(["indigo", "emerald", "amber", "purple", "rose", "slate"] as const).map(
                    (theme) => (
                      <button
                        key={theme}
                        type="button"
                        onClick={() => setColorTheme(theme)}
                        className={`w-7 h-7 rounded-full border-2 transition-transform ${
                          theme === "indigo"
                            ? "bg-indigo-600"
                            : theme === "emerald"
                            ? "bg-emerald-600"
                            : theme === "amber"
                            ? "bg-amber-600"
                            : theme === "purple"
                            ? "bg-purple-600"
                            : theme === "rose"
                            ? "bg-rose-600"
                            : "bg-slate-600"
                        } ${colorTheme === theme ? "scale-110 border-white" : "border-transparent"}`}
                      />
                    )
                  )}
                </div>
              </div>

              {/* 1. FIELD JUDUL + FORMATTING TOOLBAR */}
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                <TextFormatToolbar
                  label="1. Judul Kotak"
                  style={titleStyle}
                  onChange={setTitleStyle}
                  sizeOptions={[
                    { label: "Normal", value: "base" },
                    { label: "Besar", value: "lg" },
                    { label: "XL", value: "xl" },
                  ]}
                />
                <input
                  type="text"
                  required
                  placeholder="Ketik judul utama..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-orange mt-1.5 ${getStyleClasses(
                    titleStyle,
                    "text-base",
                    "font-bold"
                  )}`}
                />
              </div>

              {/* 2. FIELD SUBJUDUL + FORMATTING TOOLBAR */}
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                <TextFormatToolbar
                  label="2. Subjudul Kotak"
                  style={subtitleStyle}
                  onChange={setSubtitleStyle}
                  sizeOptions={[
                    { label: "Kecil", value: "xs" },
                    { label: "Normal", value: "sm" },
                    { label: "Besar", value: "base" },
                  ]}
                />
                <input
                  type="text"
                  placeholder="Ketik subjudul atau ringkasan topik..."
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className={`w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-orange mt-1.5 ${getStyleClasses(
                    subtitleStyle,
                    "text-xs",
                    "font-semibold"
                  )}`}
                />
              </div>

              {/* 3. FIELD DESKRIPSI + FORMATTING TOOLBAR */}
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                <TextFormatToolbar
                  label="3. Deskripsi Isi"
                  style={contentStyle}
                  onChange={setContentStyle}
                  sizeOptions={[
                    { label: "Kecil", value: "xs" },
                    { label: "Normal", value: "sm" },
                    { label: "Besar", value: "base" },
                  ]}
                />
                <textarea
                  required
                  rows={4}
                  placeholder="Tuliskan rincian instruksi, SOP, target langkah kerja..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className={`w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-orange mt-1.5 leading-relaxed ${getStyleClasses(
                    contentStyle,
                    "text-xs",
                    "font-normal"
                  )}`}
                />
              </div>

              {/* UPLOAD BERKAS + LIVE THUMBNAIL PREVIEW */}
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Upload Gambar / Dokumen
                  </span>
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-orange hover:bg-orange-600 text-white text-xs font-semibold cursor-pointer transition-colors shadow-sm">
                    <Upload className="w-3.5 h-3.5" />
                    Pilih Gambar/Berkas
                    <input
                      type="file"
                      multiple
                      accept="image/*,application/pdf,.doc,.docx,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Live Preview List in Modal */}
                {attachments.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <div className="text-[11px] font-bold text-slate-400">
                      Berkas Terlampir ({attachments.length}):
                    </div>

                    {/* Image thumbnails preview */}
                    <div className="grid grid-cols-3 gap-2">
                      {attachments.map((att) => {
                        const isImg = isImageAttachment(att);
                        return (
                          <div
                            key={att.id}
                            className="relative group/thumb rounded-lg overflow-hidden border border-slate-700 bg-slate-800 p-1 flex flex-col justify-between"
                          >
                            {isImg ? (
                              <img
                                src={att.url}
                                alt={att.name}
                                className="w-full h-16 object-cover rounded"
                              />
                            ) : (
                              <div className="w-full h-16 flex flex-col items-center justify-center bg-slate-900 rounded text-slate-400">
                                <FileText className="w-6 h-6 text-brand-orange mb-0.5" />
                                <span className="text-[9px] uppercase font-bold">PDF/DOC</span>
                              </div>
                            )}

                            <div className="pt-1 flex items-center justify-between text-[10px] text-slate-300">
                              <span className="truncate max-w-[80px]">{att.name}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveAttachment(att.id)}
                                title="Hapus berkas ini"
                                className="text-slate-400 hover:text-rose-400 p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-xs font-semibold shadow-md transition-colors disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Menyimpan..."
                    : editingNodeId
                    ? "Simpan Perubahan Kotak"
                    : "Tempatkan di Kanvas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        attachment={previewAttachment}
        onClose={() => setPreviewAttachment(null)}
      />
    </div>
  );
}
