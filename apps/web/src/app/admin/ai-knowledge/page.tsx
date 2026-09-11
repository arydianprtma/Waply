"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Search,
  Plus,
  RefreshCw,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  Bot,
  UserCheck,
  Tag,
  Zap,
  Check,
  Copy,
  SlidersHorizontal,
  X,
  Layers,
  FileText,
  GraduationCap
} from "lucide-react";
import type { AiKnowledgeItem, AiKnowledgeCategory, AiKnowledgeSource } from "@/lib/ai-knowledge";

const CATEGORY_MAP: Record<AiKnowledgeCategory, { label: string; bg: string; text: string; border: string }> = {
  TECHNICAL: { label: "Kendala Teknis", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  BILLING: { label: "Pembayaran & Paket", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  APPEAL: { label: "Banding / Suspend", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  FEATURE: { label: "Fitur & API", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  GENERAL: { label: "Umum & FAQ", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
  OTHER: { label: "Lainnya", bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" },
};

export default function AdminAiKnowledgePage() {
  const [items, setItems] = useState<AiKnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedSource, setSelectedSource] = useState<string>("ALL");

  // Learning action state
  const [learning, setLearning] = useState(false);
  const [learnMessage, setLearnMessage] = useState<string | null>(null);

  // Modal form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AiKnowledgeItem | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<AiKnowledgeCategory>("TECHNICAL");
  const [formProblem, setFormProblem] = useState("");
  const [formSolution, setFormSolution] = useState("");
  const [formKeywords, setFormKeywords] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchKnowledge = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/ai-knowledge");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setItems(json.data);
      }
    } catch (err) {
      console.error("Gagal mengambil data AI Knowledge:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKnowledge();
  }, [fetchKnowledge]);

  const handleBatchLearn = async () => {
    try {
      setLearning(true);
      setLearnMessage(null);
      const res = await fetch("/api/admin/ai-knowledge/learn", {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        setLearnMessage(json.message);
        fetchKnowledge();
      } else {
        setLearnMessage(json.error || "Gagal melakukan ekstraksi pembelajaran.");
      }
    } catch {
      setLearnMessage("Terjadi kesalahan jaringan saat ekstraksi.");
    } finally {
      setLearning(false);
      setTimeout(() => setLearnMessage(null), 6000);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/ai-knowledge/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      const json = await res.json();
      if (json.success) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, isActive: !currentActive } : item))
        );
      }
    } catch (err) {
      console.error("Gagal mengubah status aktif:", err);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus materi pengetahuan "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/ai-knowledge/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error("Gagal menghapus pengetahuan:", err);
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormTitle("");
    setFormCategory("TECHNICAL");
    setFormProblem("");
    setFormSolution("");
    setFormKeywords("");
    setFormActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: AiKnowledgeItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormProblem(item.problemDescription);
    setFormSolution(item.solution);
    setFormKeywords(item.keywords.join(", "));
    setFormActive(item.isActive);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formSolution.trim()) {
      setFormError("Judul kendala dan solusi wajib diisi.");
      return;
    }

    try {
      setSaving(true);
      setFormError(null);

      const parsedKeywords = formKeywords
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean);

      const payload = {
        title: formTitle.trim(),
        category: formCategory,
        problemDescription: formProblem.trim() || formTitle.trim(),
        solution: formSolution.trim(),
        keywords: parsedKeywords,
        isActive: formActive,
      };

      const url = editingItem
        ? `/api/admin/ai-knowledge/${editingItem.id}`
        : "/api/admin/ai-knowledge";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        fetchKnowledge();
      } else {
        setFormError(json.error || "Gagal menyimpan materi pengetahuan.");
      }
    } catch {
      setFormError("Terjadi kesalahan jaringan saat menyimpan data.");
    } finally {
      setSaving(false);
    }
  };

  const copySolution = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered list
  const filteredItems = items.filter((item) => {
    const matchCategory = selectedCategory === "ALL" || item.category === selectedCategory;
    const matchSource = selectedSource === "ALL" || item.source === selectedSource;
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.problemDescription.toLowerCase().includes(q) ||
      item.solution.toLowerCase().includes(q) ||
      item.keywords.some((k) => k.toLowerCase().includes(q));

    return matchCategory && matchSource && matchSearch;
  });

  // Calculate statistics
  const totalCount = items.length;
  const autoLearnedCount = items.filter((i) => i.source === "auto_learned").length;
  const adminManualCount = items.filter((i) => i.source === "admin_manual").length;
  const activeCount = items.filter((i) => i.isActive).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
            <span>AI Brain & Dynamic Training Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            AI Knowledge Base & Pembelajaran
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Pusat pengetahuan dan memori Waply AI Assistant. AI otomatis belajar dari setiap tiket yang diselesaikan oleh Admin, serta memanfaatkan SOP panduan khusus untuk menjawab kendala klien secara tepat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleBatchLearn}
            disabled={learning}
            className="px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Ekstrak materi baru dari semua tiket yang telah diselesaikan Admin"
          >
            {learning ? (
              <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
            ) : (
              <GraduationCap className="w-4 h-4 text-purple-600" />
            )}
            <span>{learning ? "Mengekstrak..." : "Pelajari Tiket Selesai"}</span>
          </button>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah SOP / Pengetahuan</span>
          </button>
        </div>
      </div>

      {/* Learn Notification Banner */}
      {learnMessage && (
        <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
            <span className="font-semibold">{learnMessage}</span>
          </div>
          <button
            onClick={() => setLearnMessage(null)}
            className="p-1 rounded-lg hover:bg-purple-200/60 text-purple-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Pengetahuan
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              {totalCount}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Auto-Learned Tiket
            </span>
            <span className="text-xl sm:text-2xl font-black text-purple-700">
              {autoLearnedCount}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              SOP Manual Admin
            </span>
            <span className="text-xl sm:text-2xl font-black text-blue-700">
              {adminManualCount}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Status Aktif
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-700">
              {activeCount} <span className="text-xs text-slate-400 font-normal">/ {totalCount}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kendala, kata kunci, atau solusi..."
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Kategori:</span>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="TECHNICAL">Kendala Teknis</option>
            <option value="BILLING">Pembayaran & Paket</option>
            <option value="APPEAL">Banding / Suspend</option>
            <option value="FEATURE">Fitur & API</option>
            <option value="GENERAL">Umum & FAQ</option>
            <option value="OTHER">Lainnya</option>
          </select>

          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="ALL">Semua Sumber</option>
            <option value="auto_learned">Auto-Learned (Tiket)</option>
            <option value="admin_manual">SOP Manual Admin</option>
          </select>
        </div>
      </div>

      {/* Knowledge Cards Grid */}
      {loading ? (
        <div className="p-12 text-center space-y-3 bg-white rounded-3xl border border-slate-200">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Memuat basis pengetahuan AI...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-white rounded-3xl border border-slate-200">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Tidak Ada Materi Ditemukan</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {search || selectedCategory !== "ALL" || selectedSource !== "ALL"
              ? "Tidak ada materi pengetahuan yang cocok dengan filter pencarian Anda."
              : "Belum ada materi pengetahuan AI yang ditambahkan. Buat SOP baru atau klik 'Pelajari Tiket Selesai'."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const cat = CATEGORY_MAP[item.category] || CATEGORY_MAP.OTHER;
            const isAuto = item.source === "auto_learned";

            return (
              <div
                key={item.id}
                className={`p-5 rounded-3xl bg-white border transition-all space-y-4 shadow-xs ${
                  item.isActive ? "border-slate-200 hover:border-slate-300" : "border-slate-200/60 opacity-60 bg-slate-50/50"
                }`}
              >
                {/* Header: Badges & Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cat.bg} ${cat.text} ${cat.border}`}
                    >
                      {cat.label}
                    </span>

                    {isAuto ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        <Bot className="w-3 h-3 text-purple-600" />
                        <span>Auto-Learned</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <UserCheck className="w-3 h-3 text-blue-600" />
                        <span>SOP Admin</span>
                      </span>
                    )}

                    {item.usageCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Zap className="w-2.5 h-2.5 text-amber-500" />
                        <span>{item.usageCount}x dipakai AI</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleToggleActive(item.id, item.isActive)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                        item.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      {item.isActive ? "Aktif" : "Nonaktif"}
                    </button>

                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Edit Pengetahuan"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus Pengetahuan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title & Problem Description */}
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {item.title}
                  </h3>
                  {item.problemDescription && (
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {item.problemDescription}
                    </p>
                  )}
                </div>

                {/* Solution Block */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span>Instruksi Solusi AI:</span>
                    <button
                      onClick={() => copySolution(item.id, item.solution)}
                      className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-primary transition-colors cursor-pointer"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Salin Solusi</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-800 font-mono whitespace-pre-line leading-relaxed max-h-40 overflow-y-auto">
                    {item.solution}
                  </div>
                </div>

                {/* Keywords footer */}
                {item.keywords && item.keywords.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
                    <Tag className="w-3 h-3 text-slate-400 shrink-0" />
                    {item.keywords.map((kw, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900">
                  {editingItem ? "Edit Materi Pengetahuan AI" : "Tambah SOP / Pengetahuan Baru"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Judul Kendala / Topik SOP <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: Kendala Sesi WhatsApp Terputus (Disconnected)"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Kategori Kendala
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as AiKnowledgeCategory)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-medium cursor-pointer"
                  >
                    <option value="TECHNICAL">Kendala Teknis</option>
                    <option value="BILLING">Pembayaran & Paket</option>
                    <option value="APPEAL">Banding / Suspend</option>
                    <option value="FEATURE">Fitur & API</option>
                    <option value="GENERAL">Umum & FAQ</option>
                    <option value="OTHER">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Status Aktif
                  </label>
                  <label className="flex items-center gap-2 h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={(e) => setFormActive(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary"
                    />
                    <span className="font-bold text-slate-700 text-xs">
                      {formActive ? "Aktif Digunakan AI" : "Nonaktif"}
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Deskripsi / Pertanyaan Pengguna
                </label>
                <input
                  type="text"
                  value={formProblem}
                  onChange={(e) => setFormProblem(e.target.value)}
                  placeholder="Contoh: Device WhatsApp tiba-tiba disconnected atau status merah di dashboard."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Instruksi Solusi AI / Langkah Penanganan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={formSolution}
                  onChange={(e) => setFormSolution(e.target.value)}
                  rows={5}
                  placeholder="Tuliskan langkah-langkah solusi konkret yang harus dipelajari dan disampaikan oleh AI ke pengguna..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-mono leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Kata Kunci Pemicu (Pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  value={formKeywords}
                  onChange={(e) => setFormKeywords(e.target.value)}
                  placeholder="disconnected, terputus, baileys, scan qr, session"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  * AI akan mencocokkan kata-kata ini dari pertanyaan klien untuk mengaktifkan solusi ini.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingItem ? "Simpan Perubahan" : "Tambahkan Materi"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
