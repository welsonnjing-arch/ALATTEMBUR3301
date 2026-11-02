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
  List,
  LayoutGrid,
} from "lucide-react";
import {
  BoardAttachment,
  CanvasViewportState,
  TeamBoardItem,
  TextStyleConfig,
} from "@/modules/projects/types";
import {
  createTeamBoardItemAction,
  deleteTeamBoardItemAction,
  updateCanvasViewportAction,
  updateTeamBoardItemAction,
  updateTeamBoardItemPositionAction,
} from "@/modules/projects/projects.actions";
import { DocumentPreviewModal } from "./DocumentPreviewModal";
import { ModalPortal } from "@/components/common/ModalPortal";
import { useToast } from "@/components/common/Toast";

interface TeamBoardCanvasViewProps {
  initialItems: TeamBoardItem[];
  initialViewport?: CanvasViewportState;
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
    <div className="flex items-center justify-between text-xs py-1 border-b border-slate-200 mb-1">
      <span className="text-[11px] font-semibold text-slate-500">{label}</span>
      <div className="flex items-center gap-1.5">
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
          {sizeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...style, size: opt.value })}
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-colors ${
                style.size === opt.value
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
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
              ? "bg-blue-50 border-blue-400 text-blue-700 font-bold"
              : "bg-white border-slate-200 text-slate-500 hover:text-slate-800"
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
              ? "bg-blue-50 border-blue-400 text-blue-700"
              : "bg-white border-slate-200 text-slate-500 hover:text-slate-800"
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
              ? "bg-blue-50 border-blue-400 text-blue-700"
              : "bg-white border-slate-200 text-slate-500 hover:text-slate-800"
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
  onTriggerUpload: () => void;
  className?: string;
}

function DesktopInlineCardContent({
  cardId,
  initialContent,
  onContentChange,
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
      data-field="content"
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onBlur={handleBlur}
      style={{ userSelect: "text", WebkitUserSelect: "text" }}
      className={`select-text cursor-text selection:bg-blue-600 selection:text-white ${className || ""}`}
    />
  );
}

// Uncontrolled ContentEditable field for Judul & Subjudul (supports text selection & styling)
interface DesktopInlineFieldProps {
  fieldKey: string;
  dataField: "title" | "subtitle";
  initialValue: string;
  placeholder: string;
  onValueChange: (val: string) => void;
  onEnterPress?: () => void;
  className?: string;
}

function DesktopInlineField({
  fieldKey,
  dataField,
  initialValue,
  placeholder,
  onValueChange,
  onEnterPress,
  className,
}: DesktopInlineFieldProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isEditingRef = useRef(false);

  useEffect(() => {
    if (ref.current && !isEditingRef.current) {
      ref.current.innerHTML = initialValue;
    }
  }, [fieldKey, initialValue]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    isEditingRef.current = true;
    const html = e.currentTarget.innerHTML;
    onValueChange(html);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (onEnterPress) onEnterPress();
    }
  };

  const handleBlur = () => {
    isEditingRef.current = false;
    if (ref.current) {
      onValueChange(ref.current.innerHTML);
    }
  };

  return (
    <div
      ref={ref}
      data-field={dataField}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      style={{ userSelect: "text", WebkitUserSelect: "text" }}
      className={`select-text cursor-text focus:outline-none selection:bg-blue-600 selection:text-white empty:before:content-[attr(data-placeholder)] empty:before:text-slate-600 ${className || ""}`}
      data-placeholder={placeholder}
    />
  );
}

const LOCAL_STORAGE_ITEMS_KEY = "fynux_team_board_items_v2";
const LOCAL_STORAGE_VIEWPORT_KEY = "fynux_team_board_viewport_v2";

function safeNumber(val: unknown, fallback: number): number {
  if (typeof val === "number" && !isNaN(val)) return val;
  return fallback;
}

export function TeamBoardCanvasView({
  initialItems,
  initialViewport,
  currentUserRole = "OWNER",
}: TeamBoardCanvasViewProps) {
  const { toast } = useToast();
  const initialSafePanX = safeNumber(initialViewport?.panX, 40);
  const initialSafePanY = safeNumber(initialViewport?.panY, 40);
  const initialSafeZoom = safeNumber(initialViewport?.zoom, 1.0);

  const [items, setItems] = useState<TeamBoardItem[]>(initialItems);
  const [selectedCategory, setSelectedCategory] = useState<
    "ALL" | "ANNOUNCEMENT" | "SOP" | "TARGET" | "IDEA"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Responsive device state & Mobile View Toggle (Canvas vs List)
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<"CANVAS" | "LIST">("CANVAS");

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    handleResize();
    if (window.innerWidth < 768) {
      setViewMode("LIST");
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Canvas Viewport Pan & Zoom State (Option B - Shared/Global persistence)
  const [pan, setPan] = useState({
    x: initialSafePanX,
    y: initialSafePanY,
  });
  const [zoom, setZoom] = useState(initialSafeZoom > 0.1 ? initialSafeZoom : 1.0);
  const panRef = useRef(pan);
  panRef.current = pan;
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Viewport autosave debouncer for shared/global coordinates + local storage backup
  const viewportSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scheduleViewportSave = (newPanX: number, newPanY: number, newZoom: number) => {
    const safeX = safeNumber(newPanX, 40);
    const safeY = safeNumber(newPanY, 40);
    const safeZ = safeNumber(newZoom, 1.0);

    try {
      localStorage.setItem(
        LOCAL_STORAGE_VIEWPORT_KEY,
        JSON.stringify({ panX: safeX, panY: safeY, zoom: safeZ })
      );
    } catch {}

    if (viewportSaveTimeoutRef.current) clearTimeout(viewportSaveTimeoutRef.current);
    viewportSaveTimeoutRef.current = setTimeout(async () => {
      await updateCanvasViewportAction(safeX, safeY, safeZ);
    }, 600);
  };

  // Restore and merge items from localStorage on initial client mount
  useEffect(() => {
    try {
      const storedItems = localStorage.getItem(LOCAL_STORAGE_ITEMS_KEY);
      if (storedItems) {
        const parsed = JSON.parse(storedItems);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems((prev) => {
            const map = new Map<string, TeamBoardItem>();
            prev.forEach((it) => map.set(it.id, it));
            parsed.forEach((it: TeamBoardItem) => {
              if (it && it.id) map.set(it.id, { ...map.get(it.id), ...it });
            });
            return Array.from(map.values());
          });
        }
      }

      const storedVp = localStorage.getItem(LOCAL_STORAGE_VIEWPORT_KEY);
      if (storedVp) {
        const parsed = JSON.parse(storedVp);
        if (typeof parsed?.panX === "number" && !isNaN(parsed.panX)) {
          setPan({ x: parsed.panX, y: parsed.panY });
          if (typeof parsed.zoom === "number" && !isNaN(parsed.zoom)) {
            setZoom(parsed.zoom);
          }
        }
      }
    } catch {}
  }, []);

  // Sync state when initialItems prop updates from server revalidation
  useEffect(() => {
    if (initialItems && initialItems.length > 0) {
      setItems((prev) => {
        const map = new Map<string, TeamBoardItem>();
        initialItems.forEach((it) => map.set(it.id, it));
        prev.forEach((it) => {
          if (!map.has(it.id)) map.set(it.id, it);
        });
        return Array.from(map.values());
      });
    }
  }, [initialItems]);

  // Persist items to localStorage whenever items change
  useEffect(() => {
    if (items.length > 0) {
      try {
        localStorage.setItem(LOCAL_STORAGE_ITEMS_KEY, JSON.stringify(items));
      } catch {}
    }
  }, [items]);

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
    setZoom((prev) => {
      const nextZoom = Math.min(2.0, Math.max(0.3, Math.round((prev + delta) * 10) / 10));
      scheduleViewportSave(panRef.current.x, panRef.current.y, nextZoom);
      return nextZoom;
    });
  };

  const handleResetView = () => {
    setPan({ x: 40, y: 40 });
    setZoom(1.0);
    scheduleViewportSave(40, 40, 1.0);
  };

  // Check if cards are currently out of view
  const areCardsOffScreen =
    items.length > 0 &&
    !items.some((item) => {
      const itemX = item.x ?? 60;
      const itemY = item.y ?? 60;
      const itemW = item.width ?? 390;
      const itemH = item.height ?? 320;

      const screenX = pan.x + itemX * zoom;
      const screenY = pan.y + itemY * zoom;
      const screenW = itemW * zoom;
      const screenH = itemH * zoom;

      const vW = typeof window !== "undefined" ? window.innerWidth : 1200;
      const vH = typeof window !== "undefined" ? window.innerHeight : 800;

      return (
        screenX + screenW > 40 &&
        screenX < vW &&
        screenY + screenH > 40 &&
        screenY < vH
      );
    });

  // Auto-recovery: if on load all cards would be completely off-screen, auto-reset to origin
  useEffect(() => {
    if (items.length > 0 && typeof window !== "undefined") {
      const vW = window.innerWidth || 1200;
      const vH = window.innerHeight || 800;
      const hasAnyVisible = items.some((item) => {
        const itemX = item.x ?? 60;
        const itemY = item.y ?? 60;
        const itemW = item.width ?? 390;
        const itemH = item.height ?? 320;
        const screenX = pan.x + itemX * zoom;
        const screenY = pan.y + itemY * zoom;
        return (
          screenX + itemW * zoom > 40 &&
          screenX < vW &&
          screenY + itemH * zoom > 40 &&
          screenY < vH
        );
      });
      if (!hasAnyVisible) {
        setPan({ x: 40, y: 40 });
        setZoom(1.0);
        scheduleViewportSave(40, 40, 1.0);
      }
    }
  }, [items]);

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
      scheduleViewportSave(panRef.current.x, panRef.current.y, zoomRef.current);
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

  // Canvas Touch Events for Panning & Gesture Pinch Zooming
  const touchPanStartRef = useRef<{ clientX: number; clientY: number; panX: number; panY: number } | null>(null);
  const touchPinchDistRef = useRef<number | null>(null);
  const touchDraggingIdRef = useRef<string | null>(null);
  const touchDragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchLastNodePosRef = useRef<{ id: string; x: number; y: number; width?: number; height?: number } | null>(null);

  const handleCanvasTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest(".canvas-node-handle")) return;
    if (target.closest("button") || target.closest("input") || target.closest("select")) return;
    if (target.closest(".side-popover") || target.closest(".selection-bubble")) return;

    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchPanStartRef.current = {
        clientX: t.clientX,
        clientY: t.clientY,
        panX: pan.x,
        panY: pan.y,
      };
      setIsPanning(true);
    } else if (e.touches.length === 2) {
      // 2-finger touch activates smooth pinch-to-zoom mode and pauses 1-finger canvas pan
      setIsPanning(false);
      touchPanStartRef.current = null;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchPinchDistRef.current = dist;
    }
  };

  const handleCanvasTouchMove = (e: React.TouchEvent) => {
    if (touchDraggingIdRef.current && e.touches.length === 1) {
      const t = e.touches[0];
      const nodeX = (t.clientX - pan.x) / zoom - touchDragOffsetRef.current.x;
      const nodeY = (t.clientY - pan.y) / zoom - touchDragOffsetRef.current.y;
      const roundedX = Math.round(nodeX);
      const roundedY = Math.round(nodeY);

      touchLastNodePosRef.current = {
        id: touchDraggingIdRef.current,
        x: roundedX,
        y: roundedY,
        width: touchLastNodePosRef.current?.width,
        height: touchLastNodePosRef.current?.height,
      };

      setItems((prev) =>
        prev.map((item) =>
          item.id === touchDraggingIdRef.current
            ? { ...item, x: roundedX, y: roundedY }
            : item
        )
      );
    } else if (e.touches.length === 2 && touchPinchDistRef.current !== null) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = (currentDist - touchPinchDistRef.current) / 250;
      touchPinchDistRef.current = currentDist;
      setZoom((prev) => {
        const nextZoom = Math.min(2.0, Math.max(0.3, Math.round((prev + delta) * 100) / 100));
        scheduleViewportSave(panRef.current.x, panRef.current.y, nextZoom);
        return nextZoom;
      });
    } else if (isPanning && touchPanStartRef.current && e.touches.length === 1) {
      const t = e.touches[0];
      const deltaX = t.clientX - touchPanStartRef.current.clientX;
      const deltaY = t.clientY - touchPanStartRef.current.clientY;
      setPan({
        x: touchPanStartRef.current.panX + deltaX,
        y: touchPanStartRef.current.panY + deltaY,
      });
    }
  };

  const handleCanvasTouchEnd = async (e: React.TouchEvent) => {
    if (touchDraggingIdRef.current) {
      const lastPos = touchLastNodePosRef.current;
      if (lastPos && lastPos.id === touchDraggingIdRef.current) {
        await updateTeamBoardItemPositionAction(
          lastPos.id,
          lastPos.x,
          lastPos.y,
          lastPos.width,
          lastPos.height
        );
      } else {
        const draggedNode = items.find((i) => i.id === touchDraggingIdRef.current);
        if (draggedNode && draggedNode.x !== undefined && draggedNode.y !== undefined) {
          await updateTeamBoardItemPositionAction(
            draggedNode.id,
            draggedNode.x,
            draggedNode.y,
            draggedNode.width,
            draggedNode.height
          );
        }
      }
      touchDraggingIdRef.current = null;
      touchLastNodePosRef.current = null;
    }

    if (e.touches.length === 0) {
      if (isPanning) {
        setIsPanning(false);
        scheduleViewportSave(panRef.current.x, panRef.current.y, zoomRef.current);
      }
      touchPanStartRef.current = null;
      touchPinchDistRef.current = null;
    } else if (e.touches.length === 1) {
      // Smoothly transition back to 1-finger panning without snapping
      const t = e.touches[0];
      touchPanStartRef.current = {
        clientX: t.clientX,
        clientY: t.clientY,
        panX: panRef.current.x,
        panY: panRef.current.y,
      };
      touchPinchDistRef.current = null;
      setIsPanning(true);
    }
  };

  const handleNodeHeaderTouchStart = (e: React.TouchEvent, item: TeamBoardItem) => {
    e.stopPropagation();
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    const itemX = item.x ?? 100;
    const itemY = item.y ?? 100;
    const touchCanvasX = (t.clientX - pan.x) / zoom;
    const touchCanvasY = (t.clientY - pan.y) / zoom;
    touchDragOffsetRef.current = {
      x: touchCanvasX - itemX,
      y: touchCanvasY - itemY,
    };
    touchLastNodePosRef.current = {
      id: item.id,
      x: itemX,
      y: itemY,
      width: item.width,
      height: item.height,
    };
    touchDraggingIdRef.current = item.id;
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

  // Global Selection Change Listener for instant floating toolbar detection on any selected text (Judul, Subjudul, Deskripsi)
  useEffect(() => {
    if (isMobile) return;

    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        setSelectionBubble((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      // Check if the selection is inside an active canvas node
      const anchorNode = sel.anchorNode;
      if (!anchorNode) return;
      const cardEl = (
        anchorNode instanceof Element ? anchorNode : anchorNode.parentElement
      )?.closest(".canvas-node");

      if (!cardEl) {
        setSelectionBubble((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setSelectionBubble((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      const cardIdFromEl = cardEl.getAttribute("data-card-id");

      setSelectionBubble({
        visible: true,
        x: rect.left + rect.width / 2,
        y: Math.max(10, rect.top - 54),
        targetCardId: cardIdFromEl || activeCardId,
      });
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [isMobile, activeCardId]);

  // Sync any DOM text changes back to card state and autosave
  const syncCardDomToState = (cardId: string) => {
    const cardEl = document.querySelector(`[data-card-id="${cardId}"]`);
    if (!cardEl) return;

    const titleEl = cardEl.querySelector("[data-field='title']");
    const subtitleEl = cardEl.querySelector("[data-field='subtitle']");
    const contentEl = cardEl.querySelector("[data-field='content']");

    const updates: Partial<TeamBoardItem> = {};
    if (titleEl) updates.title = titleEl.innerHTML;
    if (subtitleEl) updates.subtitle = subtitleEl.innerHTML;
    if (contentEl) updates.content = contentEl.innerHTML;

    setItems((prev) =>
      prev.map((i) => (i.id === cardId ? { ...i, ...updates } : i))
    );
    scheduleAutoSave(cardId, updates);
  };

  // Selection Format Toolbar Handlers
  const handleApplyFormatting = (command: "bold" | "italic" | "strikeThrough") => {
    document.execCommand(command, false);
    const targetId = selectionBubble.targetCardId || activeCardId;
    if (targetId) {
      syncCardDomToState(targetId);
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

    const targetId = selectionBubble.targetCardId || activeCardId;
    if (targetId) {
      syncCardDomToState(targetId);
    }
  };

  const handleApplyColorToSelection = (colorHex: string) => {
    try {
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand("foreColor", false, colorHex);
    } catch {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      const span = document.createElement("span");
      span.style.color = colorHex;
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
    }

    const targetId = selectionBubble.targetCardId || activeCardId;
    if (targetId) {
      syncCardDomToState(targetId);
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
          border: "border-emerald-300 hover:border-emerald-400",
          badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          accentBar: "bg-emerald-500",
          glow: "focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20",
        };
      case "amber":
        return {
          border: "border-amber-300 hover:border-amber-400",
          badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
          accentBar: "bg-amber-500",
          glow: "focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20",
        };
      case "rose":
        return {
          border: "border-rose-300 hover:border-rose-400",
          badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
          accentBar: "bg-rose-500",
          glow: "focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-500/20",
        };
      case "sky":
        return {
          border: "border-sky-300 hover:border-sky-400",
          badgeBg: "bg-sky-50 text-sky-700 border-sky-200",
          accentBar: "bg-sky-500",
          glow: "focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20",
        };
      case "purple":
        return {
          border: "border-purple-300 hover:border-purple-400",
          badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
          accentBar: "bg-purple-500",
          glow: "focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20",
        };
      case "indigo":
      default:
        return {
          border: "border-blue-300 hover:border-blue-400",
          badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
          accentBar: "bg-blue-600",
          glow: "focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20",
        };
    }
  };

  const getCategoryIcon = (cat: TeamBoardItem["category"]) => {
    switch (cat) {
      case "ANNOUNCEMENT":
        return <Bell className="w-3.5 h-3.5 text-amber-600" />;
      case "SOP":
        return <BookOpen className="w-3.5 h-3.5 text-sky-600" />;
      case "TARGET":
        return <Target className="w-3.5 h-3.5 text-emerald-600" />;
      case "IDEA":
        return <Lightbulb className="w-3.5 h-3.5 text-purple-600" />;
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-12rem)] min-h-[580px] bg-slate-50 border border-slate-200/80 rounded-xl overflow-hidden font-sans selection:bg-blue-100 selection:text-blue-900 shadow-sm">
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
                className="px-1.5 py-0.5 text-[10px] font-bold text-slate-300 hover:text-white hover:bg-blue-600 rounded transition-colors"
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
            className="p-1 rounded hover:bg-blue-600/20 text-slate-300 hover:text-blue-400 transition-colors"
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
            className="p-1 rounded hover:bg-blue-600/20 text-slate-300 hover:text-blue-400 transition-colors"
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
            className="p-1 rounded hover:bg-blue-600/20 text-slate-300 hover:text-blue-400 transition-colors"
            title="Coret (Strikethrough)"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-700/80 mx-0.5" />

          {/* Custom Text Color Palette: Merah, Hijau, Biru, Oren, Abu-abu, Putih */}
          <div className="flex items-center gap-1 bg-slate-800/80 px-1 py-0.5 rounded-lg border border-slate-700/60">
            {[
              { name: "Merah", hex: "#ef4444", bgClass: "bg-red-500 hover:ring-red-400" },
              { name: "Hijau", hex: "#22c55e", bgClass: "bg-emerald-500 hover:ring-emerald-400" },
              { name: "Biru", hex: "#3b82f6", bgClass: "bg-blue-500 hover:ring-blue-400" },
              { name: "Oren", hex: "#f97316", bgClass: "bg-orange-500 hover:ring-orange-400" },
              { name: "Abu-abu", hex: "#64748b", bgClass: "bg-slate-500 hover:ring-slate-400" },
              { name: "Hitam", hex: "#0f172a", bgClass: "bg-slate-900 hover:ring-slate-700" },
            ].map((col) => (
              <button
                key={col.name}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleApplyColorToSelection(col.hex);
                }}
                className={`w-3.5 h-3.5 rounded-full ${col.bgClass} transition-transform hover:scale-125 hover:ring-2 shadow-sm border border-slate-900`}
                title={`Warna teks ${col.name}`}
              />
            ))}
          </div>

          {/* Downward triangle arrow */}
          <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-slate-900 border-r border-b border-slate-700/80 rotate-45" />
        </div>
      )}

      {/* Slash command notification toast */}
      {slashToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-700/80 text-white text-xs font-medium px-3.5 py-1.5 rounded-lg shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          {slashToast}
        </div>
      )}

      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: Title & Quick Category Filter Dropdown & Shared Canvas Badge */}
        <div className="flex items-center gap-2.5 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-sm pointer-events-auto">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="text-xs font-bold text-slate-900 tracking-wider uppercase">
              Kanban Workspace
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* Shared Canvas View Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200 text-[10px] text-slate-600 font-mono">
            <span className="font-semibold text-emerald-700">SHARED VIEWPORT • SYNCED</span>
          </div>

          <div className="hidden lg:block h-4 w-px bg-slate-200" />

          {/* Category Filter Dropdown */}
          <div className="relative flex items-center">
            <select
              value={selectedCategory}
              onChange={(e) =>
                setSelectedCategory(
                  e.target.value as "ALL" | "ANNOUNCEMENT" | "SOP" | "TARGET" | "IDEA"
                )
              }
              className="bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
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
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kanban..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 text-xs text-slate-800 pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 w-40 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Right: Zoom Controls & Create Button */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Mobile/Desktop View Mode Toggle: Canvas vs List */}
          <div className="flex items-center bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/90 p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode("CANVAS")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === "CANVAS"
                  ? "bg-blue-600 text-white shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
              title="Tampilan Kanvas 2D Interaktif"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="text-[11px] sm:text-xs">Kanvas</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("LIST")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === "LIST"
                  ? "bg-blue-600 text-white shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
              title="Tampilan Daftar / Kartu Mobile"
            >
              <List className="w-3.5 h-3.5" />
              <span className="text-[11px] sm:text-xs">Daftar</span>
            </button>
          </div>

          {/* Zoom controls (Canvas only) */}
          {viewMode === "CANVAS" && (
            <div className="hidden sm:flex items-center bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/90 p-1 shadow-sm">
              <button
                onClick={() => handleZoom(-0.1)}
                title="Perkecil (-)"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono text-slate-700 px-2 min-w-[42px] text-center font-semibold">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => handleZoom(0.1)}
                title="Perbesar (+)"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <div className="h-4 w-px bg-slate-200 mx-1" />
              <button
                onClick={handleResetView}
                title="Fokuskan Sudut Pandang ke Kotak (Reset 1:1)"
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors text-xs font-semibold"
              >
                <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden md:inline">Fokus Kotak</span>
              </button>
            </div>
          )}

          {/* Primary Create Button */}
          <button
            onClick={handlePrimaryCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Kotak</span>
          </button>
        </div>
      </div>

      {/* Off-screen recovery alert: appears if cards were panned out of view in canvas mode */}
      {viewMode === "CANVAS" && areCardsOffScreen && items.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/95 border border-amber-300 backdrop-blur-md shadow-xl text-amber-900 text-xs font-medium animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="flex items-center gap-1.5">
            <Target className="w-4 h-4 text-amber-600" />
            Kotak kanban berada di luar sudut pandang layar.
          </span>
          <button
            type="button"
            onClick={handleResetView}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-all active:scale-95"
          >
            Bawa ke Layar (Fokus Kotak)
          </button>
        </div>
      )}

      {/* Floating Mobile Toggle to return to List View when exploring Canvas */}
      {isMobile && viewMode === "CANVAS" && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
          <button
            type="button"
            onClick={() => setViewMode("LIST")}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-semibold rounded-full shadow-lg backdrop-blur-md border border-slate-700/80 transition-transform active:scale-95"
          >
            <List className="w-3.5 h-3.5" />
            <span>Beralih ke Tampilan Daftar</span>
          </button>
        </div>
      )}

      {/* Conditional: Mobile List / Card View vs Interactive 2D Canvas */}
      {viewMode === "LIST" ? (
        <div className="w-full h-full pt-20 pb-8 px-4 sm:px-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Quick mobile search when toolbar input is hidden on mobile */}
            <div className="sm:hidden relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari kanban..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white text-xs text-slate-800 pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 placeholder:text-slate-400 shadow-2xs"
              />
            </div>

            {filteredItems.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs mt-6">
                <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-800">Tidak ada catatan ditemukan</p>
                <p className="text-xs text-slate-500 mt-1">Coba sesuaikan filter kategori atau kata kunci pencarian.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredItems.map((item) => {
                  const styles = getThemeStyles(item.colorTheme);
                  const imageAttachments = item.attachments?.filter(isImageAttachment) || [];
                  const docAttachments = item.attachments?.filter((att) => !isImageAttachment(att)) || [];

                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-2xl border ${styles.border} shadow-2xs p-4 flex flex-col justify-between space-y-3 transition-shadow hover:shadow-xs`}
                    >
                      <div className="space-y-2">
                        {/* Card Header */}
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${styles.badgeBg}`}
                          >
                            {getCategoryIcon(item.category)}
                            {item.category}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(item.createdAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                            <button
                              onClick={(e) => handleOpenEdit(item, e)}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                              title="Edit catatan"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteNode(item.id, e)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              title="Hapus catatan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Title & Subtitle */}
                        <h3
                          className={`text-slate-900 leading-snug font-bold ${getStyleClasses(
                            item.titleStyle,
                            "text-sm",
                            "font-bold"
                          )}`}
                          dangerouslySetInnerHTML={{ __html: item.title }}
                        />
                        {item.subtitle && (
                          <h4
                            className={`text-slate-500 leading-snug ${getStyleClasses(
                              item.subtitleStyle,
                              "text-xs",
                              "font-medium"
                            )}`}
                            dangerouslySetInnerHTML={{ __html: item.subtitle }}
                          />
                        )}

                        {/* Content */}
                        <div
                          className={`text-slate-700 leading-relaxed whitespace-pre-wrap ${getStyleClasses(
                            item.contentStyle,
                            "text-xs",
                            "font-normal"
                          )}`}
                          dangerouslySetInnerHTML={{ __html: item.content }}
                        />

                        {/* Image Attachments */}
                        {imageAttachments.length > 0 && (
                          <div className="pt-2 grid grid-cols-2 gap-2">
                            {imageAttachments.map((img) => (
                              <img
                                key={img.id}
                                src={img.url}
                                alt={img.name}
                                onClick={() => setPreviewAttachment(img)}
                                className="h-28 w-full object-cover rounded-xl border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                              />
                            ))}
                          </div>
                        )}

                        {/* Document Attachments */}
                        {docAttachments.length > 0 && (
                          <div className="pt-1 space-y-1">
                            {docAttachments.map((doc) => (
                              <div
                                key={doc.id}
                                onClick={() => setPreviewAttachment(doc)}
                                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors"
                              >
                                <span className="flex items-center gap-1.5 truncate">
                                  <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  <span className="truncate">{doc.name}</span>
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                                  {doc.size}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Author Footer */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {item.authorName}
                        </span>
                        <span>Fynux Internal</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Infinite Canvas Area with Touch Gestures */
        <div
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onDoubleClick={handleCanvasDoubleClick}
          onTouchStart={handleCanvasTouchStart}
          onTouchMove={handleCanvasTouchMove}
          onTouchEnd={handleCanvasTouchEnd}
          onTouchCancel={handleCanvasTouchEnd}
          className={`w-full h-full relative select-none cursor-${
            isPanning ? "grabbing" : "grab"
          } overflow-hidden`}
          style={{
            touchAction: "none",
            backgroundImage: `radial-gradient(circle, rgba(148, 163, 184, 0.45) 1px, transparent 1px)`,
            backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
        >
        {/* Empty State Indicator */}
        {filteredItems.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none z-20">
            <div className="flex flex-col items-center justify-center p-8 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 text-center shadow-lg pointer-events-auto max-w-sm animate-in fade-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                {searchQuery || selectedCategory !== "ALL"
                  ? "Tidak ada kotak yang cocok"
                  : "Papan Tim Masih Kosong"}
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {searchQuery || selectedCategory !== "ALL"
                  ? "Coba ubah kata kunci pencarian atau filter kategori papan."
                  : "Klik tombol 'Tambah Kotak' di kanan atas atau klik dua kali di kanvas untuk mulai membuat catatan, SOP, atau target tim."}
              </p>
              {!searchQuery && selectedCategory === "ALL" && (
                <button
                  type="button"
                  onClick={() => handlePrimaryCreate()}
                  className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Kotak Pertama</span>
                </button>
              )}
            </div>
          </div>
        )}

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
                data-card-id={item.id}
                onClick={(e) => handleCardClick(item, e)}
                className={`canvas-node select-text selection:bg-blue-100 selection:text-blue-900 absolute bg-white rounded-2xl border ${
                  styles.border
                } shadow-sm hover:shadow-md flex flex-col group transition-shadow ${
                  isActive ? "ring-2 ring-blue-500 shadow-md z-30" : "hover:border-slate-300 z-10"
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
                  onTouchStart={(e) => handleNodeHeaderTouchStart(e, item)}
                  className="canvas-node-handle px-4 py-2.5 border-b border-slate-100 flex items-center justify-between cursor-move bg-slate-50/80 rounded-t-2xl select-none"
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
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 mr-1">
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
                      className="text-slate-400 hover:text-blue-600 p-1 rounded transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDeleteNode(item.id, e)}
                      title="Hapus kotak ini"
                      className="text-slate-400 hover:text-rose-500 p-1 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Content Body: Direct Desktop Inline Typing OR Rendered Text */}
                <div className="p-4 flex-1 overflow-y-auto space-y-2.5 select-text">
                  {/* Judul: Direct rich text field on desktop if active, otherwise rendered */}
                  {isActive && !isMobile ? (
                    <DesktopInlineField
                      fieldKey={`${item.id}-title`}
                      dataField="title"
                      initialValue={item.title}
                      placeholder="Tulis judul kotak..."
                      onValueChange={(val) => handleUpdateCardTitle(item.id, val)}
                      onEnterPress={() => {
                        const sub = document.querySelector(
                          `[data-card-id="${item.id}"] [data-field="subtitle"]`
                        ) as HTMLElement | null;
                        sub?.focus();
                      }}
                      className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors ${getStyleClasses(
                        item.titleStyle,
                        "text-base",
                        "font-extrabold"
                      )}`}
                    />
                  ) : (
                    <h3
                      className={`text-slate-900 leading-tight ${getStyleClasses(
                        item.titleStyle,
                        "text-base",
                        "font-extrabold"
                      )}`}
                      dangerouslySetInnerHTML={{ __html: item.title }}
                    />
                  )}

                  {/* Subjudul: Direct rich text field on desktop if active, otherwise rendered */}
                  {isActive && !isMobile ? (
                    <DesktopInlineField
                      fieldKey={`${item.id}-subtitle`}
                      dataField="subtitle"
                      initialValue={item.subtitle || ""}
                      placeholder="Tulis subjudul catatan (opsional)..."
                      onValueChange={(val) => handleUpdateCardSubtitle(item.id, val)}
                      onEnterPress={() => {
                        const cont = document.querySelector(
                          `[data-card-id="${item.id}"] [data-field="content"]`
                        ) as HTMLElement | null;
                        cont?.focus();
                      }}
                      className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-blue-600 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors ${getStyleClasses(
                        item.subtitleStyle,
                        "text-xs",
                        "font-semibold"
                      )}`}
                    />
                  ) : (
                    item.subtitle && (
                      <h4
                        className={`text-blue-600 leading-snug ${getStyleClasses(
                          item.subtitleStyle,
                          "text-xs",
                          "font-semibold"
                        )}`}
                        dangerouslySetInnerHTML={{ __html: item.subtitle }}
                      />
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
                        onTriggerUpload={() => {
                          targetCardUploadIdRef.current = item.id;
                          cardFileInputRef.current?.click();
                          setSlashToast("Membuka pemilih berkas untuk /upload...");
                          setTimeout(() => setSlashToast(null), 3000);
                        }}
                        className={`w-full min-h-[90px] bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 text-xs focus:outline-none focus:bg-white focus:border-blue-500 transition-colors whitespace-pre-wrap selection:bg-blue-100 selection:text-blue-900 leading-relaxed ${getStyleClasses(
                          item.contentStyle,
                          "text-xs",
                          "font-normal"
                        )}`}
                      />
                      <div className="text-[10px] text-slate-400 flex items-center justify-between px-1">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-blue-600" />
                          Blok teks untuk styling / Ketik{" "}
                          <code className="text-blue-600 font-mono font-bold bg-slate-100 px-1 py-0.5 rounded border border-slate-200">
                            /upload
                          </code>{" "}
                          untuk berkas
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`text-slate-600 leading-relaxed whitespace-pre-line ${getStyleClasses(
                        item.contentStyle,
                        "text-xs",
                        "font-normal"
                      )}`}
                      dangerouslySetInnerHTML={{ __html: item.content }}
                    />
                  )}

                  {/* 1. PREVIEW GAMBAR LANGSUNG DI KANVAS */}
                  {imageAttachments.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <div className="text-[10px] font-bold text-slate-500 mb-1.5 flex items-center justify-between uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <ImageIcon className="w-3 h-3 text-blue-600" />
                          Lampiran Gambar ({imageAttachments.length})
                        </span>
                      </div>

                      {imageAttachments.length === 1 ? (
                        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-h-48 cursor-pointer group/img hover:border-blue-400 transition-all shadow-xs">
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
                            className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold text-white backdrop-blur-xs"
                          >
                            Klik untuk Memperbesar Gambar
                          </div>
                          {isActive && (
                            <button
                              type="button"
                              onClick={(e) =>
                                handleRemoveCardAttachment(item.id, imageAttachments[0].id, e)
                              }
                              className="absolute top-2 right-2 bg-rose-600/90 hover:bg-rose-600 text-white p-1 rounded-full shadow transition-transform hover:scale-110"
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
                              className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 h-24 cursor-pointer group/img hover:border-blue-400 transition-all shadow-xs"
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
                                className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-bold text-white text-center p-1"
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
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Paperclip className="w-3 h-3 text-blue-600" /> Berkas Dokumen (
                        {docAttachments.length})
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {docAttachments.map((att) => (
                          <div
                            key={att.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-[11px] text-slate-700 transition-colors group/att"
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewAttachment(att);
                              }}
                              className="flex items-center gap-1.5 hover:text-blue-600 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-600" />
                              <span className="max-w-[130px] truncate">{att.name}</span>
                            </button>
                            {isActive && (
                              <button
                                type="button"
                                onClick={(e) =>
                                  handleRemoveCardAttachment(item.id, att.id, e)
                                }
                                className="text-slate-400 hover:text-rose-500 ml-1 p-0.5"
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
                <div className="px-4 py-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 bg-slate-50/50 rounded-b-2xl">
                  <span className="flex items-center gap-1 truncate">
                    <User className="w-3 h-3 text-slate-400" />
                    {item.authorName}
                  </span>
                  <span className="text-slate-400 font-mono">Fynux Internal</span>
                </div>

                {/* Custom Resize Corner Handle (Bottom-Right) */}
                <div
                  onMouseDown={(e) => handleResizeMouseDown(e, item)}
                  title="Tarik sudut untuk mengubah ukuran kotak"
                  className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors"
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
                    className="side-popover absolute left-full ml-3 top-0 flex flex-col gap-2.5 p-3 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-40 min-w-[150px] animate-in fade-in slide-in-from-left-2 duration-150"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1.5">
                      <span className="flex items-center gap-1 text-slate-700">
                        <Palette className="w-3 h-3 text-blue-600" /> Menu Kotak
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveCardId(null)}
                        className="text-slate-400 hover:text-slate-700"
                        title="Tutup Menu"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Kategori Selector */}
                    <div>
                      <div className="text-[10px] font-semibold text-slate-500 mb-1">
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
                                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                : "bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-300"
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
                      <div className="text-[10px] font-semibold text-slate-500 mb-1">
                        Warna Tema
                      </div>
                      <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                        {(["indigo", "emerald", "amber", "rose", "sky", "purple"] as const).map(
                          (col) => {
                            const bgMap = {
                              indigo: "bg-blue-600",
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
                                    ? "ring-2 ring-slate-900 scale-110 shadow-sm"
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
                      className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Upload className="w-3 h-3 text-blue-600" />
                      <span>Upload Berkas</span>
                    </button>

                    {/* Selesai Button */}
                    <button
                      type="button"
                      onClick={() => setActiveCardId(null)}
                      className="w-full py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
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
      )}

      {/* MODAL POPUP: Fallback untuk Mobile atau Pengaturan Form Khusus */}
      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] modal-backdrop-clean flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-ios-fade">
          <div className="bg-white border border-slate-200/90 rounded-2xl w-full max-w-xl max-h-[88vh] flex flex-col overflow-hidden animate-ios-scale relative shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingNodeId ? "Ubah Kotak Kanban" : "Tambah Kotak Kanban Baru"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleModalSave} className="flex flex-col min-h-0 flex-1">
              <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {errorMessage}
                </div>
              )}

              {/* Kategori & Warna Theme */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Kategori Papan
                  </label>
                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as TeamBoardItem["category"])
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                  >
                    <option value="ANNOUNCEMENT">📢 Pengumuman</option>
                    <option value="SOP">📖 SOP & Prosedur</option>
                    <option value="TARGET">🎯 Target & KPI</option>
                    <option value="IDEA">💡 Ide & Inovasi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Warna Tema Kotak
                  </label>
                  <div className="flex items-center gap-2 py-1">
                    {(["indigo", "emerald", "amber", "rose", "sky", "purple"] as const).map(
                      (theme) => {
                        const bgColors = {
                          indigo: "bg-blue-600",
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
                                ? "ring-2 ring-slate-900 scale-110 shadow-sm"
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
                  className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 transition-all placeholder:text-slate-400 ${getStyleClasses(
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
                  className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-blue-600 focus:outline-none focus:bg-white focus:border-blue-500 transition-all placeholder:text-slate-400 ${getStyleClasses(
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
                  className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500 transition-all placeholder:text-slate-400 ${getStyleClasses(
                    contentStyle,
                    "text-xs",
                    "font-normal"
                  )}`}
                />
              </div>

              {/* UPLOAD BERKAS & PREVIEW DI MODAL */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                    Lampiran Berkas (Gambar & Dokumen)
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Format: JPG, PNG, WEBP, PDF, TXT
                  </span>
                </label>

                {/* Upload Button */}
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs text-slate-700 font-medium transition-colors shadow-xs">
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>Pilih Berkas Lampiran...</span>
                    <input
                      type="file"
                      multiple
                      onChange={handleModalFileUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Otomatis dikompres & muncul di canvas
                  </span>
                </div>

                {/* List Preview Berkas */}
                {attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="text-[11px] font-bold text-slate-600">
                      Berkas Terlampir ({attachments.length}):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {attachments.map((att) => {
                        const isImg = isImageAttachment(att);
                        return (
                          <div
                            key={att.id}
                            className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                          >
                            <div
                              onClick={() => setPreviewAttachment(att)}
                              className="flex items-center gap-2 min-w-0 cursor-pointer hover:text-blue-600 transition-colors flex-1"
                            >
                              {isImg ? (
                                <img
                                  src={att.url}
                                  alt={att.name}
                                  className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-slate-800 font-medium text-[11px]">
                                  {att.name}
                                </p>
                                <p className="text-[9px] text-slate-400">{att.size}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setAttachments((prev) => prev.filter((a) => a.id !== att.id))
                              }
                              className="text-slate-400 hover:text-rose-500 p-1 rounded transition-colors"
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

              </div>

              {/* Sticky Submit Footer */}
              <div className="shrink-0 px-6 py-4 border-t border-slate-200/80 bg-slate-50/90 rounded-b-2xl flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-slate-200/90 text-slate-700 text-xs font-semibold rounded-lg bg-white hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm disabled:opacity-50 transition-colors flex items-center gap-2"
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
      </ModalPortal>
    )}

      {/* DOCUMENT & IMAGE HIGH-RES PREVIEW MODAL */}
      <DocumentPreviewModal
        attachment={previewAttachment}
        onClose={() => setPreviewAttachment(null)}
      />
    </div>
  );
}
