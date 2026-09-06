"use client";

import { useState, useEffect, useCallback } from "react";
import { useConfirm } from "@/components/confirm-dialog";
import { ModalPortal } from "@/components/ui/ModalPortal";
import {
  Bot,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Loader2,
  ArrowRight,
  Smartphone,
  ShieldCheck,
  Zap,
  ScrollText,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { AutoReplyRule, MatchType } from "@/lib/autoreply";
import { PlanFeatureGuard } from "@/components/dashboard/PlanFeatureGuard";

export default function AutomationPage() {
  const [rules, setRules] = useState<AutoReplyRule[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const confirm = useConfirm();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoReplyRule | null>(null);
  const [name, setName] = useState("");
  const [matchType, setMatchType] = useState<MatchType>("CONTAINS");
  const [keywordsInput, setKeywordsInput] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [deviceId, setDeviceId] = useState<string>("");
  const [delaySec, setDelaySec] = useState(2);
  const [saving, setSaving] = useState(false);

  // Sandbox Tester State
  const [testText, setTestText] = useState("Halo min, minta daftar pricelist dong");
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Logs State
  const [activeTab, setActiveTab] = useState<"rules" | "logs">("rules");
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchRules = async () => {
    try {
      const res = await fetch("/api/autoreply");
      const json = await res.json();
      if (json.success) setRules(json.data);
    } catch (err) {
      console.error("Failed to fetch rules", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDevices = async () => {
    try {
      const res = await fetch("/api/gateway/sessions");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) setDevices(json.data);
    } catch {}
  };

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await fetch("/api/autoreply/logs");
      const json = await res.json();
      if (json.success) setLogs(json.data);
    } catch {} finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
    fetchDevices();
  }, []);

  const openCreateModal = () => {
    setEditingRule(null);
    setName("");
    setMatchType("CONTAINS");
    setKeywordsInput("");
    setReplyMessage("{Halo|Hai} {{pushName}}! Terima kasih atas pesan Anda. Silakan tunggu sebentar, kami akan segera merespons.");
    setDeviceId("");
    setDelaySec(2);
    setIsModalOpen(true);
  };

  const openEditModal = (rule: AutoReplyRule) => {
    setEditingRule(rule);
    setName(rule.name);
    setMatchType(rule.matchType);
    setKeywordsInput(rule.keywords.join(", "));
    setReplyMessage(rule.replyMessage);
    setDeviceId(rule.deviceId || "");
    setDelaySec(rule.delaySec || 2);
    setIsModalOpen(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const keywords = keywordsInput
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    try {
      if (editingRule) {
        const res = await fetch(`/api/autoreply/${editingRule.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            matchType,
            keywords,
            replyMessage,
            deviceId: deviceId || null,
            delaySec,
            isActive: editingRule.isActive,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setIsModalOpen(false);
          fetchRules();
        }
      } else {
        const res = await fetch("/api/autoreply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            matchType,
            keywords,
            replyMessage,
            deviceId: deviceId || null,
            delaySec,
            isActive: true,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setIsModalOpen(false);
          fetchRules();
        }
      }
    } catch (err) {
      console.error("Failed to save rule", err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      setRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isActive: !current } : r))
      );
      await fetch(`/api/autoreply/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      fetchRules();
    } catch (err) {
      console.error("Failed to toggle", err);
    }
  };

  const handleDeleteRule = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Hapus Aturan Auto-Reply",
      message: "Apakah Anda yakin ingin menghapus aturan balasan otomatis ini?",
      confirmText: "Ya, Hapus Aturan",
      variant: "danger",
    });
    if (!isConfirmed) return;
    try {
      setRules((prev) => prev.filter((r) => r.id !== id));
      await fetch(`/api/autoreply/${id}`, { method: "DELETE" });
      fetchRules();
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const handleTestSandbox = async () => {
    if (!testText.trim()) return;
    setTestLoading(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/autoreply/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: testText }),
      });
      const json = await res.json();
      setTestResult(json);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTestLoading(false);
    }
  };

  const insertVariable = (varCode: string) => {
    setReplyMessage((prev) => prev + " " + varCode);
  };

  return (
    <PlanFeatureGuard
      feature="autoReply"
      featureName="Auto Reply Rules & Bot Automation"
      minPlanName="Starter"
      description="Fitur Auto Reply Bot membalas pesan masuk secara instan dan cerdas berdasarkan kata kunci (keywords), regex, spintax variasi, dan jeda human typing."
    >
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
              <Bot className="w-7 h-7 text-primary" /> Auto Reply Bot Rules
            </h1>
          <p className="text-sm text-base-content/60 mt-1">
            Konfigurasi balasan bot otomatis berbasis kata kunci, Spintax, dan simulasi typing presence.
          </p>
        </div>

        <button onClick={openCreateModal} className="btn btn-primary gap-2 shadow-md shadow-primary/20">
          <Plus className="w-4 h-4" /> Buat Aturan Baru
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-base-200/60 rounded-2xl w-fit">
        {[
          { key: "rules", label: "Aturan Bot", icon: Bot },
          { key: "logs", label: "Log Bot", icon: ScrollText },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => {
                setActiveTab(t.key as "rules" | "logs");
                if (t.key === "logs") fetchLogs();
              }}
              className={`btn btn-sm gap-2 rounded-xl transition-all ${
                activeTab === t.key ? "btn-primary shadow-md shadow-primary/20" : "btn-ghost"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab: Aturan Bot ──────────────────────────────────────────── */}
      {activeTab === "rules" && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Rules List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base flex items-center gap-2">
              <span>Daftar Aturan Aktif</span>
              <span className="badge badge-sm badge-primary">{rules.length} Aturan</span>
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-base-content/60 flex items-center justify-center gap-2 bg-base-100 rounded-3xl border border-base-200">
              <Loader2 className="w-5 h-5 animate-spin" /> Memuat daftar aturan...
            </div>
          ) : rules.length === 0 ? (
            <div className="card bg-base-100 border border-base-200 p-10 text-center space-y-3 rounded-3xl">
              <div className="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center mx-auto text-base-content/50">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-sm">Belum Ada Aturan Auto-Reply</h3>
              <p className="text-xs text-base-content/50">
                Buat aturan balasan otomatis agar nomor WhatsApp Anda dapat merespons pertanyaan pelanggan 24/7.
              </p>
              <button onClick={openCreateModal} className="btn btn-primary btn-sm gap-1.5 mt-2">
                <Plus className="w-3.5 h-3.5" /> Buat Aturan Pertama
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`card bg-base-100 border transition-all rounded-3xl p-5 shadow-sm space-y-3.5 ${
                    rule.isActive ? "border-base-200 hover:border-primary/40" : "border-base-300 opacity-60 bg-base-200/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-base-content">{rule.name}</span>
                        <span
                          className={`badge badge-xs font-semibold uppercase text-[10px] py-1.5 px-2 ${
                            rule.matchType === "EXACT"
                              ? "badge-primary"
                              : rule.matchType === "CONTAINS"
                              ? "badge-secondary"
                              : rule.matchType === "STARTS_WITH"
                              ? "badge-accent"
                              : rule.matchType === "FALLBACK"
                              ? "badge-warning"
                              : "badge-ghost"
                          }`}
                        >
                          {rule.matchType}
                        </span>
                        {rule.delaySec > 0 && (
                          <span className="badge badge-xs badge-ghost text-[10px] gap-1 text-base-content/60">
                            <Clock className="w-2.5 h-2.5" /> {rule.delaySec}s typing
                          </span>
                        )}
                      </div>

                      {/* Keywords badge list */}
                      {rule.matchType !== "FALLBACK" && rule.keywords.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          <span className="text-[11px] text-base-content/50 font-medium">Kata Kunci:</span>
                          {rule.keywords.map((kw, i) => (
                            <span key={i} className="badge badge-sm badge-ghost text-[11px] font-mono">
                              "{kw}"
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="toggle toggle-primary toggle-sm"
                        checked={rule.isActive}
                        onChange={() => handleToggleActive(rule.id, rule.isActive)}
                        title={rule.isActive ? "Nonaktifkan" : "Aktifkan"}
                      />
                      <button
                        onClick={() => openEditModal(rule)}
                        className="btn btn-ghost btn-xs text-base-content/70 hover:text-primary"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="btn btn-ghost btn-xs text-error"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Message Response Box */}
                  <div className="bg-base-200/50 border border-base-200 rounded-2xl p-3 text-xs text-base-content/80 whitespace-pre-line font-sans">
                    {rule.replyMessage}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-base-content/50 pt-1 border-t border-base-200/50">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-500" /> Dipicu {rule.triggerCount || 0} kali
                    </span>
                    <span>
                      Device: {rule.deviceId ? `ID ${rule.deviceId.substring(0, 8)}...` : "Semua Device"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Sandbox Tester & Docs */}
        <div className="space-y-4">
          <div className="card bg-base-100 border border-base-200 p-5 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 font-bold text-sm text-base-content">
              <Sparkles className="w-4 h-4 text-primary" /> Sandbox Tester Bot
            </div>
            <p className="text-xs text-base-content/60 leading-relaxed">
              Uji coba kecocokan kata kunci dan pratinjau pesan balasan bot sebelum menerima pesan pelanggan sungguhan.
            </p>

            <div className="space-y-2">
              <label className="label p-0 text-xs font-semibold text-base-content/70">
                Ketik Pesan Masuk Dummy:
              </label>
              <textarea
                rows={3}
                className="textarea textarea-bordered text-xs w-full font-mono"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Cth: Halo min harga paketnya berapa?"
              ></textarea>
              <button
                onClick={handleTestSandbox}
                disabled={testLoading || !testText.trim()}
                className="btn btn-primary btn-sm w-full gap-2"
              >
                {testLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                Uji Respon Bot
              </button>
            </div>

            {/* Sandbox Output Box */}
            {testResult && (
              <div
                className={`p-4 rounded-2xl border text-xs space-y-2 ${
                  testResult.matched
                    ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-950 dark:text-emerald-200"
                    : "bg-amber-500/5 border-amber-500/20 text-amber-950 dark:text-amber-200"
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    {testResult.matched ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Cocok: {testResult.ruleName}
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-amber-500" /> Tidak Ada Aturan Cocok
                      </>
                    )}
                  </span>
                  {testResult.matched && (
                    <span className="badge badge-xs badge-emerald text-[9px]">{testResult.matchType}</span>
                  )}
                </div>

                {testResult.matched ? (
                  <div className="bg-base-100 p-3 rounded-xl border border-base-200 text-base-content text-xs whitespace-pre-line shadow-sm">
                    {testResult.renderedReply}
                  </div>
                ) : (
                  <p className="text-[11px] text-base-content/60">
                    Pesan ini tidak memicu aturan manapun. Anda dapat menambahkan aturan bertipe <b>FALLBACK</b> untuk merespons pesan tak dikenal.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Quick Guide Card */}
          <div className="card bg-base-200/40 border border-base-200 p-5 rounded-3xl space-y-2.5 text-xs text-base-content/70">
            <div className="font-semibold text-base-content flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Tips Keamanan & Anti-Ban Bot
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-base-content/60 leading-relaxed">
              <li>Gunakan <b>Spintax</b> <code className="text-primary font-mono">{`{Halo|Hai}`}</code> agar pesan balasan tidak dianggap spam oleh WhatsApp.</li>
              <li>Aktifkan jeda simulasi pengetikan <b>1–3 detik</b> agar tampak natural seperti manusia.</li>
              <li>Nomor di daftar Blacklist / DND otomatis tidak akan dibalas oleh bot.</li>
            </ul>
          </div>
        </div>
      </div>
      )} {/* end activeTab === rules */}

      {/* ── Tab: Log Bot ─────────────────────────────────────────────── */}
      {activeTab === "logs" && (
        <div className="card bg-base-100 border border-base-200 shadow-sm rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-base-200">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-primary" />
              Log Aktivitas Bot Auto-Reply
            </h3>
            <button onClick={fetchLogs} disabled={logsLoading} className="btn btn-ghost btn-xs gap-1">
              <RefreshCw className={`w-3 h-3 ${logsLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {logsLoading ? (
            <div className="flex items-center justify-center py-16 text-base-content/40">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Memuat log...
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-base-content/30">
              <ScrollText className="w-10 h-10 mb-3" />
              <p className="text-sm font-medium">Belum ada log aktivitas bot</p>
              <p className="text-xs mt-1">Log akan muncul saat bot auto-reply berhasil dijalankan</p>
            </div>
          ) : (
            <div className="divide-y divide-base-200">
              {logs.map((log: any) => (
                <div key={log.id} className="flex items-start gap-4 px-6 py-4 hover:bg-base-50">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${log.success ? "bg-emerald-500/10 text-emerald-600" : "bg-error/10 text-error"}`}>
                    {log.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-semibold">{log.ruleName}</span>
                      <span className="text-xs text-base-content/40">dari</span>
                      <span className="text-xs font-mono text-base-content/60">{log.sender}</span>
                      {log.deviceId && log.deviceId !== "unknown" && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-base-200 text-base-content/50">
                          {log.deviceId}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 text-xs">
                      <div className="bg-base-200/60 rounded-lg px-2 py-1 flex-1 truncate">
                        <span className="text-base-content/40">Pesan: </span>
                        <span className="text-base-content/80">{log.inboundText}</span>
                      </div>
                      <div className="bg-primary/5 border border-primary/10 rounded-lg px-2 py-1 flex-1 truncate">
                        <span className="text-base-content/40">Balasan: </span>
                        <span className="text-primary/80">{log.replyText}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-base-content/30 flex-shrink-0 mt-1">
                    {new Date(log.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Create / Edit Rule */}
      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] bg-black/60 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
            <div className="bg-base-100 rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-5 shadow-2xl border border-base-200 my-auto animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />
                  {editingRule ? "Edit Aturan Auto-Reply" : "Buat Aturan Auto-Reply Baru"}
                </h3>
                <button
                  type="button"
                  onClick={() => !saving && setIsModalOpen(false)}
                  className="btn btn-ghost btn-circle btn-xs text-base-content/50"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveRule} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label text-xs font-semibold">Nama Aturan</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Info Jam Kerja / Promo"
                      className="input input-bordered input-sm w-full"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label text-xs font-semibold">Tipe Pencocokan (Match Type)</label>
                    <select
                      className="select select-bordered select-sm w-full font-medium"
                      value={matchType}
                      onChange={(e) => setMatchType(e.target.value as MatchType)}
                    >
                      <option value="CONTAINS">CONTAINS (Mengandung Kata)</option>
                      <option value="EXACT">EXACT (Pencocokan Persis)</option>
                      <option value="STARTS_WITH">STARTS_WITH (Awalan Kata)</option>
                      <option value="REGEX">REGEX (Ekspresi Reguler)</option>
                      <option value="FALLBACK">FALLBACK (Balasan Default Saat Tak Cocok)</option>
                    </select>
                  </div>
                </div>

                {matchType !== "FALLBACK" && (
                  <div className="form-control">
                    <label className="label text-xs font-semibold">
                      Kata Kunci Pemicu (Keywords - Pisahkan dengan koma)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: info, pricelist, harga, bantuan"
                      className="input input-bordered input-sm w-full font-mono text-xs"
                      value={keywordsInput}
                      onChange={(e) => setKeywordsInput(e.target.value)}
                    />
                  </div>
                )}

                <div className="form-control">
                  <div className="flex items-center justify-between py-1">
                    <label className="label text-xs font-semibold p-0">Isi Pesan Balasan Otomatis</label>
                    <span className="text-[11px] text-primary font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Mendukung Spintax {"{Halo|Hai}"}
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    required
                    placeholder="Halo {{pushName}}, terima kasih telah menghubungi kami..."
                    className="textarea textarea-bordered text-xs font-sans w-full"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 bg-base-200/40 rounded-2xl border border-base-300">
                  <div>
                    <label className="label py-0.5 text-xs font-medium text-base-content/70">
                      Jeda Balas Otomatis (Detik)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={60}
                      className="input input-bordered input-sm w-full text-xs"
                      value={delaySec}
                      onChange={(e) => setDelaySec(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="label py-0.5 text-xs font-medium text-base-content/70">
                      Terapkan pada Device
                    </label>
                    <select
                      className="select select-bordered select-sm w-full text-xs"
                      value={deviceId}
                      onChange={(e) => setDeviceId(e.target.value)}
                    >
                      <option value="">Semua Device Aktif</option>
                      {devices.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name || d.id} ({d.phoneNumber || "No number"})
                        </option>
                      ))}
                    </select>
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
                  <button type="submit" className="btn btn-primary btn-sm gap-2" disabled={saving || !name.trim() || !replyMessage.trim()}>
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingRule ? "Simpan Perubahan" : "Buat Aturan"}
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
