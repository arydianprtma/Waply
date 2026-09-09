"use client";

import { useState, useEffect } from "react";
import { useConfirm } from "@/components/confirm-dialog";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { PlanFeatureGuard } from "@/components/dashboard/PlanFeatureGuard";
import { TableSkeleton } from "@/components/ui/SkeletonLoaders";
import {
  KeyRound,
  Plus,
  Copy,
  Check,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Code2,
  Loader2,
  Lock,
} from "lucide-react";

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const confirm = useConfirm();

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/api-keys");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setKeys(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch API keys", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: keyName }),
      });
      const json = await res.json();
      if (json.success && json.data?.rawKey) {
        setNewlyCreatedKey(json.data.rawKey);
        setKeyName("");
        fetchKeys();
      }
    } catch (err) {
      console.error("Failed to create key", err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Cabut API Key",
      message: "Apakah Anda yakin ingin menghapus / mencabut API Key ini? Akses integrasi yang menggunakan kunci ini akan langsung terputus.",
      confirmText: "Ya, Cabut Key",
      variant: "danger",
    });
    if (!isConfirmed) return;

    // Optimistic UI update: instantly remove from screen
    setKeys((prev) => prev.filter((k) => k.id !== id));

    try {
      await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
      fetchKeys();
    } catch (err) {
      console.error("Failed to delete key", err);
      fetchKeys();
    }
  };

  const copyToClipboard = (text: string, type: "key" | "code") => {
    navigator.clipboard.writeText(text);
    if (type === "key") {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const [originUrl, setOriginUrl] = useState<string>("http://localhost:3001");

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.origin) {
      setOriginUrl(window.location.origin);
    }
  }, []);

  const sampleCurl = `curl -X POST ${originUrl}/api/v1/messages/send \\
  -H "Authorization: Bearer ${newlyCreatedKey || "snd_live_your_api_key_here"}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "6281234567890",
    "message": "{Halo|Hai|Selamat Siang} {{name}}, pesanan Anda #1024 sedang diproses!",
    "variables": { "name": "Budi" }
  }'`;

  return (
    <PlanFeatureGuard
      feature="apiKeys"
      featureName="API Keys Developer"
      minPlanName="Starter"
      description="API Keys memungkinkan integrasi langsung dari backend aplikasi atau bot Anda. Upgrade paket untuk mengaktifkan akses API Developer."
    >
      <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API Keys & REST API</h1>
          <p className="text-sm text-base-content/60 mt-1">
            Gunakan API Key berstandar SHA-256 untuk mengautentikasi pengiriman pesan WhatsApp dari backend atau bot Anda.
          </p>
        </div>

        <button
          onClick={() => {
            setNewlyCreatedKey(null);
            setIsModalOpen(true);
          }}
          className="btn btn-primary gap-2 shadow-md shadow-primary/25"
        >
          <Plus className="w-4 h-4" /> Buat API Key Baru
        </button>
      </div>

      {/* Secret Key Modal */}
      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] bg-black/60 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
            <div className="bg-base-100 rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-4 shadow-2xl border border-base-200 my-auto animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-primary" />
                  {newlyCreatedKey ? "Simpan API Key Anda" : "Buat API Key Baru"}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    if (!creating) {
                      setNewlyCreatedKey(null);
                      setIsModalOpen(false);
                    }
                  }}
                  className="btn btn-ghost btn-circle btn-xs text-base-content/50"
                >
                  ✕
                </button>
              </div>

              {!newlyCreatedKey ? (
                <form onSubmit={handleCreateKey} className="space-y-4 mt-2">
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-semibold text-xs">Nama API Key</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Production Web Store, Zapier Hook, Notifikasi CRM"
                      className="input input-bordered w-full text-sm"
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      required
                      autoFocus
                    />
                    <label className="label py-0.5">
                      <span className="label-text-alt text-base-content/50 text-[11px]">
                        Gunakan nama deskriptif untuk membedakan asal aplikasi atau server.
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setIsModalOpen(false)}
                      disabled={creating}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm gap-2"
                      disabled={creating || !keyName.trim()}
                    >
                      {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                      Generate Key
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 mt-2">
                  <div className="alert alert-warning text-xs space-y-1">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <div className="font-bold">PENTING: Simpan API Key Sekarang!</div>
                      <div>Demi alasan keamanan, kunci rahasia ini hanya ditampilkan satu kali dan tidak dapat dilihat kembali.</div>
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-semibold text-xs">Secret API Key:</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={newlyCreatedKey}
                        className="input input-bordered w-full font-mono text-xs bg-base-200"
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(newlyCreatedKey, "key")}
                        className="btn btn-primary btn-sm gap-1"
                      >
                        {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copiedKey ? "Tersalin!" : "Salin"}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm btn-block"
                      onClick={() => {
                        setNewlyCreatedKey(null);
                        setIsModalOpen(false);
                      }}
                    >
                      Selesai & Tutup
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Keys Table */}
      <div className="card bg-base-100 border border-base-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-base-200 flex items-center justify-between">
          <div className="font-semibold text-sm flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" /> Daftar Kunci API Aktif
          </div>
          <span className="badge badge-sm badge-ghost">{keys.length} Kunci</span>
        </div>

        {loading ? (
          <TableSkeleton rows={4} cols={5} />
        ) : keys.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center mx-auto text-base-content/50">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <div className="font-semibold text-sm">Belum Ada API Key</div>
              <p className="text-xs text-base-content/50 mt-0.5">
                Buat API Key pertama Anda untuk mulai mengirim pesan via REST API.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary btn-sm gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Buat API Key
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr className="bg-base-200/50 text-xs">
                  <th>Nama Kunci</th>
                  <th>Prefix Token</th>
                  <th>Terakhir Digunakan</th>
                  <th>Dibuat Pada</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id} className="text-xs hover:bg-base-200/30">
                    <td className="font-semibold text-base-content">{k.name}</td>
                    <td>
                      <code className="bg-base-200 px-2 py-1 rounded font-mono text-[11px]">
                        {k.keyPrefix}••••••••
                      </code>
                    </td>
                    <td className="text-base-content/60">
                      {k.lastUsedAt
                        ? new Date(k.lastUsedAt).toLocaleString("id-ID")
                        : "Belum pernah"}
                    </td>
                    <td className="text-base-content/60">
                      {new Date(k.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleDeleteKey(k.id)}
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

      {/* Code Integration Example */}
      <div className="card bg-base-100 border border-base-200 shadow-sm rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Code2 className="w-4 h-4 text-primary" />
            Contoh REST API Integration (cURL)
          </div>
          <button
            onClick={() => copyToClipboard(sampleCurl, "code")}
            className="btn btn-ghost btn-xs gap-1 text-primary"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedCode ? "Tersalin!" : "Salin cURL"}
          </button>
        </div>

        <div className="mockup-code text-xs bg-neutral text-neutral-content rounded-xl p-4 overflow-x-auto">
          <pre><code>{sampleCurl}</code></pre>
        </div>
      </div>
    </div>
    </PlanFeatureGuard>
  );
}
