"use client";

import { useState, useEffect } from "react";
import { useConfirm } from "@/components/confirm-dialog";
import { ModalPortal } from "@/components/ui/ModalPortal";
import {
  ShieldBan,
  Plus,
  Trash2,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { PlanFeatureGuard } from "@/components/dashboard/PlanFeatureGuard";

interface BlacklistItem {
  id: string;
  phoneNumber: string;
  reason: string;
  notes: string | null;
  createdAt: string;
}

export default function BlacklistPage() {
  const [blacklist, setBlacklist] = useState<BlacklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const confirm = useConfirm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [reason, setReason] = useState("MANUAL_BLOCK");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchBlacklist = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/blacklist");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setBlacklist(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch blacklist", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlacklist();
  }, []);

  const handleAddBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          reason,
          notes: notes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        setPhoneNumber("");
        setNotes("");
        fetchBlacklist();
      } else {
        setErrorMsg(json.error || "Gagal menambahkan nomor");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Hapus dari Blacklist",
      message: "Apakah Anda yakin ingin menghapus nomor ini dari daftar Blacklist? Nomor ini nantinya dapat menerima pesan kembali.",
      confirmText: "Ya, Hapus",
      variant: "danger",
    });
    if (!isConfirmed) return;

    // Optimistic UI
    setBlacklist((prev) => prev.filter((item) => item.id !== id));

    try {
      await fetch(`/api/blacklist/${id}`, { method: "DELETE" });
      fetchBlacklist();
    } catch (err) {
      console.error("Failed to delete from blacklist", err);
      fetchBlacklist();
    }
  };

  const filtered = blacklist.filter((item) =>
    item.phoneNumber.includes(search) || (item.notes && item.notes.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <PlanFeatureGuard
      feature="blacklistDnd"
      featureName="Blacklist & DND Protection"
      minPlanName="Starter"
      description="Fitur Blacklist & Do Not Disturb (DND) mencegah pengiriman ke nomor yang telah opt-out atau komplain spam agar nomor WhatsApp bisnis Anda selalu aman dan terhindar dari pemblokiran."
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Blacklist / DND (Do Not Disturb)</h1>
            <p className="text-sm text-base-content/60 mt-1">
              Daftar nomor yang meminta opt-out atau diblokir untuk mencegah nomor WhatsApp Anda dilaporkan (Report Spam) ke Meta.
            </p>
          </div>

          <button
            onClick={() => {
              setErrorMsg(null);
              setIsModalOpen(true);
            }}
            className="btn btn-primary gap-2 shadow-md shadow-primary/25"
          >
            <Plus className="w-4 h-4" /> Tambah Nomor Manual
          </button>
        </div>

        {/* Add Modal */}
        {isModalOpen && (
          <ModalPortal>
            <div className="fixed inset-0 z-[99999] bg-black/60 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
              <div className="bg-base-100 rounded-3xl max-w-md w-full p-6 md:p-8 space-y-4 shadow-2xl border border-base-200 my-auto animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-base-200">
                  <div className="flex items-center gap-2">
                    <ShieldBan className="w-5 h-5 text-rose-500" />
                    <h3 className="font-bold text-lg">Tambah ke Blacklist</h3>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="btn btn-ghost btn-circle btn-sm"
                  >
                    ✕
                  </button>
                </div>

                {errorMsg && (
                  <div className="alert alert-error text-xs py-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleAddBlacklist} className="space-y-4">
                  <div>
                    <label className="label">
                      <span className="label-text font-medium text-xs">Nomor WhatsApp Target</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 6281234567890"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="input input-bordered w-full font-mono text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-medium text-xs">Alasan Pemblokiran</span>
                    </label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="select select-bordered w-full text-sm font-medium"
                    >
                      <option value="MANUAL_BLOCK">Blokir Manual Admin</option>
                      <option value="USER_OPT_OUT">Pengguna Minta Berhenti (STOP)</option>
                      <option value="SPAM_COMPLAINT">Pernah Komplain / Marah</option>
                      <option value="INVALID_NUMBER">Nomor Tidak Valid / Rusak</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-medium text-xs">Catatan Internal (Opsional)</span>
                    </label>
                    <textarea
                      placeholder="Contoh: Minta di-unsubs dari promo mingguan"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="textarea textarea-bordered w-full text-sm h-20"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="btn btn-ghost"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn btn-primary gap-2"
                    >
                      {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      Simpan ke Blacklist
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </ModalPortal>
        )}

        {/* Search & Stats Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-base-100 p-4 rounded-2xl border border-base-200">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" />
            <input
              type="text"
              placeholder="Cari nomor telepon atau catatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input input-bordered input-sm w-full pl-9"
            />
          </div>

          <div className="text-xs text-base-content/60 font-medium">
            Total Terblokir: <strong className="text-base-content font-bold">{blacklist.length}</strong> nomor
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="flex items-center justify-center p-12 bg-base-100 rounded-3xl border border-base-200">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : blacklist.length === 0 ? (
          <div className="p-12 text-center bg-base-100 rounded-3xl border border-base-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg">Belum Ada Nomor di Blacklist</h3>
            <p className="text-xs text-base-content/60 max-w-sm mx-auto">
              Semua nomor kontak saat ini diizinkan menerima pesan broadcast maupun pesan API otomatis.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-base-100 rounded-3xl border border-base-200 shadow-2xs">
            <table className="table table-zebra w-full">
              <thead>
                <tr className="text-xs uppercase bg-base-200/50">
                  <th>Nomor WhatsApp</th>
                  <th>Kategori Alasan</th>
                  <th>Catatan</th>
                  <th>Tanggal Ditambahkan</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="text-xs hover:bg-base-200/30">
                    <td className="font-semibold text-base-content font-mono">
                      +{item.phoneNumber}
                    </td>
                    <td>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/25">
                        {item.reason}
                      </span>
                    </td>
                    <td className="text-base-content/60">{item.notes || "-"}</td>
                    <td className="text-base-content/60">
                      {new Date(item.createdAt).toLocaleString("id-ID")}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="btn btn-ghost btn-xs text-error gap-1 hover:bg-error/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PlanFeatureGuard>
  );
}
