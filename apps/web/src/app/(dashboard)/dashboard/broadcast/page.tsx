"use client";

import { useState, useEffect } from "react";
import { useConfirm, useAlert } from "@/components/confirm-dialog";
import { ModalPortal } from "@/components/ui/ModalPortal";
import {
  Radio,
  Plus,
  Play,
  Pause,
  XCircle,
  Trash2,
  Users,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Clock,
  RefreshCw,
  Eye,
  Smartphone,
} from "lucide-react";
import { parseSpintax, generateSpintaxSamples } from "@/lib/spintax";
import { PlanFeatureGuard } from "@/components/dashboard/PlanFeatureGuard";

interface BroadcastRecipient {
  id: string;
  phoneNumber: string;
  name: string;
  renderedMessage?: string;
  status: "PENDING" | "SENT" | "FAILED" | "SKIPPED_BLACKLIST";
  sentAt?: string;
  error?: string;
}

interface BroadcastCampaign {
  id: string;
  name: string;
  deviceId?: string;
  messageTemplate: string;
  status: "DRAFT" | "RUNNING" | "PAUSED" | "COMPLETED" | "CANCELLED";
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  batchSize: number;
  batchDelaySec: number;
  minDelaySec: number;
  maxDelaySec: number;
  recipients: BroadcastRecipient[];
  createdAt: string;
  completedAt?: string;
}

interface ContactGroup {
  id: string;
  name: string;
}

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  groupId: string | null;
  customVariables?: Record<string, any>;
}

export default function BroadcastPage() {
  const [campaigns, setCampaigns] = useState<BroadcastCampaign[]>([]);
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const confirm = useConfirm();
  const showAlert = useAlert();

  // New Campaign Modal Wizard
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [targetType, setTargetType] = useState<"GROUP" | "ALL_CONTACTS" | "MANUAL">("GROUP");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [manualNumbersText, setManualNumbersText] = useState("");
  const [messageTemplate, setMessageTemplate] = useState(
    "{Halo|Hai|Selamat siang} {{name}}, kami memiliki penawaran spesial untuk Anda hari ini!"
  );
  const [batchSize, setBatchSize] = useState(10);
  const [batchDelaySec, setBatchDelaySec] = useState(30);
  const [previewSamples, setPreviewSamples] = useState<string[]>([]);
  const [creatingCampaign, setCreatingCampaign] = useState(false);

  // Detail Modal
  const [viewingCampaign, setViewingCampaign] = useState<BroadcastCampaign | null>(null);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch("/api/broadcast");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCampaigns(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch campaigns", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchContactsAndGroups = async () => {
    try {
      const [grpRes, cntRes, devRes] = await Promise.all([
        fetch("/api/contacts/groups"),
        fetch("/api/contacts"),
        fetch("/api/gateway/sessions"),
      ]);
      const [grpJson, cntJson, devJson] = await Promise.all([
        grpRes.json(),
        cntRes.json(),
        devRes.json(),
      ]);

      if (grpJson.success && Array.isArray(grpJson.data)) {
        setGroups(grpJson.data);
        if (grpJson.data.length > 0) setSelectedGroupId(grpJson.data[0].id);
      }
      if (cntJson.success && Array.isArray(cntJson.data)) {
        setAllContacts(cntJson.data);
      }
      if (devJson.success && Array.isArray(devJson.data)) {
        setDevices(devJson.data);
        const connected = devJson.data.find((d: any) => d.status === "CONNECTED");
        if (connected) setSelectedDeviceId(connected.id);
        else if (devJson.data.length > 0) setSelectedDeviceId(devJson.data[0].id);
      }
    } catch (err) {
      console.error("Failed to load metadata", err);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchContactsAndGroups();

    // Polling interval for running broadcast campaigns
    const interval = setInterval(() => {
      fetchCampaigns();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Update spintax samples
  useEffect(() => {
    if (messageTemplate.includes("{") && messageTemplate.includes("}")) {
      const samples = generateSpintaxSamples(messageTemplate, { name: "Budi Santoso", kota: "Jakarta" }, 3);
      setPreviewSamples(samples);
    } else {
      setPreviewSamples([]);
    }
  }, [messageTemplate]);

  // Compute recipient count based on selection
  const getComputedRecipients = () => {
    if (targetType === "GROUP") {
      return allContacts.filter((c) => c.groupId === selectedGroupId);
    } else if (targetType === "ALL_CONTACTS") {
      return allContacts;
    } else {
      // Manual numbers
      const lines = manualNumbersText.trim().split("\n");
      const list: any[] = [];
      lines.forEach((l) => {
        const clean = l.trim();
        if (!clean) return;
        const parts = clean.split(",");
        if (parts.length >= 2) {
          list.push({ name: parts[0].trim(), phoneNumber: parts[1].trim() });
        } else {
          list.push({ name: `Pelanggan`, phoneNumber: parts[0].trim() });
        }
      });
      return list;
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    const recipients = getComputedRecipients();
    if (recipients.length === 0) {
      await showAlert({
        title: "Penerima Kosong",
        message: "Tidak ada penerima untuk kampanye ini",
        variant: "warning",
      });
      return;
    }

    setCreatingCampaign(true);
    try {
      const res = await fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignName,
          deviceId: selectedDeviceId || undefined,
          messageTemplate,
          recipients: recipients.map((r) => ({
            phoneNumber: r.phoneNumber,
            name: r.name,
            variables: r.customVariables || {},
          })),
          batchSize,
          batchDelaySec,
          minDelaySec: 4,
          maxDelaySec: 8,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsWizardOpen(false);
        setCampaignName("");
        setManualNumbersText("");
        fetchCampaigns();
      }
    } catch (err) {
      console.error("Failed to create campaign", err);
    } finally {
      setCreatingCampaign(false);
    }
  };

  const handleStartCampaign = async (id: string) => {
    setActionLoadingId(id);
    // Optimistic UI update
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "RUNNING" } : c))
    );

    try {
      const res = await fetch(`/api/broadcast/${id}/start`, { method: "POST" });
      const json = await res.json();
      if (!json.success) {
        await showAlert({
          title: "Gagal Memulai",
          message: json.error || "Gagal memulai broadcast",
          variant: "danger",
        });
      }
      fetchCampaigns();
    } catch (err) {
      console.error("Failed to start", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePauseCampaign = async (id: string) => {
    setActionLoadingId(id);
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "PAUSED" } : c))
    );
    try {
      await fetch(`/api/broadcast/${id}/pause`, { method: "POST" });
      fetchCampaigns();
    } catch (err) {
      console.error("Failed to pause", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelCampaign = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Batalkan Kampanye",
      message: "Batalkan pengiriman kampanye ini?",
      confirmText: "Ya, Batalkan",
      variant: "warning",
    });
    if (!isConfirmed) return;
    setActionLoadingId(id);
    try {
      await fetch(`/api/broadcast/${id}/cancel`, { method: "POST" });
      fetchCampaigns();
    } catch (err) {
      console.error("Failed to cancel", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Hapus Kampanye",
      message: "Hapus riwayat kampanye ini?",
      confirmText: "Ya, Hapus",
      variant: "danger",
    });
    if (!isConfirmed) return;

    // Optimistic UI
    setCampaigns((prev) => prev.filter((c) => c.id !== id));

    try {
      await fetch(`/api/broadcast/${id}`, { method: "DELETE" });
      fetchCampaigns();
    } catch (err) {
      console.error("Failed to delete", err);
      fetchCampaigns();
    }
  };

  // Stats calculation
  const totalBroadcasts = campaigns.length;
  const totalSent = campaigns.reduce((acc, c) => acc + c.sentCount, 0);
  const totalFailed = campaigns.reduce((acc, c) => acc + c.failedCount, 0);
  const activeRunning = campaigns.filter((c) => c.status === "RUNNING").length;

  const targetCount = getComputedRecipients().length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RUNNING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            RUNNING
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
            COMPLETED
          </span>
        );
      case "PAUSED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/25">
            PAUSED
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/25">
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-base-200 text-base-content/70 border border-base-300">
            DRAFT
          </span>
        );
    }
  };

  return (
    <PlanFeatureGuard
      feature="broadcast"
      featureName="Broadcast & Blast Massal"
      minPlanName="Starter"
      description="Fitur Broadcast memungkinkan Anda mengirim pesan WhatsApp massal ke ribuan kontak sekaligus secara terjadwal dengan Spintax variasi acak, batch throttling, dan anti-ban protection."
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Broadcast Campaigns</h1>
          <p className="text-sm text-base-content/60 mt-1">
            Kirim pesan WhatsApp massal terjadwal dengan Spintax variasi acak, batch throttling, dan anti-ban protection.
          </p>
        </div>

        <button
          onClick={() => setIsWizardOpen(true)}
          className="btn btn-primary gap-2 shadow-md shadow-primary/25"
        >
          <Plus className="w-4 h-4" /> Buat Kampanye Broadcast
        </button>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-sm">
          <div className="text-xs font-semibold text-base-content/60">Total Kampanye</div>
          <div className="text-2xl font-bold mt-1 text-base-content">{totalBroadcasts}</div>
        </div>
        <div className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-sm">
          <div className="text-xs font-semibold text-base-content/60">Sedang Berjalan</div>
          <div className="text-2xl font-bold mt-1 text-primary">{activeRunning}</div>
        </div>
        <div className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-sm">
          <div className="text-xs font-semibold text-base-content/60">Pesan Terkirim</div>
          <div className="text-2xl font-bold mt-1 text-emerald-600">{totalSent}</div>
        </div>
        <div className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-sm">
          <div className="text-xs font-semibold text-base-content/60">Pesan Gagal</div>
          <div className="text-2xl font-bold mt-1 text-rose-500">{totalFailed}</div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="card bg-base-100 border border-base-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-base-200 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <Radio className="w-4 h-4 text-primary" /> Daftar Kampanye Broadcast
          </div>
          <button onClick={fetchCampaigns} className="btn btn-ghost btn-xs gap-1 text-base-content/60">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-base-content/60 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Memuat kampanye...
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center mx-auto text-base-content/50">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <div className="font-semibold text-sm">Belum Ada Kampanye Broadcast</div>
              <p className="text-xs text-base-content/50 mt-0.5">
                Buat kampanye broadcast pertama Anda untuk menyapa ratusan kontak pelanggan.
              </p>
            </div>
            <button onClick={() => setIsWizardOpen(true)} className="btn btn-primary btn-sm gap-1.5 mt-2">
              <Plus className="w-3.5 h-3.5" /> Buat Broadcast Baru
            </button>
          </div>
        ) : (
          <div className="divide-y divide-base-200">
            {campaigns.map((camp) => {
              const percent =
                camp.totalRecipients > 0
                  ? Math.round(((camp.sentCount + camp.failedCount + camp.skippedCount) / camp.totalRecipients) * 100)
                  : 0;

              return (
                <div key={camp.id} className="p-5 hover:bg-base-200/20 transition-colors space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="font-bold text-sm text-base-content">{camp.name}</h3>
                        {getStatusBadge(camp.status)}
                      </div>
                      <p className="text-xs text-base-content/60 line-clamp-1 mt-1">
                        Template: "{camp.messageTemplate}"
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {camp.status === "DRAFT" && (
                        <button
                          onClick={() => handleStartCampaign(camp.id)}
                          disabled={actionLoadingId === camp.id}
                          className="btn btn-primary btn-xs gap-1.5 shadow-sm"
                        >
                          {actionLoadingId === camp.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Memulai...
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 fill-current" /> Mulai Kirim
                            </>
                          )}
                        </button>
                      )}
                      {camp.status === "RUNNING" && (
                        <button
                          onClick={() => handlePauseCampaign(camp.id)}
                          disabled={actionLoadingId === camp.id}
                          className="btn btn-warning btn-xs gap-1.5"
                        >
                          {actionLoadingId === camp.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menjeda...
                            </>
                          ) : (
                            <>
                              <Pause className="w-3 h-3 fill-current" /> Jeda
                            </>
                          )}
                        </button>
                      )}
                      {camp.status === "PAUSED" && (
                        <button
                          onClick={() => handleStartCampaign(camp.id)}
                          disabled={actionLoadingId === camp.id}
                          className="btn btn-primary btn-xs gap-1.5"
                        >
                          {actionLoadingId === camp.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Melanjutkan...
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 fill-current" /> Lanjutkan
                            </>
                          )}
                        </button>
                      )}
                      {(camp.status === "RUNNING" || camp.status === "PAUSED") && (
                        <button
                          onClick={() => handleCancelCampaign(camp.id)}
                          disabled={actionLoadingId === camp.id}
                          className="btn btn-ghost btn-xs text-rose-500 gap-1.5"
                        >
                          {actionLoadingId === camp.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" /> Batalkan
                            </>
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => setViewingCampaign(camp)}
                        className="btn btn-ghost btn-xs text-primary gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Rincian
                      </button>
                      <button
                        onClick={() => handleDeleteCampaign(camp.id)}
                        disabled={actionLoadingId === camp.id}
                        className="btn btn-ghost btn-xs text-error"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar & Counters */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-base-content/70 font-medium">
                      <span>
                        Progres: {camp.sentCount + camp.failedCount + camp.skippedCount} / {camp.totalRecipients} Kontak ({percent}%)
                      </span>
                      <div className="flex gap-3 text-[11px]">
                        <span className="text-emerald-600 font-semibold">{camp.sentCount} Terkirim</span>
                        {camp.failedCount > 0 && (
                          <span className="text-rose-500 font-semibold">{camp.failedCount} Gagal</span>
                        )}
                        {camp.skippedCount > 0 && (
                          <span className="text-amber-500 font-semibold">{camp.skippedCount} Skipped (DND)</span>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-base-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          camp.status === "COMPLETED" ? "bg-emerald-500" : "bg-primary"
                        }`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-[11px] text-base-content/50 flex flex-wrap gap-4 pt-0.5">
                    <span>Dibuat: {new Date(camp.createdAt).toLocaleString("id-ID")}</span>
                    <span>Batch: {camp.batchSize} pesan / {camp.batchDelaySec}s cooldown</span>
                    <span>Jeda acak: {camp.minDelaySec}-{camp.maxDelaySec}s</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Wizard Buat Broadcast Baru */}
      {isWizardOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] bg-black/60 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
            <div className="bg-base-100 rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-4 shadow-2xl border border-base-200 my-auto animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xl flex items-center gap-2">
                    <Radio className="w-5 h-5 text-primary" />
                    Buat Kampanye Broadcast Baru
                  </h3>
                  <p className="text-xs text-base-content/60 mt-0.5">
                    Atur target penerima, template spintax, dan proteksi anti-ban sebelum pengiriman massal.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !creatingCampaign && setIsWizardOpen(false)}
                  className="btn btn-ghost btn-circle btn-xs text-base-content/50"
                >
                  ✕
                </button>
              </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4 mt-5">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-semibold text-xs">Nama Kampanye</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Flash Sale 9.9 Member VIP"
                  className="input input-bordered w-full text-sm"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-xs">Pilih WhatsApp Device Pengirim</span>
                  </label>
                  {devices.length === 0 ? (
                    <div className="alert alert-warning text-xs py-2">
                      <span>Belum ada WhatsApp device terhubung.</span>
                    </div>
                  ) : (
                    <select
                      className="select select-bordered select-sm w-full text-xs font-medium"
                      value={selectedDeviceId}
                      onChange={(e) => setSelectedDeviceId(e.target.value)}
                    >
                      <option value="auto_rotate">🔄 Auto-Rotate (Round-Robin Semua Device Aktif)</option>
                      {devices.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.phoneNumber ? `+${d.phoneNumber}` : d.name} ({d.status})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-xs">Target Penerima</span>
                  </label>
                  <select
                    className="select select-bordered select-sm w-full text-xs font-medium"
                    value={targetType}
                    onChange={(e: any) => setTargetType(e.target.value)}
                  >
                    <option value="GROUP">Berdasarkan Grup Kontak</option>
                    <option value="ALL_CONTACTS">Semua Kontak di Buku Telepon</option>
                    <option value="MANUAL">Input Manual / Tempel Nomor</option>
                  </select>
                </div>
              </div>

              {/* Target Details */}
              {targetType === "GROUP" && (
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-xs">Pilih Grup Kontak:</span>
                  </label>
                  <select
                    className="select select-bordered select-sm w-full text-xs"
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                  >
                    {groups.map((g) => {
                      const count = allContacts.filter((c) => c.groupId === g.id).length;
                      return (
                        <option key={g.id} value={g.id}>
                          {g.name} ({count} Kontak)
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {targetType === "MANUAL" && (
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-xs">Tempel Nomor Tujuan (Baris per Baris):</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder={`Budi, 081234567890\nSiti, 085712345678\n089698765432`}
                    className="textarea textarea-bordered text-xs font-mono w-full"
                    value={manualNumbersText}
                    onChange={(e) => setManualNumbersText(e.target.value)}
                    required
                  ></textarea>
                </div>
              )}

              {/* Message Template with Spintax */}
              <div className="form-control">
                <div className="flex justify-between items-center py-1">
                  <label className="label p-0">
                    <span className="label-text font-semibold text-xs">Template Pesan (Mendukung Spintax)</span>
                  </label>
                  <span className="text-[11px] text-primary font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Variabel: {"{{name}}"}, {"{{kota}}"}
                  </span>
                </div>
                <textarea
                  rows={4}
                  placeholder="Ketik pesan dengan format {opsi1|opsi2} dan {{name}}..."
                  className="textarea textarea-bordered text-xs w-full"
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  required
                ></textarea>
              </div>

              {/* Live Preview Box */}
              {previewSamples.length > 0 && (
                <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1.5">
                  <div className="text-xs font-semibold text-primary flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Pratinjau Variasi Spintax Otomatis:
                  </div>
                  {previewSamples.slice(0, 2).map((s, idx) => (
                    <div key={idx} className="text-xs bg-base-100 p-2 rounded-lg border border-base-200 text-base-content/80">
                      <span className="badge badge-xs badge-ghost mr-1 text-[9px]">Variasi {idx + 1}</span>
                      {s}
                    </div>
                  ))}
                </div>
              )}

              {/* Safety & Throttling Settings */}
              <div className="p-4 rounded-2xl bg-base-200/50 border border-base-300 space-y-3">
                <div className="font-semibold text-xs flex items-center gap-1.5 text-base-content">
                  <ShieldCheck className="w-4 h-4 text-primary" /> Pengaturan Anti-Ban & Batching
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="label py-0.5 text-base-content/70">Ukuran Batch (Pesan)</label>
                    <input
                      type="number"
                      min={5}
                      max={50}
                      className="input input-bordered input-sm w-full"
                      value={batchSize}
                      onChange={(e) => setBatchSize(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="label py-0.5 text-base-content/70">Jeda Cooldown Antar Batch (Detik)</label>
                    <input
                      type="number"
                      min={10}
                      max={300}
                      className="input input-bordered input-sm w-full"
                      value={batchDelaySec}
                      onChange={(e) => setBatchDelaySec(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="text-[11px] text-base-content/60 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Jeda acak 4–8 detik per pesan & simulasi typing diaktifkan secara otomatis.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setIsWizardOpen(false)}
                  disabled={creatingCampaign}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm gap-2"
                  disabled={creatingCampaign || !campaignName.trim()}
                >
                  {creatingCampaign && <Loader2 className="w-4 h-4 animate-spin" />}
                  Simpan & Luncurkan Kampanye
                </button>
              </div>
            </form>
          </div>
        </div>
      </ModalPortal>
    )}

      {/* Modal: Rincian Penerima Kampanye */}
      {viewingCampaign && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] bg-black/60 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
            <div className="bg-base-100 rounded-3xl max-w-3xl w-full p-6 md:p-8 space-y-4 shadow-2xl border border-base-200 my-auto animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <span>Rincian Kampanye: {viewingCampaign.name}</span>
                    {getStatusBadge(viewingCampaign.status)}
                  </h3>
                  <p className="text-xs text-base-content/60 mt-0.5">
                    Daftar status pengiriman per nomor penerima.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingCampaign(null)}
                  className="btn btn-ghost btn-circle btn-xs text-base-content/50"
                >
                  ✕
                </button>
              </div>

              <div className="mt-2 max-h-96 overflow-y-auto border border-base-200 rounded-2xl">
                <table className="table table-xs">
                  <thead>
                    <tr className="bg-base-200/50">
                      <th>Nama</th>
                      <th>Nomor WhatsApp</th>
                      <th>Teks yang Dikirim (Spintax)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingCampaign.recipients.map((r) => (
                      <tr key={r.id}>
                        <td className="font-semibold">{r.name}</td>
                        <td className="font-mono">+{r.phoneNumber}</td>
                        <td className="max-w-xs truncate text-base-content/80">
                          {r.renderedMessage || viewingCampaign.messageTemplate}
                        </td>
                        <td>
                          {r.status === "SENT" && (
                            <span className="badge badge-success badge-xs text-white text-[10px]">SENT</span>
                          )}
                          {r.status === "PENDING" && (
                            <span className="badge badge-ghost badge-xs text-[10px]">PENDING</span>
                          )}
                          {r.status === "FAILED" && (
                            <span className="badge badge-error badge-xs text-white text-[10px]">FAILED</span>
                          )}
                          {r.status === "SKIPPED_BLACKLIST" && (
                            <span className="badge badge-warning badge-xs text-[10px]">SKIPPED DND</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setViewingCampaign(null)}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
      </div>
    </PlanFeatureGuard>
  );
}
