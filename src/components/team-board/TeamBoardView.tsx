"use client";

import React, { useState } from "react";
import {
  Bell,
  BookOpen,
  Target,
  Lightbulb,
  Plus,
  Search,
  Filter,
  User,
  Calendar,
  X,
  FileText,
} from "lucide-react";
import { TeamBoardItem } from "@/modules/projects/types";
import { createTeamBoardItemAction } from "@/modules/projects/projects.actions";

interface TeamBoardViewProps {
  initialItems: TeamBoardItem[];
  currentUserRole?: string;
}

export function TeamBoardView({
  initialItems,
  currentUserRole,
}: TeamBoardViewProps) {
  const [items, setItems] = useState<TeamBoardItem[]>(initialItems);
  const [selectedCategory, setSelectedCategory] = useState<
    "ALL" | "ANNOUNCEMENT" | "SOP" | "TARGET" | "IDEA"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New item form state
  const [category, setCategory] = useState<TeamBoardItem["category"]>("ANNOUNCEMENT");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const filteredItems = items.filter((item) => {
    const matchesCategory =
      selectedCategory === "ALL" || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.authorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryBadge = (cat: TeamBoardItem["category"]) => {
    switch (cat) {
      case "ANNOUNCEMENT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Bell className="w-3 h-3" /> Pengumuman
          </span>
        );
      case "SOP":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <BookOpen className="w-3 h-3" /> SOP
          </span>
        );
      case "TARGET":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Target className="w-3 h-3" /> Target
          </span>
        );
      case "IDEA":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Lightbulb className="w-3 h-3" /> Ide & R&D
          </span>
        );
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorMessage("Judul dan konten wajib diisi.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);
    try {
      const res = await createTeamBoardItemAction(category, title, content);
      if (res.success) {
        // Refresh local view
        const newItem: TeamBoardItem = {
          id: `tb-${Date.now()}`,
          category,
          title,
          content,
          authorId: "current-user",
          authorName: "Saya (Baru Saja)",
          createdAt: new Date().toISOString(),
        };
        setItems([newItem, ...items]);
        setIsModalOpen(false);
        setTitle("");
        setContent("");
      } else {
        setErrorMessage(res.error || "Gagal memposting catatan.");
      }
    } catch {
      setErrorMessage("Terjadi kesalahan sistem saat memposting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-brand-orange" />
            Team Board & Knowledge Base
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Papan pengumuman internal, SOP operasional, target perusahaan, dan kolaborasi ide tim Fynux.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-orange hover:bg-orange-600 text-white font-medium text-sm rounded-lg shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Catatan / SOP
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              selectedCategory === "ALL"
                ? "bg-slate-800 text-white shadow-sm font-semibold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Semua ({items.length})
          </button>
          <button
            onClick={() => setSelectedCategory("ANNOUNCEMENT")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              selectedCategory === "ANNOUNCEMENT"
                ? "bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30"
                : "text-slate-400 hover:text-amber-400"
            }`}
          >
            <Bell className="w-3 h-3" /> Pengumuman (
            {items.filter((i) => i.category === "ANNOUNCEMENT").length})
          </button>
          <button
            onClick={() => setSelectedCategory("SOP")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              selectedCategory === "SOP"
                ? "bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30"
                : "text-slate-400 hover:text-blue-400"
            }`}
          >
            <BookOpen className="w-3 h-3" /> SOP (
            {items.filter((i) => i.category === "SOP").length})
          </button>
          <button
            onClick={() => setSelectedCategory("TARGET")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              selectedCategory === "TARGET"
                ? "bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30"
                : "text-slate-400 hover:text-emerald-400"
            }`}
          >
            <Target className="w-3 h-3" /> Target (
            {items.filter((i) => i.category === "TARGET").length})
          </button>
          <button
            onClick={() => setSelectedCategory("IDEA")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              selectedCategory === "IDEA"
                ? "bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30"
                : "text-slate-400 hover:text-purple-400"
            }`}
          >
            <Lightbulb className="w-3 h-3" /> Ide (
            {items.filter((i) => i.category === "IDEA").length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari judul, kata kunci, penulis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-slate-200 pl-9 pr-3 py-1.5 rounded-lg text-sm focus:outline-none focus:border-brand-orange"
          />
        </div>
      </div>

      {/* Grid of Board Posts */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 border border-slate-800/80 rounded-xl">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">Belum ada postingan</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            Tidak ada catatan yang sesuai dengan filter ini. Mulai dengan membuat SOP atau pengumuman baru untuk tim.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-md group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  {getCategoryBadge(item.category)}
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-brand-orange transition-colors mb-2 leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed mb-4">
                  {item.content}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/70 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 truncate">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  {item.authorName}
                </span>
                <span className="text-slate-600 text-[10px]">Internal Only</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah Catatan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5 text-brand-orange" />
              Buat Postingan Team Board
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Bagikan pengumuman, panduan kerja SOP, target performa, atau ide baru kepada seluruh anggota tim.
            </p>

            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Kategori Postingan <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCategory("ANNOUNCEMENT")}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                      category === "ANNOUNCEMENT"
                        ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                        : "bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    <Bell className="w-4 h-4 text-amber-400" />
                    Pengumuman
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategory("SOP")}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                      category === "SOP"
                        ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                        : "bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    SOP Operasional
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategory("TARGET")}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                      category === "TARGET"
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                        : "bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    <Target className="w-4 h-4 text-emerald-400" />
                    Target & Goal
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategory("IDEA")}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                      category === "IDEA"
                        ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                        : "bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    <Lightbulb className="w-4 h-4 text-purple-400" />
                    Ide / Brainstorming
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Judul Postingan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: SOP Standar Deliverable Proyek Website"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Isi Catatan / Panduan Lengkap <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Tuliskan detail panduan, poin-poin langkah kerja, atau target kuantitatif..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-orange"
                />
              </div>

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
                  className="px-4 py-2 bg-brand-orange hover:bg-orange-600 text-white rounded-lg text-xs font-medium shadow-md transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Memposting..." : "Publikasikan ke Tim"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
