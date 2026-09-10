"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  Send,
  Loader2,
  DollarSign,
  TrendingUp,
  Receipt,
  ExternalLink,
  ShieldCheck,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { TransactionDetail, TransactionSummary } from "@/lib/admin-transactions";
import { ModalPortal } from "@/components/ui/ModalPortal";

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionDetail[]>([]);
  const [summary, setSummary] = useState<TransactionSummary>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    successCount: 0,
    pendingCount: 0,
    failedCount: 0,
    averageOrderValue: 0,
    totalTransactions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/transactions");
      const json = await res.json();
      if (json.success && json.data) {
        setTransactions(json.data.transactions || []);
        setSummary(json.data.summary);
      }
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleClearAll = async () => {
    setActionLoading("clear-all");
    try {
      const res = await fetch("/api/admin/transactions?clearAll=true", {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        setShowClearModal(false);
        fetchTransactions();
      } else {
        showToast(json.error || "Gagal menghapus riwayat transaksi");
      }
    } catch {
      showToast("Terjadi kesalahan saat menghapus data");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteOne = async (orderId: string) => {
    setActionLoading(`delete-${orderId}`);
    try {
      const res = await fetch(`/api/admin/transactions?orderId=${encodeURIComponent(orderId)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        setDeleteTargetId(null);
        fetchTransactions();
      } else {
        showToast(json.error || "Gagal menghapus transaksi");
      }
    } catch {
      showToast("Terjadi kesalahan saat menghapus transaksi");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSyncStatus = async (orderId: string) => {
    setActionLoading(`sync-${orderId}`);
    try {
      const res = await fetch("/api/admin/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync", orderId }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        fetchTransactions();
      } else {
        showToast(json.error || "Gagal sinkron status");
      }
    } catch {
      showToast("Terjadi kesalahan sistem saat sinkron");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResendEmail = async (orderId: string) => {
    setActionLoading(`email-${orderId}`);
    try {
      const res = await fetch("/api/admin/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend_email", orderId }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
      } else {
        showToast(json.error || "Gagal mengirim ulang email");
      }
    } catch {
      showToast("Gagal mengirim email bukti pembayaran");
    } finally {
      setActionLoading(null);
    }
  };

  const exportCSV = () => {
    const headers = [
      "Order ID",
      "Customer Name",
      "Customer Email",
      "Plan Name",
      "Amount (IDR)",
      "Payment Method",
      "Status",
      "Created At",
      "Paid At",
    ];

    const rows = filteredTransactions.map((tx) => [
      `"${tx.orderId || tx.id}"`,
      `"${tx.userName || "-"}"`,
      `"${tx.userEmail || "-"}"`,
      `"${tx.planName || tx.planId}"`,
      tx.amount,
      `"${tx.paymentMethod || "-"}"`,
      tx.status,
      `"${new Date(tx.createdAt).toLocaleString("id-ID")}"`,
      `"${tx.paidAt ? new Date(tx.paidAt).toLocaleString("id-ID") : "-"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `waply_transactions_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      (tx.orderId || "").toLowerCase().includes(search.toLowerCase()) ||
      (tx.userName || "").toLowerCase().includes(search.toLowerCase()) ||
      (tx.userEmail || "").toLowerCase().includes(search.toLowerCase()) ||
      (tx.planName || "").toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || tx.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="toast toast-top toast-center z-50">
          <div className="alert alert-success text-xs font-bold py-2.5 px-4 shadow-xl rounded-xl flex items-center gap-2 text-white">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-base-content flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-primary" />
            Riwayat Transaksi & Finansial
          </h1>
          <p className="text-xs text-base-content/60 mt-1">
            Pantau seluruh arus kas langganan Midtrans, status settlement, dan invoice pelanggan
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowClearModal(true)}
            disabled={transactions.length === 0 || loading}
            className="btn btn-outline btn-error btn-sm gap-2"
            title="Hapus seluruh riwayat transaksi dan jadikan 0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Hapus Semua
          </button>
          <button
            onClick={fetchTransactions}
            disabled={loading}
            className="btn btn-outline btn-sm gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={exportCSV}
            disabled={transactions.length === 0}
            className="btn btn-primary btn-sm gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-base-100 border border-base-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-base-content/60">Total Omzet Bersih</div>
            <div className="text-lg font-extrabold text-base-content font-mono mt-0.5">
              Rp {summary.totalRevenue.toLocaleString("id-ID")}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              {summary.successCount} transaksi lunas
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-base-100 border border-base-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-base-content/60">Pendapatan Bulan Ini</div>
            <div className="text-lg font-extrabold text-base-content font-mono mt-0.5">
              Rp {summary.monthlyRevenue.toLocaleString("id-ID")}
            </div>
            <div className="text-[11px] text-base-content/50 mt-0.5">
              Rata-rata: Rp {summary.averageOrderValue.toLocaleString("id-ID")}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-base-100 border border-base-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-base-content/60">Menunggu Pembayaran</div>
            <div className="text-lg font-extrabold text-base-content font-mono mt-0.5">
              {summary.pendingCount} Order
            </div>
            <div className="text-[11px] text-amber-600 font-semibold mt-0.5">
              Status Pending
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-base-100 border border-base-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-base-content/60">Kedaluwarsa / Batal</div>
            <div className="text-lg font-extrabold text-base-content font-mono mt-0.5">
              {summary.failedCount} Order
            </div>
            <div className="text-[11px] text-rose-600 font-semibold mt-0.5">
              Expired di Gateway
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-base-100 border border-base-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" />
          <input
            type="text"
            placeholder="Cari Order ID, Nama, atau Email..."
            className="input input-bordered input-sm w-full pl-9 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto">
          {["ALL", "PAID", "PENDING", "EXPIRED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`btn btn-xs px-3 rounded-lg text-[11px] font-semibold ${
                statusFilter === status
                  ? "btn-primary"
                  : "btn-ghost text-base-content/70 hover:bg-base-200"
              }`}
            >
              {status === "ALL" && "Semua"}
              {status === "PAID" && "Lunas (Paid)"}
              {status === "PENDING" && "Pending"}
              {status === "EXPIRED" && "Expired"}
            </button>
          ))}
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-base-100 rounded-3xl border border-base-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-xs text-base-content/60">Memuat riwayat transaksi...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Receipt className="w-12 h-12 text-base-content/20 mx-auto" />
            <h3 className="font-bold text-sm text-base-content">Belum ada data transaksi</h3>
            <p className="text-xs text-base-content/50 max-w-sm mx-auto">
              Transaksi pembayaran paket pelanggan melalui Midtrans akan otomatis tercatat di sini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm w-full">
              <thead className="bg-base-200/50 text-[11px] font-bold text-base-content/70 uppercase">
                <tr>
                  <th className="py-3.5 pl-6">Order ID & Waktu</th>
                  <th>Customer</th>
                  <th>Paket & Durasi</th>
                  <th>Nominal</th>
                  <th>Metode</th>
                  <th>Status</th>
                  <th className="text-right pr-6">Aksi Super Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200 text-xs">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.orderId || tx.id} className="hover:bg-base-200/30">
                    <td className="py-3 pl-6">
                      <div className="font-mono font-bold text-base-content">
                        {tx.orderId || tx.id}
                      </div>
                      <div className="text-[11px] text-base-content/50 mt-0.5">
                        {new Date(tx.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>

                    <td>
                      <div className="font-bold text-base-content">{tx.userName}</div>
                      <div className="text-[11px] text-base-content/60">{tx.userEmail}</div>
                    </td>

                    <td>
                      <span className="badge badge-sm font-semibold bg-primary/10 text-primary border-primary/20">
                        {tx.planName || tx.planId}
                      </span>
                      <div className="text-[10px] text-base-content/50 mt-0.5">
                        {tx.period === "year"
                          ? "1 Tahun"
                          : tx.period === "day"
                          ? "1 Hari"
                          : "1 Bulan"}
                      </div>
                    </td>

                    <td className="font-mono font-bold text-base-content">
                      Rp {Number(tx.amount || 0).toLocaleString("id-ID")}
                    </td>

                    <td>
                      <span className="badge badge-ghost badge-sm text-[10px] font-mono">
                        {tx.paymentMethod || "QRIS / VA"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                          tx.status === "PAID"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            : tx.status === "PENDING"
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                            : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {tx.status === "PAID" && "Lunas (PAID)"}
                        {tx.status === "PENDING" && "Menunggu (PENDING)"}
                        {tx.status === "EXPIRED" && "Kedaluwarsa"}
                        {tx.status === "FAILED" && "Gagal"}
                      </span>
                    </td>

                    <td className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleSyncStatus(tx.orderId || tx.id)}
                          disabled={actionLoading === `sync-${tx.orderId || tx.id}`}
                          className="btn btn-ghost btn-xs h-7 px-2 font-semibold text-primary hover:bg-primary/10 gap-1"
                          title="Cek & Sinkron Status Langsung ke Midtrans Server"
                        >
                          {actionLoading === `sync-${tx.orderId || tx.id}` ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3 h-3" />
                          )}
                          Sync
                        </button>

                        <button
                          onClick={() => handleResendEmail(tx.orderId || tx.id)}
                          disabled={actionLoading === `email-${tx.orderId || tx.id}`}
                          className="btn btn-ghost btn-xs h-7 px-2 font-semibold text-base-content/70 hover:bg-base-200 gap-1"
                          title="Kirim Ulang Bukti Kwitansi ke Email User"
                        >
                          {actionLoading === `email-${tx.orderId || tx.id}` ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Send className="w-3 h-3" />
                          )}
                          Email
                        </button>

                        <button
                          onClick={() => setDeleteTargetId(tx.orderId || tx.id)}
                          disabled={actionLoading === `delete-${tx.orderId || tx.id}`}
                          className="btn btn-ghost btn-xs h-7 px-2 font-semibold text-error/80 hover:text-error hover:bg-error/10 gap-1"
                          title="Hapus riwayat transaksi ini"
                        >
                          {actionLoading === `delete-${tx.orderId || tx.id}` ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Konfirmasi Hapus Semua */}
      {showClearModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-base-100 rounded-2xl max-w-md w-full p-6 border border-base-200 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-error">
                <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-base-content">Hapus Seluruh Riwayat?</h3>
                  <p className="text-xs text-base-content/60">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>

              <p className="text-xs text-base-content/70 leading-relaxed">
                Semua data riwayat transaksi dan invoice Midtrans akan dihapus permanen. Seluruh total omzet, pendapatan bulanan, dan statistik transaksi di semua menu dashboard akan direset menjadi <span className="font-bold text-base-content">0</span>.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearModal(false)}
                  disabled={actionLoading === "clear-all"}
                  className="btn btn-ghost btn-sm text-xs"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={actionLoading === "clear-all"}
                  className="btn btn-error btn-sm text-xs gap-1.5 text-white"
                >
                  {actionLoading === "clear-all" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  Ya, Bersihkan Semua (0)
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal Konfirmasi Hapus Satu Transaksi */}
      {deleteTargetId && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-base-100 rounded-2xl max-w-md w-full p-6 border border-base-200 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-error">
                <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-base-content">Hapus Transaksi?</h3>
                  <p className="text-xs font-mono text-base-content/60">{deleteTargetId}</p>
                </div>
              </div>

              <p className="text-xs text-base-content/70 leading-relaxed">
                Data transaksi ini akan dihapus dari riwayat sistem dan nominalnya akan dikurangi dari kalkulasi omzet.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTargetId(null)}
                  disabled={actionLoading === `delete-${deleteTargetId}`}
                  className="btn btn-ghost btn-sm text-xs"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteOne(deleteTargetId)}
                  disabled={actionLoading === `delete-${deleteTargetId}`}
                  className="btn btn-error btn-sm text-xs gap-1.5 text-white"
                >
                  {actionLoading === `delete-${deleteTargetId}` ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
