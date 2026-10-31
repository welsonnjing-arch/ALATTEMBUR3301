import {
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  FileCode,
  Archive,
  Film,
  Music,
  File,
  Folder,
} from "lucide-react";
import React from "react";

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function getFileCategory(ext?: string): string {
  const e = (ext || "").toLowerCase();
  if (["pdf", "doc", "docx", "txt", "md", "rtf", "odt"].includes(e)) return "Dokumen";
  if (["png", "jpg", "jpeg", "webp", "svg", "gif", "ico"].includes(e)) return "Gambar";
  if (["xlsx", "xls", "csv"].includes(e)) return "Spreadsheet";
  if (["ts", "tsx", "js", "jsx", "json", "html", "css", "py", "sh"].includes(e)) return "Kode";
  if (["zip", "rar", "7z", "tar", "gz"].includes(e)) return "Arsip";
  if (["mp4", "mov", "avi", "webm"].includes(e)) return "Video";
  if (["mp3", "wav", "ogg", "m4a"].includes(e)) return "Audio";
  return "File";
}

export function getFileIcon(ext?: string, className = "w-5 h-5") {
  const e = (ext || "").toLowerCase();

  if (["pdf"].includes(e)) {
    return <FileText className={`${className} text-rose-600`} />;
  }
  if (["doc", "docx", "txt", "rtf", "odt"].includes(e)) {
    return <FileText className={`${className} text-blue-600`} />;
  }
  if (["png", "jpg", "jpeg", "webp", "svg", "gif", "ico"].includes(e)) {
    return <ImageIcon className={`${className} text-emerald-600`} />;
  }
  if (["xlsx", "xls", "csv"].includes(e)) {
    return <FileSpreadsheet className={`${className} text-emerald-700`} />;
  }
  if (["ts", "tsx", "js", "jsx", "json", "html", "css", "py", "sh", "md"].includes(e)) {
    return <FileCode className={`${className} text-cyan-600`} />;
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(e)) {
    return <Archive className={`${className} text-amber-600`} />;
  }
  if (["mp4", "mov", "avi", "webm"].includes(e)) {
    return <Film className={`${className} text-purple-600`} />;
  }
  if (["mp3", "wav", "ogg", "m4a"].includes(e)) {
    return <Music className={`${className} text-indigo-600`} />;
  }

  return <File className={`${className} text-slate-500`} />;
}

export function getFolderColorStyle(color?: string) {
  switch (color) {
    case "blue":
      return {
        bg: "bg-blue-50/70",
        border: "border-blue-200/80",
        icon: "text-blue-600",
        badge: "bg-blue-100/70 text-blue-800",
      };
    case "emerald":
      return {
        bg: "bg-emerald-50/70",
        border: "border-emerald-200/80",
        icon: "text-emerald-600",
        badge: "bg-emerald-100/70 text-emerald-800",
      };
    case "amber":
      return {
        bg: "bg-amber-50/70",
        border: "border-amber-200/80",
        icon: "text-amber-600",
        badge: "bg-amber-100/70 text-amber-800",
      };
    case "rose":
      return {
        bg: "bg-rose-50/70",
        border: "border-rose-200/80",
        icon: "text-rose-600",
        badge: "bg-rose-100/70 text-rose-800",
      };
    case "slate":
    default:
      return {
        bg: "bg-slate-50/70",
        border: "border-slate-200/80",
        icon: "text-slate-600",
        badge: "bg-slate-100 text-slate-700",
      };
  }
}
