"use client";

import { useState, useEffect, useCallback } from "react";
import { useConfirm } from "@/components/confirm-dialog";
import { ModalPortal } from "@/components/ui/ModalPortal";
import {
  Bot,
  Plus,
  Trash2,
  Edit2,
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Zap,
  ScrollText,
  RefreshCw,
  XCircle,
  MessageSquare,
  Sparkles,
  Send,
  Tag,
  Laptop,
} from "lucide-react";
import { AutoReplyRule, MatchType } from "@/lib/autoreply";
import { PlanFeatureGuard } from "@/components/dashboard/PlanFeatureGuard";
import { CardGridSkeleton, TableSkeleton } from "@/components/ui/SkeletonLoaders";

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
  const [delaySec, setDelaySec] = useState(1);
  const [isMatchTypeDropdownOpen, setIsMatchTypeDropdownOpen] = useState(false);
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
    setIsMatchTypeDropdownOpen(false);
    setKeywordsInput("");
    setReplyMessage(
      "{Halo|Hai} Kak {{name}}!\nTerima kasih telah menghubungi kami. Ada yang bisa kami bantu?"
    );
    setDeviceId("");
    setDelaySec(1);
    setIsModalOpen(true);
  };

  const openEditModal = (rule: AutoReplyRule) => {
    setEditingRule(rule);
    setName(rule.name);
    setMatchType(rule.matchType);
    setIsMatchTypeDropdownOpen(false);
    setKeywordsInput(rule.keywords.join(", "));
    setReplyMessage(rule.replyMessage);
    setDeviceId(rule.deviceId || "");
    setDelaySec(rule.delaySec || 1);
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

  const insertVariable = (varName: string) => {
    setReplyMessage((prev) => `${prev} {{${varName}}}`);
  };

  return (
    <PlanFeatureGuard
      feature="autoReply"
      featureName="Auto Reply Rules & Bot Automation"
      minPlanName="Starter"
      description="Fitur Auto Reply Bot membalas pesan masuk secara instan dan cerdas berdasarkan kata kunci (keywords), regex, spintax variasi, dan jeda human typing."
    >
      <div className="space-y-6 max-w-7xl mx-auto pb-16 px-4 sm:px-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-base-200 pb-5">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-base-content flex items-center gap-2.5">
              <Bot className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              Aturan Auto-Reply Bot
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70">
              Konfigurasi balasan otomatis berbasis kata kunci, Spintax, dan simulasi pengetikan WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openCreateModal}
              className="btn btn-primary btn-sm sm:btn-md gap-2 shadow-sm font-semibold min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              Buat Aturan Baru
            </button>
          </div>
        </div>

        {/* Segmented Tab Navigation */}
        <div className="flex border-b border-base-200 gap-2">
          <button
            onClick={() => setActiveTab("rules")}
            className={`flex items-center gap-2 px-4 py-3 font-semibold text-xs sm:text-sm border-b-2 transition-all min-h-[44px] ${
              activeTab === "rules"
                ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                : "border-transparent text-base-content/60 hover:text-base-content"
            }`}
          >
            <Bot className="w-4 h-4" />
            Daftar Aturan
            <span className="badge badge-sm badge-ghost text-xs ml-1 font-mono">
              {rules.length}
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab("logs");
              fetchLogs();
            }}
            className={`flex items-center gap-2 px-4 py-3 font-semibold text-xs sm:text-sm border-b-2 transition-all min-h-[44px] ${
              activeTab === "logs"
                ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                : "border-transparent text-base-content/60 hover:text-base-content"
            }`}
          >
            <ScrollText className="w-4 h-4" />
            Log Aktivitas Bot
          </button>
        </div>

        {/* ── Tab: Aturan Bot ──────────────────────────────────────────── */}
        {activeTab === "rules" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Main Column: Rules List (7 cols lg, 8 cols xl) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-base-content uppercase tracking-wider text-xs">
                  Aturan Aktif ({rules.filter((r) => r.isActive).length} / {rules.length})
                </h2>
                <button
                  onClick={fetchRules}
                  className="btn btn-ghost btn-xs text-base-content/60 gap-1 min-h-[36px]"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Segarkan
                </button>
              </div>

              {loading ? (
                <CardGridSkeleton count={4} />
              ) : rules.length === 0 ? (
                <div className="card bg-base-100 border border-base-200 p-8 sm:p-12 text-center space-y-4 rounded-2xl">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <Bot className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-base-content">
                      Belum Ada Aturan Auto-Reply
                    </h3>
                    <p className="text-xs text-base-content/60 max-w-md mx-auto leading-relaxed">
                      Buat aturan pertama Anda agar WhatsApp dapat merespons pesan pembuka, pertanyaan harga, dan menu layanan secara instan 24/7.
                    </p>
                  </div>
                  <button
                    onClick={openCreateModal}
                    className="btn btn-primary btn-sm gap-2 mx-auto min-h-[40px] px-5"
                  >
                    <Plus className="w-4 h-4" /> Buat Aturan Pertama
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className={`card bg-base-100 border transition-all rounded-2xl p-5 shadow-sm space-y-4 ${
                        rule.isActive
                          ? "border-base-300 hover:border-primary/50 shadow-sm"
                          : "border-base-200 opacity-60 bg-base-200/40"
                      }`}
                    >
                      {/* Top Row: Title, Match Badge, Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-sm sm:text-base text-base-content">
                              {rule.name}
                            </h3>
                            <span
                              className={`badge badge-sm font-semibold uppercase text-[10px] tracking-wider ${
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
                              <span className="badge badge-sm badge-ghost text-[11px] gap-1 text-base-content/70">
                                <Clock className="w-3 h-3 text-base-content/50" />
                                {rule.delaySec}d jeda
                              </span>
                            )}
                          </div>

                          {/* Keywords Chips */}
                          {rule.matchType !== "FALLBACK" && rule.keywords.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap pt-1">
                              <span className="text-xs text-base-content/60 font-medium flex items-center gap-1">
                                <Tag className="w-3 h-3" /> Pemicu:
                              </span>
                              {rule.keywords.map((kw, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-medium bg-base-200 text-base-content/80 border border-base-300"
                                >
                                  {kw}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Action Controls */}
                        <div className="flex items-center gap-3 self-end sm:self-auto pt-1 sm:pt-0">
                          {/* Accessible Large Toggle Switch Button */}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={rule.isActive}
                            onClick={() => handleToggleActive(rule.id, rule.isActive)}
                            className="group flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-base-200/60 transition-all cursor-pointer min-h-[44px] select-none"
                            title={rule.isActive ? "Klik untuk menonaktifkan aturan" : "Klik untuk mengaktifkan aturan"}
                          >
                            <span
                              className={`text-xs font-semibold transition-colors ${
                                rule.isActive
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-base-content/50"
                              }`}
                            >
                              {rule.isActive ? "Aktif" : "Nonaktif"}
                            </span>
                            <div
                              className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                                rule.isActive
                                  ? "bg-emerald-600 dark:bg-emerald-500"
                                  : "bg-slate-300 dark:bg-slate-700"
                              }`}
                            >
                              <div
                                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                                  rule.isActive ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </div>
                          </button>

                          <div className="flex items-center border-l border-base-200 pl-2 gap-1.5">
                            <button
                              onClick={() => openEditModal(rule)}
                              className="btn btn-ghost btn-sm btn-square text-base-content/70 hover:text-emerald-600 hover:bg-emerald-500/10 min-h-[40px] min-w-[40px] rounded-xl"
                              title="Edit Aturan"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRule(rule.id)}
                              className="btn btn-ghost btn-sm btn-square text-error hover:bg-error/10 min-h-[40px] min-w-[40px] rounded-xl"
                              title="Hapus Aturan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* WhatsApp Style Message Preview Balloon */}
                      <div className="bg-base-200/60 border border-base-300/80 rounded-xl p-3.5 text-xs text-base-content leading-relaxed whitespace-pre-line font-sans">
                        <div className="text-[10px] font-bold uppercase text-base-content/40 tracking-wider mb-1.5 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> Pratinjau Balasan:
                        </div>
                        {rule.replyMessage}
                      </div>

                      {/* Metadata Footer */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-base-content/60 pt-2 border-t border-base-200">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          Total Dipicu:{" "}
                          <span className="font-bold text-base-content font-mono">
                            {rule.triggerCount || 0} kali
                          </span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Laptop className="w-3.5 h-3.5 text-base-content/50" />
                          Perangkat:{" "}
                          <span className="font-semibold text-base-content/80">
                            {rule.deviceId
                              ? `Device (${rule.deviceId.substring(0, 12)}...)`
                              : "Semua Device"}
                          </span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Sidebar: Sandbox Tester & Security Guide (5 cols lg, 4 cols xl) */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-5">
              {/* Sandbox Card */}
              <div className="card bg-base-100 border border-base-300 p-5 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center gap-2 font-bold text-sm text-base-content">
                  <Play className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-current" />
                  Simulator Tester Bot
                </div>
                <p className="text-xs text-base-content/70 leading-relaxed">
                  Uji kecocokan kata kunci dan format balasan bot secara instan tanpa perlu mengirim WhatsApp nyata.
                </p>

                <div className="space-y-2.5">
                  <label className="text-xs font-semibold text-base-content">
                    Ketik Contoh Pesan Masuk:
                  </label>
                  <textarea
                    rows={3}
                    className="textarea textarea-bordered text-xs w-full font-mono focus:border-primary focus:outline-none leading-normal"
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    placeholder="Contoh: halo, info harga, 1, 2, stop"
                  ></textarea>

                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {["halo", "1", "2", "3", "menu", "STOP", "START"].map((quick) => (
                      <button
                        key={quick}
                        type="button"
                        onClick={() => setTestText(quick)}
                        className="btn btn-xs btn-ghost border border-base-300 font-mono text-[11px] min-h-[28px]"
                      >
                        {quick}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleTestSandbox}
                    disabled={testLoading || !testText.trim()}
                    className="btn btn-primary btn-sm w-full gap-2 font-semibold min-h-[40px] mt-1"
                  >
                    {testLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    Uji Respon Bot
                  </button>
                </div>

                {/* Tester Output Box */}
                {testResult && (
                  <div
                    className={`p-4 rounded-xl border text-xs space-y-2.5 transition-all ${
                      testResult.matched
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        {testResult.matched ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            Cocok: {testResult.ruleName}
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            Tidak Ada Aturan Cocok
                          </>
                        )}
                      </span>
                      {testResult.matched && (
                        <span className="badge badge-sm badge-primary text-[10px] font-mono">
                          {testResult.matchType}
                        </span>
                      )}
                    </div>

                    {testResult.matched ? (
                      <div className="bg-base-100 p-3.5 rounded-lg border border-base-300 text-base-content text-xs whitespace-pre-line shadow-sm leading-relaxed">
                        {testResult.renderedReply}
                      </div>
                    ) : (
                      <p className="text-xs text-base-content/70 leading-relaxed">
                        Pesan ini tidak memicu aturan manapun. Anda dapat menambahkan aturan bertipe <b>FALLBACK</b> untuk menangani pesan tak dikenal.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Safety & Best Practices Guide with Actionable Examples */}
              <div className="card bg-base-100 border border-base-300 p-5 rounded-2xl space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-base-200 pb-3">
                  <div className="font-bold text-xs uppercase tracking-wider text-base-content flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Tips Anti-Ban & Contoh Penggunaan
                  </div>
                </div>

                {/* 1. Spintax Example */}
                <div className="space-y-2 p-3 bg-base-200/50 rounded-xl border border-base-300/70 text-xs">
                  <div className="font-bold text-base-content flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    1. Variasi Spintax (Mencegah Spam)
                  </div>
                  <p className="text-[11px] text-base-content/70 leading-relaxed">
                    WhatsApp mendeteksi pesan identik yang dikirim berulang kali. Gunakan Spintax dengan tanda kurung kurawal <code className="px-1 py-0.5 rounded bg-base-100 font-mono text-[10px] text-emerald-600 font-bold">{`{opsi1|opsi2|opsi3}`}</code> agar kalimat bervariasi otomatis.
                  </p>
                  <div className="p-2.5 bg-base-100 rounded-lg border border-base-300 font-mono text-[11px] text-base-content/90 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-base-content/40 tracking-wider">Contoh Format:</div>
                    <div>{`{Halo|Hai|Selamat datang} Kak {{name}}! {Terima kasih telah menghubungi kami|Ada yang bisa kami bantu?}`}</div>
                  </div>
                </div>

                {/* 2. Typing Delay Example */}
                <div className="space-y-2 p-3 bg-base-200/50 rounded-xl border border-base-300/70 text-xs">
                  <div className="font-bold text-base-content flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    2. Jeda Pengetikan (Human Typing Presence)
                  </div>
                  <p className="text-[11px] text-base-content/70 leading-relaxed">
                    Aktifkan jeda <b>1–2 detik</b>. Lawan bicara akan melihat status <i>"sedang mengetik..."</i> di WhatsApp, sehingga interaksi terasa alami seperti manusia sungguhan dan nomor lebih aman dari razia bot.
                  </p>
                </div>

                {/* 3. Compliance STOP / START */}
                <div className="space-y-2 p-3 bg-base-200/50 rounded-xl border border-base-300/70 text-xs">
                  <div className="font-bold text-base-content flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    3. Kepatuhan Regulasi (Auto Opt-Out STOP)
                  </div>
                  <p className="text-[11px] text-base-content/70 leading-relaxed">
                    Selalu sertakan opsi berhenti di footer pesan broadcast atau menu Anda. Jika pelanggan membalas <b>STOP</b>, sistem Waply otomatis menonaktifkan nomor mereka dari daftar broadcast (DND) agar nomor Anda tidak dilaporkan/diblokir pelanggan.
                  </p>
                  <div className="p-2 bg-base-100 rounded-lg border border-base-300 text-[11px] text-base-content/80 font-mono">
                    👉 Balas <b>STOP</b> untuk berhenti berlangganan.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Log Bot ─────────────────────────────────────────────── */}
        {activeTab === "logs" && (
          <div className="card bg-base-100 border border-base-300 shadow-sm rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-base-200 bg-base-50/50">
              <h3 className="font-bold text-sm flex items-center gap-2 text-base-content">
                <ScrollText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Log Aktivitas Balasan Otomatis
              </h3>
              <button
                onClick={fetchLogs}
                disabled={logsLoading}
                className="btn btn-ghost btn-xs gap-1.5 min-h-[36px]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? "animate-spin" : ""}`} />
                Segarkan Log
              </button>
            </div>

            {logsLoading ? (
              <div className="flex items-center justify-center py-16 text-base-content/60 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span>Memuat log aktivitas...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-base-content/40 space-y-2">
                <ScrollText className="w-10 h-10 stroke-1" />
                <p className="text-sm font-semibold">Belum Ada Log Aktivitas Bot</p>
                <p className="text-xs">Log akan otomatis tercatat setiap kali aturan auto-reply dieksekusi.</p>
              </div>
            ) : (
              <div className="divide-y divide-base-200 overflow-x-auto">
                {logs.map((log: any) => (
                  <div key={log.id} className="flex flex-col sm:flex-row sm:items-start gap-4 px-6 py-4 hover:bg-base-200/30 transition-colors">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        log.success ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-error/10 text-error"
                      }`}
                    >
                      {log.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-base-content">{log.ruleName}</span>
                        <span className="text-xs text-base-content/40">ke</span>
                        <span className="text-xs font-mono font-medium text-base-content/80 bg-base-200 px-1.5 py-0.5 rounded">
                          {log.sender}
                        </span>
                        {log.deviceId && log.deviceId !== "unknown" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-base-200 text-base-content/60 border border-base-300">
                            {log.deviceId}
                          </span>
                        )}
                        <span className="text-[11px] text-base-content/40 sm:ml-auto">
                          {new Date(log.createdAt).toLocaleString("id-ID", {
                            dateStyle: "short",
                            timeStyle: "medium",
                          })}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div className="bg-base-200/70 border border-base-300/60 rounded-lg p-2.5">
                          <div className="text-[10px] font-semibold text-base-content/50 uppercase tracking-wider mb-1">
                            Pesan Masuk:
                          </div>
                          <div className="text-base-content/90 font-medium">{log.inboundText}</div>
                        </div>
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-2.5">
                          <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">
                            Balasan Bot:
                          </div>
                          <div className="text-base-content/90">{log.replyText}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Modal: Create / Edit Rule ─────────────────────────────────── */}
        {isModalOpen && (
          <ModalPortal>
            <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-150">
              <div className="bg-base-100 rounded-2xl max-w-2xl w-full p-4 sm:p-6 space-y-4 shadow-2xl border border-base-300 my-auto animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-base-200 pb-3 flex-shrink-0">
                  <h3 className="font-bold text-sm sm:text-base flex items-center gap-2 text-base-content">
                    <Bot className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    {editingRule ? "Edit Aturan Auto-Reply" : "Buat Aturan Auto-Reply Baru"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => !saving && setIsModalOpen(false)}
                    className="btn btn-ghost btn-circle btn-sm text-base-content/60 min-h-[40px] min-w-[40px]"
                  >
                    ✕
                  </button>
                </div>

                {/* Modal Form */}
                <form onSubmit={handleSaveRule} className="space-y-4 overflow-y-auto flex-1 pr-1 sm:pr-1.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="form-control">
                      <label className="label py-1 text-xs font-semibold text-base-content">
                        Nama Aturan
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Menu Utama / Jam Buka"
                        className="input input-bordered w-full text-xs sm:text-sm min-h-[42px]"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    <div className="form-control relative">
                      <label className="label py-1 text-xs font-semibold text-base-content">
                        Tipe Pencocokan (Match Type)
                      </label>

                      {/* Custom Modern Match Type Selector */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsMatchTypeDropdownOpen(!isMatchTypeDropdownOpen)}
                          className="flex items-center justify-between w-full px-3 py-2 bg-base-100 border border-base-300 rounded-xl text-xs sm:text-sm font-medium hover:border-emerald-500 focus:border-emerald-500 transition-all min-h-[42px]"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border shrink-0 ${
                                matchType === "EXACT"
                                  ? "bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950 dark:text-sky-200 dark:border-sky-700"
                                  : matchType === "CONTAINS"
                                  ? "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-700"
                                  : matchType === "STARTS_WITH"
                                  ? "bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-200 dark:border-indigo-700"
                                  : matchType === "REGEX"
                                  ? "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-700"
                                  : "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-700"
                              }`}
                            >
                              {matchType}
                            </span>
                            <span className="text-slate-900 dark:text-slate-100 font-bold text-xs sm:text-sm truncate">
                              {matchType === "CONTAINS" && "Mengandung Kata"}
                              {matchType === "EXACT" && "Pencocokan Persis"}
                              {matchType === "STARTS_WITH" && "Awalan Kalimat"}
                              {matchType === "REGEX" && "Ekspresi Reguler"}
                              {matchType === "FALLBACK" && "Balasan Default"}
                            </span>
                          </div>
                          <span className="text-slate-600 dark:text-slate-400 text-xs font-bold ml-1.5 shrink-0">▼</span>
                        </button>

                        {isMatchTypeDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl shadow-2xl p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-100 max-h-[360px] overflow-y-auto">
                            {[
                              {
                                type: "CONTAINS" as MatchType,
                                title: "CONTAINS (Mengandung Kata)",
                                desc: "Cocok jika pesan pelanggan memuat kata kunci di mana saja dalam kalimat.",
                                badge: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-700",
                                example: 'Contoh: "Berapa harga paket?" cocok dengan kata "harga"',
                              },
                              {
                                type: "EXACT" as MatchType,
                                title: "EXACT (Pencocokan Persis)",
                                desc: "Pesan pelanggan harus sama persis 100% tanpa tambahan kata lain.",
                                badge: "bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950 dark:text-sky-200 dark:border-sky-700",
                                example: 'Contoh: Harus "halo" saja (tidak cocok jika "halo min")',
                              },
                              {
                                type: "STARTS_WITH" as MatchType,
                                title: "STARTS_WITH (Awalan Kata)",
                                desc: "Pesan pelanggan harus diawali dengan kata kunci yang ditentukan.",
                                badge: "bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-200 dark:border-indigo-700",
                                example: 'Contoh: "order 123" cocok dengan kata "order"',
                              },
                              {
                                type: "REGEX" as MatchType,
                                title: "REGEX (Ekspresi Reguler)",
                                desc: "Pola RegExp JavaScript khusus untuk validasi format nomor invoice / kode.",
                                badge: "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-700",
                                example: "Contoh: ^INV-\\d{4} untuk format nomor invoice",
                              },
                              {
                                type: "FALLBACK" as MatchType,
                                title: "FALLBACK (Balasan Cadangan)",
                                desc: "Merespons otomatis saat tidak ada aturan lain yang cocok dengan pesan pelanggan.",
                                badge: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-700",
                                example: "Contoh: Mengirimkan daftar menu utama saat kata kunci tidak dikenal",
                              },
                            ].map((opt) => (
                              <button
                                key={opt.type}
                                type="button"
                                onClick={() => {
                                  setMatchType(opt.type);
                                  setIsMatchTypeDropdownOpen(false);
                                }}
                                className={`w-full text-left p-2.5 sm:p-3 rounded-xl transition-all flex items-start justify-between gap-2.5 border ${
                                  matchType === opt.type
                                    ? "bg-emerald-50/90 border-emerald-500 shadow-2xs dark:bg-emerald-950/40 dark:border-emerald-500"
                                    : "bg-white hover:bg-slate-100/90 border-slate-200/80 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-800"
                                }`}
                              >
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${opt.badge}`}>
                                      {opt.type}
                                    </span>
                                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                      {opt.title}
                                    </span>
                                  </div>
                                  <div className="text-xs text-slate-800 dark:text-slate-200 leading-snug font-medium">
                                    {opt.desc}
                                  </div>
                                  <div className="text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-slate-100/90 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200/80 dark:border-slate-700 inline-block">
                                    {opt.example}
                                  </div>
                                </div>
                                {matchType === opt.type && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-1" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {matchType !== "FALLBACK" && (
                    <div className="form-control">
                      <label className="label py-1 text-xs font-semibold text-base-content">
                        Kata Kunci Pemicu (Pisahkan dengan koma)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: halo, hai, menu, info, pricelist"
                        className="input input-bordered w-full font-mono text-xs sm:text-sm min-h-[42px]"
                        value={keywordsInput}
                        onChange={(e) => setKeywordsInput(e.target.value)}
                      />
                      <span className="text-[11px] text-base-content/60 mt-1">
                        Sistem tidak membedakan huruf besar/kecil (case-insensitive).
                      </span>
                    </div>
                  )}

                  <div className="form-control space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 pb-0.5">
                      <label className="text-xs font-semibold text-base-content">
                        Isi Pesan Balasan
                      </label>
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[11px] text-base-content/60 mr-0.5 font-medium">Sisipkan:</span>
                        {["name", "phone", "time", "date"].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => insertVariable(v)}
                            className="inline-flex items-center px-2 py-0.5 bg-base-200 hover:bg-base-300 text-base-content/90 border border-base-300 rounded-md font-mono text-[10px] sm:text-[11px] font-semibold transition-colors cursor-pointer min-h-[28px]"
                          >
                            {`{{${v}}}`}
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      rows={5}
                      required
                      placeholder="Halo Kak {{name}}, terima kasih telah menghubungi kami..."
                      className="textarea textarea-bordered text-xs sm:text-sm font-sans w-full leading-relaxed min-h-[110px]"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                    ></textarea>
                    <div className="flex items-start gap-1.5 text-[11px] text-base-content/70 mt-1 leading-relaxed bg-base-200/50 p-2.5 rounded-xl border border-base-300/70">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>
                        Mendukung Spintax: <code className="font-mono text-primary font-bold bg-base-100 px-1 py-0.5 rounded border border-base-300">{`{Halo|Hai|Selamat datang}`}</code> untuk variasi pesan otomatis.
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3.5 sm:p-4 bg-base-200/50 rounded-xl border border-base-300">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-base-content block">
                        Jeda Simulasi Pengetikan (Detik)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={30}
                        className="input input-bordered w-full text-xs sm:text-sm min-h-[38px]"
                        value={delaySec}
                        onChange={(e) => setDelaySec(Number(e.target.value))}
                      />
                      <span className="text-[10px] text-base-content/60 block">
                        Bot akan menampilkan status typing sebelum mengirim pesan.
                      </span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-base-content block">
                        Terapkan pada Device
                      </label>
                      <select
                        className="select select-bordered w-full text-xs sm:text-sm min-h-[38px]"
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

                  {/* Modal Footer */}
                  <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3.5 border-t border-base-200 flex-shrink-0">
                    <button
                      type="button"
                      className="btn btn-ghost border border-base-300 w-full sm:w-auto min-h-[44px] text-xs sm:text-sm font-semibold"
                      onClick={() => setIsModalOpen(false)}
                      disabled={saving}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary w-full sm:w-auto min-h-[44px] text-xs sm:text-sm font-semibold gap-2"
                      disabled={saving || !name.trim() || !replyMessage.trim()}
                    >
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
