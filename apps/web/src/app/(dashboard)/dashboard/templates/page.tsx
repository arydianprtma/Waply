"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Plus,
  Copy,
  Edit2,
  Trash2,
  X,
  Tag,
  RefreshCw,
  Search,
  Check,
  Layers,
  Code2,
  Info,
} from "lucide-react";
import { ModalPortal } from "@/components/ui/ModalPortal";

type TemplateCategory =
  | "BROADCAST"
  | "PROMO"
  | "NOTIFIKASI"
  | "OTP"
  | "SUPPORT"
  | "LAINNYA";

interface MessageTemplate {
  id: string;
  name: string;
  shortcode: string;
  category: TemplateCategory;
  content: string;
  variables: string[];
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  BROADCAST: "Broadcast",
  PROMO: "Promo",
  NOTIFIKASI: "Notifikasi",
  OTP: "OTP",
  SUPPORT: "Support",
  LAINNYA: "Lainnya",
};

const CATEGORY_BADGES: Record<TemplateCategory, string> = {
  BROADCAST: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PROMO: "bg-amber-50 text-amber-700 border-amber-200",
  NOTIFIKASI: "bg-sky-50 text-sky-700 border-sky-200",
  OTP: "bg-rose-50 text-rose-700 border-rose-200",
  SUPPORT: "bg-indigo-50 text-indigo-700 border-indigo-200",
  LAINNYA: "bg-slate-100 text-slate-700 border-slate-200",
};

const QUICK_VARS = [
  "name",
  "phone",
  "order_id",
  "promo_code",
  "deadline",
  "otp_code",
  "kota",
  "produk",
  "harga",
];

/** Render ONE random variation of a {A|B|C} spintax string */
function renderSpintaxPreview(text: string): string {
  return text.replace(/\{([^{}]+)\}/g, (_, group: string) => {
    const opts = group.split("|");
    return opts[Math.floor(Math.random() * opts.length)];
  });
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<TemplateCategory | "ALL">("ALL");
  const [search, setSearch] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: "",
    shortcode: "",
    category: "LAINNYA" as TemplateCategory,
    content: "",
  });

  // Live preview state
  const [previews, setPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/templates");
      const json = await res.json();
      if (json.success) setTemplates(json.data);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Regenerate previews whenever content changes
  useEffect(() => {
    if (!form.content) {
      setPreviews([]);
      return;
    }
    const newPreviews = Array.from({ length: 3 }, () => renderSpintaxPreview(form.content));
    setPreviews(newPreviews);
  }, [form.content]);

  const openCreate = () => {
    setEditingTemplate(null);
    setForm({ name: "", shortcode: "", category: "LAINNYA", content: "" });
    setShowModal(true);
  };

  const openEdit = (tpl: MessageTemplate) => {
    setEditingTemplate(tpl);
    setForm({
      name: tpl.name,
      shortcode: tpl.shortcode,
      category: tpl.category,
      content: tpl.content,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      const url = editingTemplate ? `/api/templates/${editingTemplate.id}` : "/api/templates";
      const method = editingTemplate ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        fetchTemplates();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    setDeleteConfirmId(null);
    fetchTemplates();
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const insertVar = (v: string) => {
    setForm((f) => ({ ...f, content: f.content + `{{${v}}}` }));
  };

  const filtered = templates.filter((t) => {
    const matchCat = filterCategory === "ALL" || t.category === filterCategory;
    const matchSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.shortcode.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-600" />
            Templates & Spintax
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pustaka template pesan terpusat dengan variasi Spintax dinamis untuk Broadcast dan Auto-Reply.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-semibold px-4 h-10 text-xs sm:text-sm shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Buat Template Baru
        </button>
      </div>

      {/* Search and Category Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama / shortcode..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-emerald-500 transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(["ALL", ...Object.keys(CATEGORY_LABELS)] as const).map((cat) => {
              const isActive = filterCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat as TemplateCategory | "ALL")}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    isActive
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {cat === "ALL" ? "Semua" : CATEGORY_LABELS[cat as TemplateCategory]}
                </button>
              );
            })}
          </div>
        </div>

        <span className="text-xs font-medium text-slate-400 shrink-0 self-end md:self-center">
          {filtered.length} template
        </span>
      </div>

      {/* Template Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">
          <span className="loading loading-spinner loading-md text-emerald-600" />
          <p className="mt-3 text-xs sm:text-sm font-medium">Memuat pustaka template...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 p-6">
          <FileText className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-800">Belum ada template</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Gunakan tombol "Buat Template Baru" untuk menambahkan template broadcast atau balasan pesan Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tpl) => (
            <TemplateCard
              key={tpl.id}
              tpl={tpl}
              onEdit={() => openEdit(tpl)}
              onDelete={() => setDeleteConfirmId(tpl.id)}
              onCopy={() => handleCopy(tpl.content, tpl.id)}
              copied={copiedId === tpl.id}
              deleteConfirm={deleteConfirmId === tpl.id}
              onDeleteCancel={() => setDeleteConfirmId(null)}
              onDeleteConfirm={() => handleDelete(tpl.id)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-7 space-y-5 shadow-xl border border-slate-200 my-auto max-h-[92vh] overflow-y-auto relative animate-in zoom-in-95 duration-150">
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center absolute right-4 top-4 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  {editingTemplate ? "Edit Template Pesan" : "Buat Template Baru"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Konfigurasikan template teks, variasi acak spintax, dan variabel pelanggan.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                {/* Left: Form */}
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Template
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-emerald-500"
                      placeholder="Contoh: Notifikasi Pesanan Dikirim"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Shortcode
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-emerald-500"
                        placeholder="tpl_order_notif"
                        value={form.shortcode}
                        onChange={(e) => setForm((f) => ({ ...f, shortcode: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Kategori
                      </label>
                      <select
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:bg-white focus:border-emerald-500"
                        value={form.category}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, category: e.target.value as TemplateCategory }))
                        }
                      >
                        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Quick Variable Insert */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-slate-700">
                        Sisipkan Variabel:
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {QUICK_VARS.map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => insertVar(v)}
                          className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-mono font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                        >
                          {`{{${v}}}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Konten Pesan
                      </label>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Spintax: {"{A|B|C}"}
                      </span>
                    </div>
                    <textarea
                      rows={5}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm leading-relaxed text-slate-900 font-mono placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-emerald-500"
                      placeholder="{Halo|Hai} {{name}}, pesanan Anda #{order_id} {sedang diproses|sudah dikirim}!"
                      value={form.content}
                      onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Right: Live Preview */}
                <div className="flex flex-col space-y-3 bg-slate-50/70 border border-slate-200/80 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-emerald-600" />
                      Pratinjau Spintax Live
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (!form.content) return;
                        setPreviews(
                          Array.from({ length: 3 }, () => renderSpintaxPreview(form.content))
                        );
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" /> Acak Variasi
                    </button>
                  </div>

                  {previews.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400">
                      <Info className="w-5 h-5 text-slate-300 mb-1" />
                      Ketik konten pesan dengan format {"{A|B|C}"} untuk melihat hasil variasi Spintax.
                    </div>
                  ) : (
                    <div className="space-y-2.5 flex-1">
                      {previews.map((preview, i) => (
                        <div
                          key={i}
                          className="bg-white border border-slate-200/80 rounded-xl p-3 text-xs leading-relaxed text-slate-800 whitespace-pre-wrap shadow-2xs"
                        >
                          <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md mb-1.5">
                            Variasi #{i + 1}
                          </span>
                          <p>{preview}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-[11px] text-slate-400 text-center">
                    Setiap nomor penerima akan dikirimkan variasi kalimat unik secara otomatis.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="inline-flex items-center justify-center border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-semibold px-4 h-9 text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!form.name.trim() || !form.content.trim() || saving}
                  className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-semibold px-5 h-9 text-xs gap-2 transition-colors disabled:opacity-50"
                >
                  {saving ? <span className="loading loading-spinner loading-xs" /> : null}
                  {editingTemplate ? "Simpan Perubahan" : "Buat Template"}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}

function TemplateCard({
  tpl,
  onEdit,
  onDelete,
  onCopy,
  copied,
  deleteConfirm,
  onDeleteCancel,
  onDeleteConfirm,
}: {
  tpl: MessageTemplate;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
  copied: boolean;
  deleteConfirm: boolean;
  onDeleteCancel: () => void;
  onDeleteConfirm: () => void;
}) {
  const [preview, setPreview] = useState(() => renderSpintaxPreview(tpl.content));

  return (
    <div className="bg-white border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-sm rounded-2xl p-5 flex flex-col justify-between gap-3.5 transition-all">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-sm sm:text-base text-slate-900 truncate">
            {tpl.name}
          </h3>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 border ${
              CATEGORY_BADGES[tpl.category] || CATEGORY_BADGES.LAINNYA
            }`}
          >
            {CATEGORY_LABELS[tpl.category]}
          </span>
        </div>
        <p className="text-xs font-mono text-slate-400 truncate">{tpl.shortcode}</p>
      </div>

      {/* Message Bubble Preview */}
      <div
        className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 text-xs leading-relaxed text-slate-700 min-h-[64px] whitespace-pre-wrap cursor-pointer group hover:bg-slate-100/70 transition-colors"
        onClick={() => setPreview(renderSpintaxPreview(tpl.content))}
        title="Klik untuk melihat variasi Spintax acak lainnya"
      >
        <p>{preview}</p>
        <div className="mt-1 flex items-center justify-end text-[10px] text-slate-400 group-hover:text-emerald-700 font-medium gap-1">
          <RefreshCw className="w-2.5 h-2.5 group-hover:rotate-180 transition-transform" />
          Acak preview
        </div>
      </div>

      {/* Dynamic Variables Chips */}
      {tpl.variables.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tpl.variables.map((v) => (
            <span
              key={v}
              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200/70"
            >
              {`{{${v}}}`}
            </span>
          ))}
        </div>
      )}

      {/* Stats & Actions Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
          <Tag className="w-3 h-3 text-slate-400" />
          {tpl.usageCount} dipakai
        </span>

        {deleteConfirm ? (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-rose-600 font-semibold">Hapus?</span>
            <button
              onClick={onDeleteCancel}
              className="px-2 py-1 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              onClick={onDeleteConfirm}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs"
            >
              Ya, Hapus
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={onCopy}
              className="w-7 h-7 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors"
              title="Salin konten template"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={onEdit}
              className="w-7 h-7 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors"
              title="Edit template"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="w-7 h-7 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 flex items-center justify-center transition-colors"
              title="Hapus template"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

