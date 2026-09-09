"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Filter,
  Search,
  Download,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
} from "lucide-react";
import { PlanFeatureGuard } from "@/components/dashboard/PlanFeatureGuard";
import { TableSkeleton } from "@/components/ui/SkeletonLoaders";

interface MessageItem {
  id: string;
  recipient: string;
  content: string;
  rawContent: string | null;
  status: string;
  failReason: string | null;
  sentAt: string | null;
  createdAt: string;
  device?: {
    name: string;
    phoneNumber: string | null;
  };
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const url = new URL("/api/messages", window.location.origin);
      if (search) url.searchParams.set("search", search);
      if (statusFilter !== "ALL") url.searchParams.set("status", statusFilter);

      const res = await fetch(url.toString());
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setMessages(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch messages", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMessages();
  };

  const exportCSV = () => {
    if (messages.length === 0) return;
    const headers = ["ID", "Recipient", "Content", "Status", "Sent At", "Created At"];
    const rows = messages.map((m) => [
      m.id,
      m.recipient,
      `"${m.content.replace(/"/g, '""')}"`,
      m.status,
      m.sentAt || "",
      m.createdAt,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `waply_messages_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SENT":
      case "DELIVERED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
            {status}
          </span>
        );
      case "READ":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/25">
            READ
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/25">
            FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25">
            {status}
          </span>
        );
    }
  };

  return (
    <PlanFeatureGuard
      feature="messageLogs"
      featureName="Message Logs (Riwayat Pesan)"
      minPlanName="Starter"
      description="Message Logs mencatat riwayat pengiriman pesan WhatsApp keluar, status delivery, dan pelacakan audit pesan. Upgrade paket untuk mengaktifkan fitur ini."
    >
      <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Message Logs</h1>
          <p className="text-sm text-base-content/60 mt-1">
            Riwayat lengkap pengiriman pesan WhatsApp keluar dan evaluasi spintax.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button onClick={fetchMessages} className="btn btn-outline btn-sm gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            onClick={exportCSV}
            disabled={messages.length === 0}
            className="btn btn-outline btn-sm gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      <div className="card bg-base-100 border border-base-200 shadow-sm rounded-2xl overflow-hidden">
        {/* Filters bar */}
        <div className="p-4 border-b border-base-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-base-content/40" />
            <input
              type="text"
              placeholder="Cari nomor penerima atau teks pesan..."
              className="input input-bordered input-sm w-full pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-base-content/50" />
            <select
              className="select select-bordered select-sm font-medium"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Semua Status</option>
              <option value="SENT">SENT (Terkirim)</option>
              <option value="DELIVERED">DELIVERED (Diterima)</option>
              <option value="READ">READ (Dibaca)</option>
              <option value="FAILED">FAILED (Gagal)</option>
            </select>
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : messages.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center mx-auto text-base-content/50">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="font-semibold text-sm">Belum Ada Riwayat Pesan</div>
              <p className="text-xs text-base-content/50 mt-0.5">
                Pesan yang dikirim melalui REST API atau Sandbox Tester akan dicatat di sini.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr className="bg-base-200/50 text-xs">
                  <th>Waktu</th>
                  <th>Device Pengirim</th>
                  <th>Nomor Penerima</th>
                  <th>Pesan Rendered (Spintax Parsed)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((m) => (
                  <tr key={m.id} className="text-xs hover:bg-base-200/30">
                    <td className="text-base-content/60 font-mono text-[11px] whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleString("id-ID")}
                    </td>
                    <td className="font-medium text-base-content">
                      {m.device?.phoneNumber ? `+${m.device.phoneNumber}` : m.device?.name || "Waply Device"}
                    </td>
                    <td className="font-mono font-medium">+{m.recipient}</td>
                    <td className="max-w-md">
                      <div className="line-clamp-2 text-base-content/90 font-medium">
                        {m.content}
                      </div>
                      {m.failReason && (
                        <div className="text-[11px] text-rose-500 mt-0.5">
                          Error: {m.failReason}
                        </div>
                      )}
                    </td>
                    <td>{getStatusBadge(m.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </PlanFeatureGuard>
  );
}
