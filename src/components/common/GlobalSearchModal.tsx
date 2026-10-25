"use client";

import React, { useEffect, useState } from "react";
import {
  Search,
  Users,
  Building2,
  Briefcase,
  Receipt,
  X,
  ExternalLink,
  Command,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { searchGlobalAction, SearchResultItem } from "@/modules/search/search.actions";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await searchGlobalAction(query);
        setResults(res);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (url: string) => {
    onClose();
    router.push(url);
  };

  const getCategoryIcon = (cat: SearchResultItem["category"]) => {
    switch (cat) {
      case "PROSPECT":
        return <Users className="w-4 h-4 text-amber-500" />;
      case "CLIENT":
        return <Building2 className="w-4 h-4 text-emerald-500" />;
      case "PROJECT":
        return <Briefcase className="w-4 h-4 text-indigo-500" />;
      case "INVOICE":
        return <Receipt className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden relative">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            autoFocus
            placeholder="Cari nama prospek, klien, proyek, atau nomor faktur (FYN-...)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2">
          {isSearching && (
            <div className="text-center py-6 text-xs text-slate-400">
              Mencari di seluruh sistem...
            </div>
          )}

          {!isSearching && query && results.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-400">
              Tidak ada hasil ditemukan untuk &quot;{query}&quot;
            </div>
          )}

          {!isSearching && !query && (
            <div className="p-4 text-center text-xs text-slate-400 space-y-1">
              <Command className="w-6 h-6 mx-auto text-slate-300 mb-1" />
              <p className="font-semibold text-slate-600">Pencarian Universal Cepat</p>
              <p>Ketik nama perusahaan, PIC, nama proyek, atau nomor invoice resmi.</p>
            </div>
          )}

          {!isSearching &&
            results.map((item) => (
              <div
                key={`${item.category}-${item.id}`}
                onClick={() => handleSelect(item.url)}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-white border border-slate-200/60 mt-0.5">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {item.title}
                      </span>
                      {item.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {item.subtitle}
                    </div>
                  </div>
                </div>

                <div className="text-slate-400 group-hover:text-indigo-600">
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Gunakan panah atau klik untuk membuka rute</span>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 font-semibold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
