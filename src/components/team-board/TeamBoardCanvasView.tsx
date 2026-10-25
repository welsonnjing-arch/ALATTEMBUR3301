"use client";

import React, { useEffect, useRef, useState } from "react";
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
  Check,
  Sparkles,
  Palette,
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

// Helper to safely optimize and compress user images before sending to server action
function compressImageFile(file: File): Promise<{ url: string; sizeFormatted: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1600;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({
            url: dataUrl,
            sizeFormatted: `${(file.size / 1024).toFixed(1)} KB`,
          });
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        // Use JPEG 0.82 for optimal web payload and sharp fidelity
        const compressed = canvas.toDataURL("image/jpeg", 0.82);
        const approxBytes = Math.round((compressed.length * 3) / 4);
        resolve({
          url: compressed,
          sizeFormatted: `${(approxBytes / 1024).toFixed(1)} KB`,
        });
      };
      img.onerror = () => reject(new Error("Gagal membaca gambar"));
      img.src = dataUrl;
    };
    reader.onerror = () => reject(new Error("Gagal memuat file"));
    reader.readAsDataURL(file);
  });
}

// Mobile/Popup Mini text styling toolbar component
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
        <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
          {sizeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...style, size: opt.value })}
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-colors ${
                style.size === opt.value
                  ? "bg-brand-orange text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

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

// Uncontrolled ContentEditable sub-component to prevent React from resetting caret/cursor to line 1 on enter or keystrokes
interface DesktopInlineCardContentProps {
  cardId: string;
  initialContent: string;
  onContentChange: (newHtml: string) => void;
  onSelectText: () => void;
  onTriggerUpload: () => void;
  className?: string;
}

function DesktopInlineCardContent({
  cardId,
  initialContent,
  onContentChange,
  onSelectText,
  onTriggerUpload,
  className,
}: DesktopInlineCardContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const isEditingRef = useRef(false);

  // Set innerHTML initially or when card changes, but NEVER overwrite while actively typing
  useEffect(() => {
    if (contentRef.current && !isEditingRef.current) {
      contentRef.current.innerHTML = initialContent;
    }
  }, [cardId, initialContent]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    isEditingRef.current = true;
    const el = e.currentTarget;
    let html = el.innerHTML;
    const text = el.innerText || el.textContent || "";

    if (text.includes("/upload") || html.includes("/upload")) {
      html = html.replace(/\/upload/g, "");
      el.innerHTML = html;
      onTriggerUpload();
    }

    onContentChange(html);
  };

  const handleBlur = () => {
    isEditingRef.current = false;
    if (contentRef.current) {
      onContentChange(contentRef.current.innerHTML);
    }
  };

  return (
    <div
      ref={contentRef}
      data-card-content={cardId}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onBlur={handleBlur}
      onMouseUp={onSelectText}
      onKeyUp={onSelectText}
      className={className}
    />
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

  // Responsive device state
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  // Active Node for Direct Desktop Inline Editing
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  // Floating text selection toolbar state
  const [selectionBubble, setSelectionBubble] = useState<{
    visible: boolean;
    x: number;
    y: number;
    targetCardId: string | null;
  }>({ visible: false, x: 0, y: 0, targetCardId: null });

  // Slash Command notification toast
  const [slashToast, setSlashToast] = useState<string | null>(null);

  // Hidden file input ref for desktop /upload slash command & side popup
  const cardFileInputRef = useRef<HTMLInputElement>(null);
  const targetCardUploadIdRef = useRef<string | null>(null);

  // Autosave debouncer
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Modals state (used on Mobile or explicitly triggered)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<BoardAttachment | null>(null);

  // Form State (for Modal Create/Edit)
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

  // Debounced server action autosave
  const scheduleAutoSave = (cardId: string, updates: Partial<TeamBoardItem>) => {
    if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    autosaveTimeoutRef.current = setTimeout(async () => {
      await updateTeamBoardItemAction(cardId, updates);
    }, 600);
  };

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
    if ((e.target as HTMLElement).closest(".side-popover")) return;
    if ((e.target as HTMLElement).closest(".selection-bubble")) return;

    // Click on empty canvas deselects active card and closes selection bubble
    setActiveCardId(null);
    setSelectionBubble({ visible: false, x: 0, y: 0, targetCardId: null });

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
      const newWidth = Math.max(300, resizeStartRef.current.width + deltaX);
      const newHeight = Math.max(220, resizeStartRef.current.height + deltaY);

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

  // Desktop Direct Card Creation
  const handleCreateCardDirect = async (customX?: number, customY?: number) => {
    const spawnX =
      customX ?? Math.round((window.innerWidth / 2 - 200 - pan.x) / zoom);
    const spawnY =
      customY ?? Math.round((window.innerHeight / 2 - 150 - pan.y) / zoom);

    const res = await createTeamBoardItemAction(
      "ANNOUNCEMENT",
      "Judul Kotak",
      "Tulis deskripsi di sini... Ketik /upload untuk melampirkan berkas.",
      {
        subtitle: "Subjudul Catatan",
        x: Math.max(40, spawnX),
        y: Math.max(40, spawnY),
        width: 390,
        height: 320,
        colorTheme: "indigo",
      }
    );

    if (res.success && res.item) {
      setItems((prev) => [res.item!, ...prev]);
      setActiveCardId(res.item.id);
    }
  };

  // Canvas Double Click (Desktop only) creates new card at click position
  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if (isMobile) return;
    if ((e.target as HTMLElement).closest(".canvas-node")) return;
    if ((e.target as HTMLElement).closest(".side-popover")) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const spawnX = Math.round((clickX - pan.x) / zoom);
    const spawnY = Math.round((clickY - pan.y) / zoom);

    handleCreateCardDirect(spawnX, spawnY);
  };

  // Card Click: Mobile opens popup, Desktop sets active for inline edit
  const handleCardClick = (item: TeamBoardItem, e: React.MouseEvent) => {
    if (isMobile) {
      handleOpenEdit(item, e);
    } else {
      setActiveCardId(item.id);
    }
  };

  // Open Edit Modal (used on Mobile)
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

  // Open Create Modal (used on Mobile)
  const handleOpenCreateModal = () => {
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

  // Primary Create Action: Mobile opens modal, Desktop creates directly
  const handlePrimaryCreate = () => {
    if (isMobile) {
      handleOpenCreateModal();
    } else {
      handleCreateCardDirect();
    }
  };

  // Delete Node
  const handleDeleteNode = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm("Hapus kotak kanban ini dari team board?")) {
      await deleteTeamBoardItemAction(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      if (activeCardId === id) setActiveCardId(null);
    }
  };

  // Text Selection Detector for Floating Bubble
  const checkTextSelection = (cardId: string) => {
    if (isMobile) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      setSelectionBubble((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      return;
    }

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      setSelectionBubble((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      return;
    }

    setSelectionBubble({
      visible: true,
      x: rect.left + rect.width / 2,
      y: Math.max(10, rect.top - 48),
      targetCardId: cardId,
    });
  };

  // Selection Format Toolbar Handlers
  const handleApplyFormatting = (command: "bold" | "italic" | "strikeThrough") => {
    document.execCommand(command, false);
    if (activeCardId) {
      const activeEl = document.querySelector(
        `[data-card-content="${activeCardId}"]`
      ) as HTMLElement | null;
      const html = activeEl ? activeEl.innerHTML : "";
      if (html) {
        setItems((prev) =>
          prev.map((i) => (i.id === activeCardId ? { ...i, content: html } : i))
        );
        scheduleAutoSave(activeCardId, { content: html });
      }
    }
  };

  const handleApplyFontSizeToSelection = (sizePx: string) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const span = document.createElement("span");
    span.style.fontSize = sizePx;
    try {
      range.surroundContents(span);
    } catch {
      const fragment = range.extractContents();
      span.appendChild(fragment);
      range.insertNode(span);
    }
    sel.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    sel.addRange(newRange);

    if (activeCardId) {
      const activeEl = document.querySelector(
        `[data-card-content="${activeCardId}"]`
      ) as HTMLElement | null;
      const html = activeEl ? activeEl.innerHTML : "";
      if (html) {
        setItems((prev) =>
          prev.map((i) => (i.id === activeCardId ? { ...i, content: html } : i))
        );
        scheduleAutoSave(activeCardId, { content: html });
      }
    }
  };

  // Inline card fields update handlers
  const handleUpdateCardTitle = (cardId: string, val: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === cardId ? { ...i, title: val } : i))
    );
    scheduleAutoSave(cardId, { title: val });
  };

  const handleUpdateCardSubtitle = (cardId: string, val: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === cardId ? { ...i, subtitle: val } : i))
    );
    scheduleAutoSave(cardId, { subtitle: val });
  };

  // Side popover category & theme updates
  const handleUpdateCardCategory = (cardId: string, newCat: TeamBoardItem["category"]) => {
    setItems((prev) =>
      prev.map((i) => (i.id === cardId ? { ...i, category: newCat } : i))
    );
    scheduleAutoSave(cardId, { category: newCat });
  };

  const handleUpdateCardColorTheme = (
    cardId: string,
    newTheme: TeamBoardItem["colorTheme"]
  ) => {
    setItems((prev) =>
      prev.map((i) => (i.id === cardId ? { ...i, colorTheme: newTheme } : i))
    );
    scheduleAutoSave(cardId, { colorTheme: newTheme });
  };

  // Desktop Card File Upload handler (triggered by /upload or side panel button)
  const handleCardFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cardId = targetCardUploadIdRef.current;
    if (!cardId) return;

    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    e.target.value = ""; // Reset input

    for (const file of fileList) {
      if (file.size > 20 * 1024 * 1024) {
        alert(`File "${file.name}" melebihi batas 20MB.`);
        continue;
      }

      const isImg =
        file.type.startsWith("image/") ||
        /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.name);

      let attachmentUrl = "";
      let attachmentSize = `${(file.size / 1024).toFixed(1)} KB`;

      if (isImg && file.type !== "image/svg+xml" && file.type !== "image/gif") {
        try {
          const compressed = await compressImageFile(file);
          attachmentUrl = compressed.url;
          attachmentSize = compressed.sizeFormatted;
        } catch {
          attachmentUrl = await new Promise((res) => {
            const r = new FileReader();
            r.onload = () => res(r.result as string);
            r.readAsDataURL(file);
          });
        }
      } else {
        attachmentUrl = await new Promise((res) => {
          const r = new FileReader();
          r.onload = () => res(r.result as string);
          r.readAsDataURL(file);
        });
      }

      const newAtt: BoardAttachment = {
        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: file.name,
        size: attachmentSize,
        type: isImg ? "image" : file.type || "document",
        url: attachmentUrl,
      };

      setItems((prev) =>
        prev.map((i) => {
          if (i.id === cardId) {
            const nextAttachments = [...(i.attachments || []), newAtt];
            scheduleAutoSave(cardId, { attachments: nextAttachments });
            return { ...i, attachments: nextAttachments };
          }
          return i;
        })
      );
    }

    setSlashToast("Berkas berhasil dilampirkan ke kotak!");
    setTimeout(() => setSlashToast(null), 3000);
  };

  // Helper to remove attachment from card
  const handleRemoveCardAttachment = (cardId: string, attId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems((prev) =>
      prev.map((i) => {
        if (i.id === cardId) {
          const updated = (i.attachments || []).filter((a) => a.id !== attId);
          scheduleAutoSave(cardId, { attachments: updated });
          return { ...i, attachments: updated };
        }
        return i;
      })
    );
  };

  // Mobile Modal File Upload Handlers
  const handleModalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    e.target.value = "";

    for (const file of fileList) {
      if (file.size > 20 * 1024 * 1024) {
        setErrorMessage(`File "${file.name}" melebihi batas 20MB.`);
        continue;
      }

      const isImg =
        file.type.startsWith("image/") ||
        /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.name);

      if (isImg && file.type !== "image/svg+xml" && file.type !== "image/gif") {
        try {
          const compressed = await compressImageFile(file);
          const newAttachment: BoardAttachment = {
            id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: file.name,
            size: compressed.sizeFormatted,
            type: "image",
            url: compressed.url,
          };
          setAttachments((prev) => [...prev, newAttachment]);
        } catch {
          const r = new FileReader();
          r.onload = () => {
            setAttachments((prev) => [
              ...prev,
              {
                id: `att-${Date.now()}`,
                name: file.name,
                size: `${(file.size / 1024).toFixed(1)} KB`,
                type: "image",
                url: r.result as string,
              },
            ]);
          };
          r.readAsDataURL(file);
        }
      } else {
        const r = new FileReader();
        r.onload = () => {
          setAttachments((prev) => [
            ...prev,
            {
              id: `att-${Date.now()}`,
              name: file.name,
              size: `${(file.size / 1024).toFixed(1)} KB`,
              type: isImg ? "image" : file.type || "document",
              url: r.result as string,
            },
          ]);
        };
        r.readAsDataURL(file);
      }
    }
  };

  // Mobile Modal Save Handler
  const handleModalSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorMessage("Judul dan deskripsi wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      if (editingNodeId) {
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
          width: 390,
          height: 320,
        });

        if (res.success && res.item) {
          setItems([res.item, ...items]);
          setIsModalOpen(false);
        } else {
          setErrorMessage(res.error || "Gagal menyimpan kotak kanban.");
        }
      }
    } catch (err: unknown) {
      console.error("Gagal menyimpan kotak kanban:", err);
      const msg =
        err instanceof Error ? err.message : "Terjadi kesalahan saat memproses data.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getThemeStyles = (theme?: TeamBoardItem["colorTheme"]) => {
    switch (theme) {
      case "emerald":
        return {
          border: "border-emerald-500/50 hover:border-emerald-500/80",
          badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
          accentBar: "bg-emerald-500",
          glow: "focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/20",
        };
      case "amber":
        return {
          border: "border-amber-500/50 hover:border-amber-500/80",
          badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          accentBar: "bg-amber-500",
          glow: "focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-500/20",
        };
      case "rose":
        return {
          border: "border-rose-500/50 hover:border-rose-500/80",
          badgeBg: "bg-rose-500/20 text-rose-300 border-rose-500/40",
          accentBar: "bg-rose-500",
          glow: "focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-500/20",
        };
      case "sky":
        return {
          border: "border-sky-500/50 hover:border-sky-500/80",
          badgeBg: "bg-sky-500/20 text-sky-300 border-sky-500/40",
          accentBar: "bg-sky-500",
          glow: "focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-500/20",
        };
      case "purple":
        return {
          border: "border-purple-500/50 hover:border-purple-500/80",
          badgeBg: "bg-purple-500/20 text-purple-300 border-purple-500/40",
          accentBar: "bg-purple-500",
          glow: "focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-500/20",
        };
      case "indigo":
      default:
        return {
          border: "border-indigo-500/50 hover:border-indigo-500/80",
          badgeBg: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
          accentBar: "bg-indigo-500",
          glow: "focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20",
        };
    }
  };

  const getCategoryIcon = (cat: TeamBoardItem["category"]) => {
    switch (cat) {
      case "ANNOUNCEMENT":
        return <Bell className="w-3.5 h-3.5 text-amber-400" />;
      case "SOP":
        return <BookOpen className="w-3.5 h-3.5 text-sky-400" />;
      case "TARGET":
        return <Target className="w-3.5 h-3.5 text-emerald-400" />;
      case "IDEA":
        return <Lightbulb className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-4.5rem)] bg-slate-950 overflow-hidden select-none font-sans">
      {/* Hidden file input for desktop /upload & side panel trigger */}
      <input
        ref={cardFileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleCardFileUpload}
      />

      {/* Floating Selection Toolbar (Medium/Notion Style - appears only when text is blocked) */}
      {selectionBubble.visible && !isMobile && (
        <div
          className="selection-bubble fixed z-50 transform -translate-x-1/2 flex items-center gap-1 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 px-2 py-1 rounded-xl shadow-2xl text-white animate-in fade-in zoom-in-95 duration-100"
          style={{
            left: `${selectionBubble.x}px`,
            top: `${selectionBubble.y}px`,
          }}
          onMouseDown={(e) => e.preventDefault()} // Prevents selection from deselecting
        >
          {/* Font Sizes */}
          <div className="flex items-center gap-0.5 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 mr-1">
            {[
              { label: "XS", size: "11px" },
              { label: "SM", size: "13px" },
              { label: "MD", size: "15px" },
              { label: "LG", size: "18px" },
              { label: "XL", size: "22px" },
            ].map((opt) => (
              <button
                key={opt.label}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleApplyFontSizeToSelection(opt.size);
                }}
                className="px-1.5 py-0.5 text-[10px] font-bold text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
                title={`Ukuran font ${opt.label}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Bold */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleApplyFormatting("bold");
            }}
            className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-brand-orange transition-colors"
            title="Tebal (Bold)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          {/* Italic */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleApplyFormatting("italic");
            }}
            className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-brand-orange transition-colors"
            title="Miring (Italic)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          {/* Strikethrough */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleApplyFormatting("strikeThrough");
            }}
            className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-brand-orange transition-colors"
            title="Coret (Strikethrough)"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          {/* Downward triangle arrow */}
          <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-slate-900 border-r border-b border-slate-700/80 rotate-45" />
        </div>
      )}

      {/* Slash command notification toast */}
      {slashToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-brand-orange text-white text-xs font-bold px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Sparkles className="w-4 h-4 animate-spin" />
          {slashToast}
        </div>
      )}

      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: Title & Quick Category Filter Dropdown */}
        <div className="flex items-center gap-2.5 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 shadow-xl pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-orange animate-pulse" />
            <span className="text-xs font-black text-white tracking-wider uppercase">
              Kanban Workspace
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Category Filter Dropdown */}
          <div className="relative flex items-center">
            <select
              value={selectedCategory}
              onChange={(e) =>
                setSelectedCategory(
                  e.target.value as "ALL" | "ANNOUNCEMENT" | "SOP" | "TARGET" | "IDEA"
                )
              }
              className="bg-slate-950/80 text-xs font-semibold text-slate-200 border border-slate-700/80 rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:border-brand-orange appearance-none cursor-pointer"
            >
              <option value="ALL">Semua Kategori ({items.length})</option>
              <option value="ANNOUNCEMENT">
                Pengumuman ({items.filter((i) => i.category === "ANNOUNCEMENT").length})
              </option>
              <option value="SOP">
                SOP ({items.filter((i) => i.category === "SOP").length})
              </option>
              <option value="TARGET">
                Target ({items.filter((i) => i.category === "TARGET").length})
              </option>
              <option value="IDEA">
                Ide ({items.filter((i) => i.category === "IDEA").length})
              </option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
          </div>

          {/* Quick Search */}
          <div className="relative hidden sm:block">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kanban..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950/80 text-xs text-slate-200 pl-8 pr-3 py-1.5 rounded-lg border border-slate-700/80 focus:outline-none focus:border-brand-orange w-40 placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Right: Zoom Controls & Create Button */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-800 p-1 shadow-xl">
            <button
              onClick={() => handleZoom(-0.1)}
              title="Perkecil (-)"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-slate-300 px-2 min-w-[42px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => handleZoom(0.1)}
              title="Perbesar (+)"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <div className="h-4 w-px bg-slate-800 mx-1" />
            <button
              onClick={handleResetView}
              title="Reset View 1:1"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Primary Create Button */}
          <button
            onClick={handlePrimaryCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-brand-orange to-amber-500 hover:opacity-95 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-brand-orange/20 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kotak</span>
          </button>
        </div>
      </div>

      {/* Infinite Canvas Area */}
      <div
        ref={canvasRef}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleCanvasDoubleClick}
        className={`w-full h-full relative cursor-${
          isPanning ? "grabbing" : "grab"
        } overflow-hidden`}
        style={{
          backgroundImage: `radial-gradient(circle, rgba(71, 85, 105, 0.25) 1px, transparent 1px)`,
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      >
        {/* Transform Container */}
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
            const nodeWidth = item.width ?? 390;
            const nodeHeight = item.height ?? 320;
            const isActive = activeCardId === item.id;

            const imageAttachments = item.attachments?.filter(isImageAttachment) || [];
            const docAttachments = item.attachments?.filter((att) => !isImageAttachment(att)) || [];

            return (
              <div
                key={item.id}
                onClick={(e) => handleCardClick(item, e)}
                className={`canvas-node absolute bg-slate-900/95 backdrop-blur-md rounded-2xl border ${
                  styles.border
                } ${styles.glow} shadow-2xl flex flex-col group transition-shadow ${
                  isActive ? "ring-2 ring-brand-orange/80 shadow-brand-orange/10 z-30" : "hover:shadow-indigo-500/10 z-10"
                }`}
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
                  className="px-4 py-2.5 border-b border-slate-800/80 flex items-center justify-between cursor-move bg-slate-950/50 rounded-t-2xl"
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

                    {/* Edit button (opens modal for mobile / explicit editing) */}
                    <button
                      onClick={(e) => handleOpenEdit(item, e)}
                      title="Buka modal edit detail"
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

                {/* Content Body: Direct Desktop Inline Typing OR Rendered Text */}
                <div className="p-4 flex-1 overflow-y-auto space-y-2.5">
                  {/* Judul: Direct typing on desktop if active, otherwise rendered */}
                  {isActive && !isMobile ? (
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => handleUpdateCardTitle(item.id, e.target.value)}
                      placeholder="Tulis judul kotak..."
                      className={`w-full bg-slate-950/70 border border-slate-700/80 rounded-lg px-2.5 py-1 text-white focus:outline-none focus:border-brand-orange transition-colors ${getStyleClasses(
                        item.titleStyle,
                        "text-base",
                        "font-extrabold"
                      )}`}
                    />
                  ) : (
                    <h3
                      className={`text-white leading-tight ${getStyleClasses(
                        item.titleStyle,
                        "text-base",
                        "font-extrabold"
                      )}`}
                    >
                      {item.title}
                    </h3>
                  )}

                  {/* Subjudul: Direct typing on desktop if active, otherwise rendered */}
                  {isActive && !isMobile ? (
                    <input
                      type="text"
                      value={item.subtitle || ""}
                      onChange={(e) => handleUpdateCardSubtitle(item.id, e.target.value)}
                      placeholder="Tulis subjudul catatan (opsional)..."
                      className={`w-full bg-slate-950/60 border border-slate-700/60 rounded-lg px-2 py-0.5 text-brand-orange focus:outline-none focus:border-brand-orange transition-colors ${getStyleClasses(
                        item.subtitleStyle,
                        "text-xs",
                        "font-semibold"
                      )}`}
                    />
                  ) : (
                    item.subtitle && (
                      <h4
                        className={`text-brand-orange leading-snug ${getStyleClasses(
                          item.subtitleStyle,
                          "text-xs",
                          "font-semibold"
                        )}`}
                      >
                        {item.subtitle}
                      </h4>
                    )
                  )}

                  {/* Deskripsi: Direct ContentEditable on desktop if active, otherwise rendered */}
                  {isActive && !isMobile ? (
                    <div className="space-y-1">
                      <DesktopInlineCardContent
                        cardId={item.id}
                        initialContent={item.content}
                        onContentChange={(newHtml) => {
                          setItems((prev) =>
                            prev.map((i) => (i.id === item.id ? { ...i, content: newHtml } : i))
                          );
                          scheduleAutoSave(item.id, { content: newHtml });
                        }}
                        onSelectText={() => checkTextSelection(item.id)}
                        onTriggerUpload={() => {
                          targetCardUploadIdRef.current = item.id;
                          cardFileInputRef.current?.click();
                          setSlashToast("Membuka pemilih berkas untuk /upload...");
                          setTimeout(() => setSlashToast(null), 3000);
                        }}
                        className={`w-full min-h-[90px] bg-slate-950/50 border border-slate-800 rounded-xl p-2.5 text-slate-200 text-xs focus:outline-none focus:border-brand-orange/70 transition-colors whitespace-pre-wrap selection:bg-brand-orange/40 selection:text-white leading-relaxed ${getStyleClasses(
                          item.contentStyle,
                          "text-xs",
                          "font-normal"
                        )}`}
                      />
                      <div className="text-[10px] text-slate-500 flex items-center justify-between px-1">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-brand-orange" />
                          Blok teks untuk styling &bull; Ketik{" "}
                          <code className="text-brand-orange font-mono font-bold bg-slate-800 px-1 py-0.5 rounded">
                            /upload
                          </code>{" "}
                          untuk berkas
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`text-slate-300 leading-relaxed whitespace-pre-line ${getStyleClasses(
                        item.contentStyle,
                        "text-xs",
                        "font-normal"
                      )}`}
                      dangerouslySetInnerHTML={{ __html: item.content }}
                    />
                  )}

                  {/* 1. PREVIEW GAMBAR LANGSUNG DI KANVAS */}
                  {imageAttachments.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/60">
                      <div className="text-[10px] font-bold text-slate-400 mb-1.5 flex items-center justify-between uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <ImageIcon className="w-3 h-3 text-brand-orange" />
                          Lampiran Gambar ({imageAttachments.length})
                        </span>
                      </div>

                      {imageAttachments.length === 1 ? (
                        <div className="relative rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950/60 max-h-48 cursor-pointer group/img hover:border-brand-orange transition-all shadow-md">
                          <img
                            src={imageAttachments[0].url}
                            alt={imageAttachments[0].name}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewAttachment(imageAttachments[0]);
                            }}
                            className="w-full h-40 object-cover group-hover/img:scale-105 transition-transform duration-200"
                          />
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewAttachment(imageAttachments[0]);
                            }}
                            className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold text-white backdrop-blur-xs"
                          >
                            Klik untuk Memperbesar Gambar
                          </div>
                          {isActive && (
                            <button
                              type="button"
                              onClick={(e) =>
                                handleRemoveCardAttachment(item.id, imageAttachments[0].id, e)
                              }
                              className="absolute top-2 right-2 bg-rose-600/90 hover:bg-rose-600 text-white p-1 rounded-full shadow-lg transition-transform hover:scale-110"
                              title="Hapus gambar"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {imageAttachments.map((img) => (
                            <div
                              key={img.id}
                              className="relative rounded-lg overflow-hidden border border-slate-700/80 bg-slate-950/60 h-24 cursor-pointer group/img hover:border-brand-orange transition-all shadow-sm"
                            >
                              <img
                                src={img.url}
                                alt={img.name}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewAttachment(img);
                                }}
                                className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-200"
                              />
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewAttachment(img);
                                }}
                                className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-bold text-white text-center p-1"
                              >
                                Perbesar
                              </div>
                              {isActive && (
                                <button
                                  type="button"
                                  onClick={(e) =>
                                    handleRemoveCardAttachment(item.id, img.id, e)
                                  }
                                  className="absolute top-1 right-1 bg-rose-600/90 hover:bg-rose-600 text-white p-0.5 rounded-full shadow transition-transform hover:scale-110"
                                  title="Hapus gambar"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              )}
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
                        <Paperclip className="w-3 h-3 text-brand-orange" /> Berkas Dokumen (
                        {docAttachments.length})
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {docAttachments.map((att) => (
                          <div
                            key={att.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-[11px] text-slate-200 transition-colors group/att"
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewAttachment(att);
                              }}
                              className="flex items-center gap-1.5 hover:text-brand-orange transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5 text-brand-orange" />
                              <span className="max-w-[130px] truncate">{att.name}</span>
                            </button>
                            {isActive && (
                              <button
                                type="button"
                                onClick={(e) =>
                                  handleRemoveCardAttachment(item.id, att.id, e)
                                }
                                className="text-slate-400 hover:text-rose-400 ml-1 p-0.5"
                                title="Hapus dokumen"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
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
                  className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center text-slate-600 hover:text-brand-orange transition-colors"
                >
                  <svg className="w-2.5 h-2.5" viewBox="0 0 6 6" fill="currentColor">
                    <circle cx="5" cy="5" r="0.8" />
                    <circle cx="3" cy="5" r="0.8" />
                    <circle cx="5" cy="3" r="0.8" />
                  </svg>
                </div>

                {/* SIDE FLOATING POPOVER (Category & Color Palette) - Only appears when card is active on desktop */}
                {isActive && !isMobile && (
                  <div
                    className="side-popover absolute left-full ml-3 top-0 flex flex-col gap-2.5 p-3 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl z-40 min-w-[150px] animate-in fade-in slide-in-from-left-2 duration-150"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/80 pb-1.5">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Palette className="w-3 h-3 text-brand-orange" /> Menu Kotak
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveCardId(null)}
                        className="text-slate-400 hover:text-white"
                        title="Tutup Menu"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Kategori Selector */}
                    <div>
                      <div className="text-[10px] font-semibold text-slate-400 mb-1">
                        Kategori
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {(["ANNOUNCEMENT", "SOP", "TARGET", "IDEA"] as const).map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => handleUpdateCardCategory(item.id, cat)}
                            className={`px-1.5 py-1 rounded-lg text-[10px] font-bold border flex items-center justify-center gap-1 transition-all ${
                              item.category === cat
                                ? "bg-brand-orange text-white border-brand-orange shadow-sm"
                                : "bg-slate-800/80 text-slate-400 border-slate-700/70 hover:text-white hover:border-slate-600"
                            }`}
                            title={cat}
                          >
                            {getCategoryIcon(cat)}
                            <span className="truncate">
                              {cat === "ANNOUNCEMENT"
                                ? "Pengumuman"
                                : cat === "IDEA"
                                ? "Ide"
                                : cat}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Warna Selector */}
                    <div>
                      <div className="text-[10px] font-semibold text-slate-400 mb-1">
                        Warna Tema
                      </div>
                      <div className="flex items-center justify-between bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
                        {(["indigo", "emerald", "amber", "rose", "sky", "purple"] as const).map(
                          (col) => {
                            const bgMap = {
                              indigo: "bg-indigo-500",
                              emerald: "bg-emerald-500",
                              amber: "bg-amber-500",
                              rose: "bg-rose-500",
                              sky: "bg-sky-500",
                              purple: "bg-purple-500",
                            }[col];

                            return (
                              <button
                                key={col}
                                type="button"
                                onClick={() => handleUpdateCardColorTheme(item.id, col)}
                                className={`w-4 h-4 rounded-full ${bgMap} transition-transform hover:scale-125 flex items-center justify-center ${
                                  item.colorTheme === col
                                    ? "ring-2 ring-white scale-110 shadow-md"
                                    : "opacity-75 hover:opacity-100"
                                }`}
                                title={`Warna ${col}`}
                              />
                            );
                          }
                        )}
                      </div>
                    </div>

                    {/* Quick Action: Upload Berkas */}
                    <button
                      type="button"
                      onClick={() => {
                        targetCardUploadIdRef.current = item.id;
                        cardFileInputRef.current?.click();
                      }}
                      className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700/90 text-slate-200 border border-slate-700 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Upload className="w-3 h-3 text-brand-orange" />
                      <span>Upload Berkas</span>
                    </button>

                    {/* Selesai Button */}
                    <button
                      type="button"
                      onClick={() => setActiveCardId(null)}
                      className="w-full py-1.5 px-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                    >
                      <Check className="w-3 h-3" />
                      <span>Selesai Edit</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL POPUP: Fallback untuk Mobile atau Pengaturan Form Khusus */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-orange" />
                <h3 className="font-bold text-white text-base">
                  {editingNodeId ? "Ubah Kotak Kanban" : "Tambah Kotak Kanban Baru"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleModalSave} className="p-6 space-y-4 flex-1">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
                  {errorMessage}
                </div>
              )}

              {/* Kategori & Warna Theme */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Kategori Papan
                  </label>
                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as TeamBoardItem["category"])
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange"
                  >
                    <option value="ANNOUNCEMENT">📢 Pengumuman</option>
                    <option value="SOP">📖 SOP & Prosedur</option>
                    <option value="TARGET">🎯 Target & KPI</option>
                    <option value="IDEA">💡 Ide & Inovasi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Warna Tema Kotak
                  </label>
                  <div className="flex items-center gap-2 py-1">
                    {(["indigo", "emerald", "amber", "rose", "sky", "purple"] as const).map(
                      (theme) => {
                        const bgColors = {
                          indigo: "bg-indigo-500",
                          emerald: "bg-emerald-500",
                          amber: "bg-amber-500",
                          rose: "bg-rose-500",
                          sky: "bg-sky-500",
                          purple: "bg-purple-500",
                        }[theme];

                        return (
                          <button
                            key={theme}
                            type="button"
                            onClick={() => setColorTheme(theme)}
                            className={`w-7 h-7 rounded-full ${bgColors} transition-transform hover:scale-110 flex items-center justify-center ${
                              colorTheme === theme
                                ? "ring-2 ring-white scale-110 shadow-lg"
                                : "opacity-70 hover:opacity-100"
                            }`}
                            title={`Warna ${theme}`}
                          />
                        );
                      }
                    )}
                  </div>
                </div>
              </div>

              {/* 1. JUDUL KOTAK */}
              <div>
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
                  placeholder="Contoh: Rilis Update Fynux OS v2.0"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-brand-orange transition-all placeholder:text-slate-600 ${getStyleClasses(
                    titleStyle,
                    "text-base",
                    "font-extrabold"
                  )}`}
                />
              </div>

              {/* 2. SUBJUDUL KOTAK */}
              <div>
                <TextFormatToolbar
                  label="2. Subjudul (Opsional)"
                  style={subtitleStyle}
                  onChange={setSubtitleStyle}
                  sizeOptions={[
                    { label: "Kecil", value: "xs" },
                    { label: "Normal", value: "sm" },
                    { label: "Sedang", value: "base" },
                  ]}
                />
                <input
                  type="text"
                  placeholder="Contoh: Modul Team Board & Interactive Canvas"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-brand-orange focus:outline-none focus:border-brand-orange transition-all placeholder:text-slate-600 ${getStyleClasses(
                    subtitleStyle,
                    "text-xs",
                    "font-semibold"
                  )}`}
                />
              </div>

              {/* 3. DESKRIPSI KOTAK */}
              <div>
                <TextFormatToolbar
                  label="3. Deskripsi / Catatan"
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
                  placeholder="Tulis detail catatan, arahan, atau target tim..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-brand-orange transition-all placeholder:text-slate-600 ${getStyleClasses(
                    contentStyle,
                    "text-xs",
                    "font-normal"
                  )}`}
                />
              </div>

              {/* UPLOAD BERKAS & PREVIEW DI MODAL */}
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-brand-orange" />
                    Lampiran Berkas (Gambar & Dokumen)
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Format: JPG, PNG, WEBP, PDF, TXT
                  </span>
                </label>

                {/* Upload Button */}
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-200 font-medium transition-colors shadow-sm">
                    <Upload className="w-3.5 h-3.5 text-brand-orange" />
                    <span>Pilih Berkas Lampiran...</span>
                    <input
                      type="file"
                      multiple
                      onChange={handleModalFileUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Otomatis dikompres & muncul di canvas
                  </span>
                </div>

                {/* List Preview Berkas */}
                {attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="text-[11px] font-bold text-slate-400">
                      Berkas Terlampir ({attachments.length}):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {attachments.map((att) => {
                        const isImg = isImageAttachment(att);
                        return (
                          <div
                            key={att.id}
                            className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                          >
                            <div
                              onClick={() => setPreviewAttachment(att)}
                              className="flex items-center gap-2 min-w-0 cursor-pointer hover:text-brand-orange transition-colors flex-1"
                            >
                              {isImg ? (
                                <img
                                  src={att.url}
                                  alt={att.name}
                                  className="w-8 h-8 rounded-lg object-cover border border-slate-700 shrink-0"
                                />
                              ) : (
                                <FileText className="w-5 h-5 text-brand-orange shrink-0" />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-slate-200 font-medium text-[11px]">
                                  {att.name}
                                </p>
                                <p className="text-[9px] text-slate-500">{att.size}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setAttachments((prev) => prev.filter((a) => a.id !== att.id))
                              }
                              className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                              title="Hapus berkas"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-orange to-amber-500 text-white shadow-lg shadow-brand-orange/20 hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {isSubmitting && <Sparkles className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {editingNodeId ? "Simpan Perubahan" : "Simpan Kotak Kanban"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT & IMAGE HIGH-RES PREVIEW MODAL */}
      <DocumentPreviewModal
        attachment={previewAttachment}
        onClose={() => setPreviewAttachment(null)}
      />
    </div>
  );
}
