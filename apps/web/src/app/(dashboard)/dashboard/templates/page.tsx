"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Plus,
  Sparkles,
  Copy,
  Edit2,
  Trash2,
  X,
  Tag,
  RefreshCw,
  ChevronDown,
  ExternalLink,
  Check,
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

const CATEGORY_COLORS: Record<TemplateCategory, string> = {
  BROADCAST: "bg-primary text-primary-content",
  PROMO: "bg-amber-500 text-white",
  NOTIFIKASI: "bg-sky-500 text-white",
  OTP: "bg-rose-500 text-white",
  SUPPORT: "bg-emerald-500 text-white",
  LAINNYA: "bg-base-300 text-base-content",
};

const QUICK_VARS = ["name", "phone", "order_id", "promo_code", "deadline", "otp_code", "kota", "produk", "harga"];

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
    if (!form.content) { setPreviews([]); return; }
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Templates & Spintax
          </h1>
          <p className="text-sm text-base-content/60 mt-1">
            Pustaka template pesan terpusat dengan variasi Spintax otomatis. Gunakan kembali di Broadcast dan Auto-Reply.
          </p>
        </div>
        <button onClick={openCreate} className="btn btn-primary gap-2 shadow-md shadow-primary/25">
          <Plus className="w-4 h-4" /> Buat Template Baru
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Cari nama atau shortcode..."
          className="input input-bordered input-sm h-9 w-60"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-2">
          {(["ALL", ...Object.keys(CATEGORY_LABELS)] as const).map((cat) => {
            const isActive = filterCategory === cat;
            const color =
              cat === "ALL"
                ? isActive
                  ? "bg-primary text-primary-content border-primary"
                  : "bg-base-100 text-base-content border-base-300 hover:bg-base-200"
                : CATEGORY_COLORS[cat as TemplateCategory];
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat as TemplateCategory | "ALL")}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                  cat !== "ALL" && isActive
                    ? `${CATEGORY_COLORS[cat as TemplateCategory]} border-transparent shadow-sm`
                    : cat !== "ALL"
                    ? "bg-base-100 text-base-content border-base-300 hover:bg-base-200"
                    : color
                }`}
              >
                {cat === "ALL" ? "Semua" : CATEGORY_LABELS[cat as TemplateCategory]}
              </button>
            );
          })}
        </div>
        <span className="ml-auto text-xs text-base-content/50">{filtered.length} template</span>
      </div>

      {/* Template Grid */}
      {loading ? (
        <div className="text-center py-20 text-base-content/40">
          <span className="loading loading-spinner loading-md" />
          <p className="mt-3 text-sm">Memuat template...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-base-300 rounded-2xl">
          <FileText className="w-10 h-10 mx-auto text-base-content/20 mb-3" />
          <p className="text-sm font-medium text-base-content/40">Belum ada template</p>
          <p className="text-xs text-base-content/30 mt-1">Klik "Buat Template Baru" untuk mulai</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
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
          <div className="fixed inset-0 z-[99999] bg-black/60 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
            <div className="bg-base-100 rounded-3xl max-w-3xl w-full p-6 md:p-8 space-y-4 shadow-2xl border border-base-200 my-auto animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto relative">
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 text-base-content/50"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="font-bold text-lg mb-2">
                {editingTemplate ? "Edit Template" : "Buat Template Baru"}
              </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left: Form */}
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-medium text-sm">Nama Template</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered input-sm"
                    placeholder="Notifikasi Pesanan"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-medium text-sm">Shortcode</span>
                    <span className="label-text-alt text-base-content/40">Auto-generate jika kosong</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered input-sm font-mono"
                    placeholder="tpl_order_notif"
                    value={form.shortcode}
                    onChange={(e) => setForm((f) => ({ ...f, shortcode: e.target.value }))}
                  />
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-medium text-sm">Kategori</span>
                  </label>
                  <select
                    className="select select-bordered select-sm"
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, category: e.target.value as TemplateCategory }))
                    }
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Quick Variable Insert */}
                <div>
                  <p className="text-xs font-medium text-base-content/60 mb-2">
                    Insert Variabel Dinamis:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_VARS.map((v) => (
                      <button
                        key={v}
                        onClick={() => insertVar(v)}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-base-200 text-base-content/60 border border-base-300 hover:bg-primary hover:text-primary-content hover:border-primary transition-all cursor-pointer"
                      >
                        {`{{${v}}}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-medium text-sm">Konten Pesan</span>
                    <span className="label-text-alt text-base-content/40">Spintax: {"{A|B|C}"}</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered text-sm leading-relaxed font-mono min-h-[130px]"
                    placeholder="{Halo|Hai} {{name}}, pesanan Anda {sudah|telah} {dikirim|diproses}!"
                    value={form.content}
                    onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  />
                </div>
              </div>

              {/* Right: Live Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" /> Spintax Live Preview
                  </p>
                  <button
                    onClick={() => {
                      if (!form.content) return;
                      setPreviews(Array.from({ length: 3 }, () => renderSpintaxPreview(form.content)));
                    }}
                    className="btn btn-ghost btn-xs gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Acak
                  </button>
                </div>
                {previews.length === 0 ? (
                  <div className="border-2 border-dashed border-base-300 rounded-xl p-6 text-center text-xs text-base-content/40">
                    Ketik konten pesan untuk melihat pratinjau variasi Spintax
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {previews.map((preview, i) => (
                      <div
                        key={i}
                        className="bg-base-200/60 border border-base-300 rounded-xl p-3 text-xs leading-relaxed whitespace-pre-wrap"
                      >
                        <span className="badge badge-xs badge-ghost mb-1.5">Variasi {i + 1}</span>
                        <p>{preview}</p>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-base-content/40 text-center mt-1">
                  Setiap penerima mendapat variasi yang berbeda-beda secara acak.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-base-200">
              <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm">
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name.trim() || !form.content.trim() || saving}
                className="btn btn-primary btn-sm gap-2 min-w-[100px]"
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
    <div className="card bg-base-100 border border-base-200 shadow-sm rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      {/* Top */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-base truncate">{tpl.name}</h3>
          <span className="text-xs text-base-content/50 font-mono">{tpl.shortcode}</span>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex-shrink-0 ${CATEGORY_COLORS[tpl.category]}`}
        >
          {CATEGORY_LABELS[tpl.category]}
        </span>
      </div>

      {/* Content Preview */}
      <div
        className="bg-base-200/50 border border-base-300/60 rounded-xl p-3 text-xs leading-relaxed text-base-content/80 min-h-[60px] whitespace-pre-wrap cursor-pointer group"
        onClick={() => setPreview(renderSpintaxPreview(tpl.content))}
        title="Klik untuk variasi acak baru"
      >
        {preview}
        <span className="hidden group-hover:inline ml-1 text-primary/60">↻</span>
      </div>

      {/* Variables */}
      {tpl.variables.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tpl.variables.map((v) => (
            <span
              key={v}
              className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-base-200 text-base-content/60 border border-base-300"
            >
              {`{{${v}}}`}
            </span>
          ))}
        </div>
      )}

      {/* Stats & Actions */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-base-200">
        <span className="text-xs text-base-content/40 flex items-center gap-1">
          <Tag className="w-3 h-3" />
          {tpl.usageCount} dipakai
        </span>

        {deleteConfirm ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-error font-medium">Yakin hapus?</span>
            <button onClick={onDeleteCancel} className="btn btn-ghost btn-xs">Batal</button>
            <button onClick={onDeleteConfirm} className="btn btn-error btn-xs">Hapus</button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={onCopy}
              className="btn btn-ghost btn-xs gap-1 tooltip tooltip-left"
              data-tip="Salin konten"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onEdit}
              className="btn btn-ghost btn-xs gap-1 tooltip tooltip-left"
              data-tip="Edit"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="btn btn-ghost btn-xs text-error hover:bg-error/10 tooltip tooltip-left"
              data-tip="Hapus"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
