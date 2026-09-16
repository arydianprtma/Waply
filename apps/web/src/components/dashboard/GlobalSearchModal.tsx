"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  ArrowRight,
  Compass,
  MessageSquare,
  Smartphone,
  FileText,
  Users,
  Headphones,
  Code2,
  Zap,
  CornerDownLeft,
  Loader2,
  Sparkles,
} from "lucide-react";
import clsx from "clsx";

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  category:
    | "Navigasi"
    | "Pesan & Log"
    | "WhatsApp Device"
    | "Template & Spintax"
    | "Admin & Users"
    | "Tiket Support"
    | "Dokumentasi & API";
  url: string;
  badge?: string;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export function GlobalSearchModal({ isOpen, onClose, initialQuery = "" }: GlobalSearchModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Keep query in sync if initialQuery changes
  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setSelectedIndex(0);
      // Small timeout to autofocus properly after render
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, initialQuery]);

  // Fetch search results from /api/search
  const fetchResults = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setResults(data.results || []);
          setSelectedIndex(0);
        }
      }
    } catch (e) {
      console.error("Search fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetchResults(query);
    }, 150);
    return () => clearTimeout(timer);
  }, [query, isOpen, fetchResults]);

  // Handle Keyboard navigation (ArrowUp, ArrowDown, Enter, Esc)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelectItem(results[selectedIndex]);
      } else if (query.trim()) {
        // Fallback: navigate to logs with search query
        router.push(`/dashboard/logs?search=${encodeURIComponent(query.trim())}`);
        onClose();
      }
    }
  };

  const handleSelectItem = (item: SearchResultItem) => {
    router.push(item.url);
    onClose();
  };

  const getCategoryIcon = (category: SearchResultItem["category"]) => {
    switch (category) {
      case "Navigasi":
        return <Compass className="w-4 h-4 text-emerald-600" />;
      case "Pesan & Log":
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case "WhatsApp Device":
        return <Smartphone className="w-4 h-4 text-purple-600" />;
      case "Template & Spintax":
        return <FileText className="w-4 h-4 text-amber-600" />;
      case "Admin & Users":
        return <Users className="w-4 h-4 text-rose-600" />;
      case "Tiket Support":
        return <Headphones className="w-4 h-4 text-teal-600" />;
      case "Dokumentasi & API":
        return <Code2 className="w-4 h-4 text-indigo-600" />;
      default:
        return <Zap className="w-4 h-4 text-slate-600" />;
    }
  };

  if (!isOpen) return null;

  // Group results by category
  const groupedCategories = Array.from(new Set(results.map((r) => r.category)));

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-base-100 rounded-2xl shadow-2xl border border-base-300 overflow-hidden flex flex-col max-h-[80vh] text-base-content"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header Input */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-base-200">
          <Search className="w-5 h-5 text-base-content/40 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik menu, nomor WhatsApp, isi pesan, template, atau user..."
            className="w-full bg-transparent text-sm sm:text-base font-medium placeholder:text-base-content/40 focus:outline-hidden"
          />
          {loading ? (
            <Loader2 className="w-4 h-4 text-emerald-500 animate-spin shrink-0 ml-2" />
          ) : query ? (
            <button
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="btn btn-ghost btn-circle btn-xs text-base-content/50 hover:text-base-content shrink-0 ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 ml-2 text-[10px] font-semibold text-base-content/60 bg-base-200 border border-base-300 rounded-md shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 divide-y divide-base-200/50">
          {results.length === 0 && !loading ? (
            <div className="text-center py-10 px-4">
              <Search className="w-10 h-10 text-base-content/20 mx-auto mb-2.5" />
              <p className="text-sm font-semibold text-base-content/70">
                Tidak ada hasil ditemukan untuk &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-base-content/40 mt-1">
                Coba gunakan kata kunci lain seperti nama menu, nomor HP, ID template, atau email.
              </p>
            </div>
          ) : (
            groupedCategories.map((category) => {
              const categoryItems = results.filter((r) => r.category === category);
              return (
                <div key={category} className="py-2 first:pt-0 last:pb-0">
                  <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-base-content/50 flex items-center gap-1.5">
                    {category}
                  </div>
                  <div className="mt-1 space-y-1">
                    {categoryItems.map((item) => {
                      const itemIndex = results.findIndex((r) => r.id === item.id);
                      const isSelected = itemIndex === selectedIndex;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectItem(item)}
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                          className={clsx(
                            "w-full text-left flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm transition-colors",
                            isSelected
                              ? "bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 border border-emerald-500/20 font-medium"
                              : "hover:bg-base-200 text-base-content border border-transparent"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={clsx(
                                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                                isSelected ? "bg-emerald-500/20" : "bg-base-200"
                              )}
                            >
                              {getCategoryIcon(item.category)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold truncate">{item.title}</span>
                                {item.badge && (
                                  <span className="badge badge-xs bg-base-200 text-base-content/70 border-base-300 text-[10px] px-1.5">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              {item.subtitle && (
                                <p className="text-[11px] text-base-content/50 truncate mt-0.5">
                                  {item.subtitle}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center text-base-content/40">
                            {isSelected ? (
                              <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                <span>Buka</span>
                                <CornerDownLeft className="w-3.5 h-3.5" />
                              </div>
                            ) : (
                              <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-base-200/60 border-t border-base-200 text-[11px] text-base-content/60 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-base-100 border border-base-300 rounded text-[10px] font-bold">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-base-100 border border-base-300 rounded text-[10px] font-bold">↓</kbd>
              Pilih
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-base-100 border border-base-300 rounded text-[10px] font-bold">↵</kbd>
              Buka
            </span>
          </div>
          <div className="flex items-center gap-1 text-emerald-600 font-medium">
            <Sparkles className="w-3 h-3" />
            <span>Pencarian Cepat Waply</span>
          </div>
        </div>
      </div>
    </div>
  );
}
