"use client";

import { useState, useEffect } from "react";
import { useConfirm } from "@/components/confirm-dialog";
import { ModalPortal } from "@/components/ui/ModalPortal";
import {
  Webhook,
  Plus,
  Trash2,
  Edit2,
  Activity,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ShieldCheck,
  Loader2,
  RefreshCw,
  KeyRound,
  ExternalLink,
} from "lucide-react";
import { WebhookConfig, WebhookEvent, WebhookLog } from "@/lib/webhooks";
import { PlanFeatureGuard } from "@/components/dashboard/PlanFeatureGuard";
import { CardGridSkeleton, TableSkeleton } from "@/components/ui/SkeletonLoaders";

const ALL_EVENTS: { id: WebhookEvent; label: string; desc: string }[] = [
  {
    id: "message.received",
    label: "message.received",
    desc: "Dipicu saat ada pesan WhatsApp baru masuk dari customer.",
  },
  {
    id: "message.sent",
    label: "message.sent",
    desc: "Dipicu saat pesan WhatsApp berhasil dikirim dari sistem.",
  },
  {
    id: "message.delivered",
    label: "message.delivered",
    desc: "Dipicu saat pesan berhasil tersampaikan ke HP penerima (centang 2).",
  },
  {
    id: "message.read",
    label: "message.read",
    desc: "Dipicu saat pesan dibaca oleh penerima (centang biru).",
  },
  {
    id: "device.connected",
    label: "device.connected",
    desc: "Dipicu saat sesi WhatsApp berhasil terhubung.",
  },
  {
    id: "device.disconnected",
    label: "device.disconnected",
    desc: "Dipicu saat sesi WhatsApp terputus.",
  },
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"ENDPOINTS" | "LOGS">("ENDPOINTS");

  const confirm = useConfirm();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<WebhookEvent[]>([
    "message.received",
    "message.delivered",
  ]);
  const [saving, setSaving] = useState(false);

  // Ping Testing State
  const [pingingId, setPingingId] = useState<string | null>(null);
  const [pingResult, setPingResult] = useState<any>(null);

  const fetchWebhooks = async () => {
    try {
      const res = await fetch("/api/webhooks");
      const json = await res.json();
      if (json.success) setWebhooks(json.data);
    } catch (err) {
      console.error("Failed to fetch webhooks", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await fetch("/api/webhooks/logs");
      const json = await res.json();
      if (json.success) setLogs(json.data);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
    fetchLogs();
  }, []);

  const openCreateModal = () => {
    setEditingWebhook(null);
    setName("");
    setUrl("");
    setSecret("");
    setSelectedEvents(["message.received", "message.delivered"]);
    setIsModalOpen(true);
  };

  const openEditModal = (wh: WebhookConfig) => {
    setEditingWebhook(wh);
    setName(wh.name);
    setUrl(wh.url);
    setSecret(wh.secret);
    setSelectedEvents(wh.events);
    setIsModalOpen(true);
  };

  const handleToggleEvent = (ev: WebhookEvent) => {
    setSelectedEvents((prev) =>
      prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev]
    );
  };

  const handleSaveWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingWebhook) {
        const res = await fetch(`/api/webhooks/${editingWebhook.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            url,
            secret,
            events: selectedEvents,
            isActive: editingWebhook.isActive,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setIsModalOpen(false);
          fetchWebhooks();
        }
      } else {
        const res = await fetch("/api/webhooks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            url,
            secret,
            events: selectedEvents,
            isActive: true,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setIsModalOpen(false);
          fetchWebhooks();
        }
      }
    } catch (err) {
      console.error("Failed to save webhook", err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      setWebhooks((prev) =>
        prev.map((w) => (w.id === id ? { ...w, isActive: !current } : w))
      );
      await fetch(`/api/webhooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      fetchWebhooks();
    } catch (err) {
      console.error("Failed to toggle", err);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Hapus Endpoint Webhook",
      message: "Apakah Anda yakin ingin menghapus endpoint webhook ini?",
      confirmText: "Ya, Hapus",
      variant: "danger",
    });
    if (!isConfirmed) return;
    try {
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
      await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
      fetchWebhooks();
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const handleTestPing = async (id: string) => {
    setPingingId(id);
    setPingResult(null);

    try {
      const res = await fetch(`/api/webhooks/${id}/test`, { method: "POST" });
      const json = await res.json();
      setPingResult({ ...json, webhookId: id });
      fetchWebhooks();
      fetchLogs();
    } catch (err: any) {
      setPingResult({ success: false, error: err.message, webhookId: id });
    } finally {
      setPingingId(null);
    }
  };

  return (
    <PlanFeatureGuard
      feature="webhooks"
      featureName="Inbound Webhooks"
      minPlanName="Starter"
      description="Fitur Inbound Webhooks memungkinkan pengiriman notifikasi event pesan secara real-time ke sistem backend Anda. Upgrade paket untuk mengaktifkan fitur ini."
    >
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <Webhook className="w-7 h-7 text-primary" /> Inbound Webhooks
          </h1>
          <p className="text-sm text-base-content/60 mt-1">
            Kirimkan notifikasi event WhatsApp real-time ke sistem backend CRM, ERP, atau aplikasi Anda.
          </p>
        </div>

        <button onClick={openCreateModal} className="btn btn-primary gap-2 shadow-md shadow-primary/20">
          <Plus className="w-4 h-4" /> Tambah Endpoint Webhook
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-base-200">
        <button
          onClick={() => setActiveTab("ENDPOINTS")}
          className={`px-4 py-2.5 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "ENDPOINTS"
              ? "border-primary text-primary"
              : "border-transparent text-base-content/60 hover:text-base-content"
          }`}
        >
          <Webhook className="w-4 h-4" /> Endpoints ({webhooks.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("LOGS");
            fetchLogs();
          }}
          className={`px-4 py-2.5 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "LOGS"
              ? "border-primary text-primary"
              : "border-transparent text-base-content/60 hover:text-base-content"
          }`}
        >
          <Activity className="w-4 h-4" /> Delivery Logs ({logs.length})
        </button>
      </div>

      {activeTab === "ENDPOINTS" ? (
        <div className="space-y-4">
          {loading ? (
            <CardGridSkeleton count={3} />
          ) : webhooks.length === 0 ? (
            <div className="card bg-base-100 border border-base-200 p-10 text-center space-y-3 rounded-3xl">
              <div className="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center mx-auto text-base-content/50">
                <Webhook className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-sm">Belum Ada Endpoint Webhook</h3>
              <p className="text-xs text-base-content/50">
                Daftarkan URL webhook untuk menerima pesan WhatsApp masuk dan status pengiriman secara otomatis.
              </p>
              <button onClick={openCreateModal} className="btn btn-primary btn-sm gap-1.5 mt-2">
                <Plus className="w-3.5 h-3.5" /> Setup Webhook Pertama
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {webhooks.map((wh) => (
                <div
                  key={wh.id}
                  className={`card bg-base-100 border transition-all rounded-3xl p-5 shadow-sm space-y-4 ${
                    wh.isActive ? "border-base-200 hover:border-primary/40" : "border-base-300 opacity-60 bg-base-200/30"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="font-bold text-sm text-base-content">{wh.name}</h3>
                        <span
                          className={`badge badge-xs py-1 px-2 font-semibold text-[10px] ${
                            wh.isActive ? "badge-success text-white" : "badge-ghost"
                          }`}
                        >
                          {wh.isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                        {wh.lastPingStatus && (
                          <span
                            className={`badge badge-xs text-[10px] gap-1 ${
                              wh.lastPingStatus === "SUCCESS"
                                ? "badge-emerald bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : "badge-error bg-rose-500/10 text-rose-600 border-rose-500/20"
                            }`}
                          >
                            {wh.lastPingStatus === "SUCCESS" ? (
                              <CheckCircle2 className="w-2.5 h-2.5" />
                            ) : (
                              <XCircle className="w-2.5 h-2.5" />
                            )}
                            HTTP {wh.lastPingCode || "Err"}
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-xs text-primary break-all flex items-center gap-1.5">
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        {wh.url}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleTestPing(wh.id)}
                        disabled={pingingId === wh.id}
                        className="btn btn-primary btn-xs gap-1.5 shadow-sm"
                      >
                        {pingingId === wh.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menguji...
                          </>
                        ) : (
                          <>
                            <Send className="w-3 h-3" /> Test Ping
                          </>
                        )}
                      </button>

                      <input
                        type="checkbox"
                        className="toggle toggle-primary toggle-sm"
                        checked={wh.isActive}
                        onChange={() => handleToggleActive(wh.id, wh.isActive)}
                        title={wh.isActive ? "Nonaktifkan" : "Aktifkan"}
                      />
                      <button
                        onClick={() => openEditModal(wh)}
                        className="btn btn-ghost btn-xs text-base-content/70 hover:text-primary"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteWebhook(wh.id)}
                        className="btn btn-ghost btn-xs text-error"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Subscribed Events Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-base-200/50">
                    <span className="text-[11px] text-base-content/50 font-medium">Subscribed Events:</span>
                    {wh.events.map((ev) => (
                      <span key={ev} className="badge badge-sm badge-ghost text-[10px] font-mono">
                        {ev}
                      </span>
                    ))}
                  </div>

                  {/* Test Ping Result Banner */}
                  {pingResult && pingResult.webhookId === wh.id && (
                    <div
                      className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-2 ${
                        pingResult.success
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-200"
                          : "bg-rose-500/10 border-rose-500/20 text-rose-900 dark:text-rose-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {pingResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        )}
                        <span>{pingResult.message || pingResult.error}</span>
                      </div>
                      <span className="font-mono text-[11px] shrink-0 font-bold">
                        {pingResult.durationMs}ms
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Logs Tab */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-base-content/80">Riwayat Pengiriman Webhook Terakhir</h2>
            <button onClick={fetchLogs} className="btn btn-ghost btn-xs gap-1">
              <RefreshCw className={`w-3 h-3 ${logsLoading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>

          {logs.length === 0 ? (
            <div className="p-8 text-center text-xs text-base-content/50 bg-base-100 rounded-3xl border border-base-200">
              Belum ada riwayat log pengiriman webhook.
            </div>
          ) : (
            <div className="card bg-base-100 border border-base-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="table table-xs">
                  <thead>
                    <tr className="bg-base-200/50">
                      <th>Waktu</th>
                      <th>Event</th>
                      <th>Status HTTP</th>
                      <th>Latensi</th>
                      <th>URL Endpoint</th>
                      <th>Response Snippet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-base-200/30">
                        <td className="text-[11px] text-base-content/60 font-mono">
                          {new Date(log.createdAt).toLocaleTimeString("id-ID")}
                        </td>
                        <td>
                          <span className="badge badge-ghost badge-xs font-mono text-[10px]">
                            {log.event}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge badge-xs font-bold text-[10px] ${
                              log.success ? "badge-success text-white" : "badge-error text-white"
                            }`}
                          >
                            {log.responseStatus || "ERR"}
                          </span>
                        </td>
                        <td className="font-mono text-[11px]">{log.durationMs}ms</td>
                        <td className="max-w-xs truncate font-mono text-[11px] text-base-content/70">
                          {log.url}
                        </td>
                        <td className="max-w-xs truncate font-mono text-[11px] text-base-content/50">
                          {log.responseBody || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Setup / Edit Webhook */}
      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] bg-black/60 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
            <div className="bg-base-100 rounded-3xl max-w-xl w-full p-6 md:p-8 space-y-5 shadow-2xl border border-base-200 my-auto animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Webhook className="w-5 h-5 text-primary" />
                  {editingWebhook ? "Edit Webhook Endpoint" : "Tambah Webhook Endpoint"}
                </h3>
                <button
                  type="button"
                  onClick={() => !saving && setIsModalOpen(false)}
                  className="btn btn-ghost btn-circle btn-xs text-base-content/50"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveWebhook} className="space-y-4">
                <div className="form-control">
                  <label className="label text-xs font-semibold">Nama Identitas Webhook</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Production CRM Zapier"
                    className="input input-bordered input-sm w-full"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="form-control">
                  <label className="label text-xs font-semibold">Endpoint URL (HTTPS Disarankan)</label>
                  <input
                    type="url"
                    required
                    placeholder="https://my-domain.com/api/waply-webhook"
                    className="input input-bordered input-sm w-full font-mono text-xs"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>

                <div className="form-control">
                  <label className="label text-xs font-semibold justify-between">
                    <span>Secret Token (HMAC SHA-256 Signature)</span>
                    <span className="text-[10px] text-base-content/50">Opsional (auto-generate jika kosong)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="whsec_xxxxxxxx"
                    className="input input-bordered input-sm w-full font-mono text-xs"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                  />
                </div>

                {/* Subscribed Events */}
                <div className="form-control space-y-2">
                  <label className="label p-0 text-xs font-semibold">Pilih Events yang Diberlangganankan:</label>
                  <div className="space-y-2 p-3.5 rounded-2xl bg-base-200/40 border border-base-300">
                    {ALL_EVENTS.map((ev) => (
                      <label key={ev.id} className="flex items-start gap-3 cursor-pointer py-1">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary checkbox-xs mt-0.5"
                          checked={selectedEvents.includes(ev.id)}
                          onChange={() => handleToggleEvent(ev.id)}
                        />
                        <div>
                          <div className="font-mono text-xs font-bold text-base-content">{ev.label}</div>
                          <div className="text-[11px] text-base-content/60">{ev.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setIsModalOpen(false)}
                    disabled={saving}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm gap-2"
                    disabled={saving || !name.trim() || !url.trim() || selectedEvents.length === 0}
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingWebhook ? "Simpan Perubahan" : "Simpan Webhook"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
    </PlanFeatureGuard>
  );
}
