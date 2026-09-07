"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Bell,
  Search,
  User,
  LogOut,
  ShieldCheck,
  Zap,
  Megaphone,
  Info,
  AlertTriangle,
  CheckCircle,
  Pin,
  CheckCheck,
  Menu,
  Headphones,
} from "lucide-react";

import { useUserSession } from "@/lib/use-user-session";
import { performLogout } from "@/lib/auth-logout";
import { useMobileNav } from "@/lib/mobile-nav-context";

interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "SUCCESS" | "URGENT";
  targetAudience: "ALL" | "FREE" | "PAID";
  isPinned: boolean;
  isActive: boolean;
  createdAt: string;
  isRead: boolean;
}

export function Navbar() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminTicketUnreadCount, setAdminTicketUnreadCount] = useState(0);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const { user: currentUser } = useUserSession();
  const router = useRouter();

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch("/api/announcements");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAnnouncements(data.data || data.announcements || []);
          setUnreadCount(data.unreadCount || 0);
        }
      }
    } catch (e) {
      console.error("Failed to fetch announcements:", e);
    }
  }, []);

  const fetchAdminTickets = useCallback(async () => {
    if (currentUser?.role !== "admin") return;
    try {
      const res = await fetch("/api/tickets?scope=all", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const unread = data.data.filter(
            (t: any) => t.unreadByAdmin === true && t.status !== "RESOLVED" && t.status !== "CLOSED"
          ).length;
          setAdminTicketUnreadCount(unread);
        }
      }
    } catch (e) {
      console.error("Failed to fetch admin tickets:", e);
    }
  }, [currentUser?.role]);

  useEffect(() => {
    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 60000); // Check every 60s
    return () => clearInterval(interval);
  }, [fetchAnnouncements]);

  useEffect(() => {
    if (currentUser?.role === "admin") {
      fetchAdminTickets();
      const interval = setInterval(fetchAdminTickets, 10000); // Check every 10s
      return () => clearInterval(interval);
    }
  }, [currentUser?.role, fetchAdminTickets]);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      });
      if (res.ok) {
        setUnreadCount(0);
        setAnnouncements((prev) => prev.map((a) => ({ ...a, isRead: true })));
      }
    } catch (e) {
      console.error("Failed to mark all as read:", e);
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcementId: id }),
      });
      if (res.ok) {
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === id ? { ...a, isRead: true } : a))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (e) {
      console.error("Failed to mark announcement as read:", e);
    }
  };

  const handleLogout = async () => {
    await performLogout("/login");
  };

  const isAdmin = currentUser?.role === "admin";

  const getTypeStyle = (type: AnnouncementItem["type"]) => {
    switch (type) {
      case "URGENT":
        return {
          badge: "bg-rose-500 text-white",
          border: "border-rose-200 bg-rose-50/50",
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />,
          label: "Penting",
        };
      case "WARNING":
        return {
          badge: "bg-amber-500 text-white",
          border: "border-amber-200 bg-amber-50/50",
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />,
          label: "Perhatian",
        };
      case "SUCCESS":
        return {
          badge: "bg-emerald-500 text-white",
          border: "border-emerald-200 bg-emerald-50/50",
          icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />,
          label: "Promo / Info",
        };
      default:
        return {
          badge: "bg-blue-500 text-white",
          border: "border-blue-200 bg-blue-50/50",
          icon: <Info className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />,
          label: "Informasi",
        };
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const { toggleNav } = useMobileNav();

  return (
    <header className="navbar bg-base-100 border-b border-base-200 px-3 sm:px-6 h-16 shrink-0 sticky top-0 z-40 shadow-xs transition-colors">
      {/* Left side: Mobile Menu Button + Search & Status */}
      <div className="flex-1 flex items-center gap-2 sm:gap-4 min-w-0">
        {/* Mobile Hamburger Menu Button (Visible on mobile/tablet < 1024px) */}
        <button
          onClick={toggleNav}
          className="btn btn-ghost btn-circle btn-sm lg:hidden text-base-content/80 hover:bg-base-200 flex-shrink-0"
          aria-label="Buka Menu Navigasi"
          title="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="form-control hidden md:block w-56 lg:w-72">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari pesan, nomor, API key..."
              className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-base-200 border border-base-300 text-base-content placeholder:text-base-content/40 text-xs font-medium focus:bg-base-100 focus:outline-emerald-500 transition-all"
            />
            <Search className="w-4 h-4 absolute left-3 top-2 text-base-content/40" />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
          <span className="truncate">Gateway Online</span>
        </div>
      </div>

      {/* Right side: Quick Actions & Profile */}
      <div className="flex-none flex items-center gap-2 sm:gap-3">
        {/* Admin Support Tickets Notification Button */}
        {isAdmin && (
          <Link
            href="/admin/tickets"
            className="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-base-content relative"
            title={
              adminTicketUnreadCount > 0
                ? `${adminTicketUnreadCount} Tiket Bantuan Butuh Penanganan`
                : "Tiket Bantuan & CS"
            }
          >
            <div className="indicator">
              <Headphones className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {adminTicketUnreadCount > 0 && (
                <span className="badge badge-xs bg-rose-500 text-white border-white dark:border-slate-900 indicator-item font-extrabold text-[10px] px-1 h-4 min-w-4 flex items-center justify-center rounded-full animate-pulse shadow-xs">
                  {adminTicketUnreadCount > 9 ? "9+" : adminTicketUnreadCount}
                </span>
              )}
            </div>
          </Link>
        )}

        {/* Notifications */}
        <div className="dropdown dropdown-end">
          <button
            tabIndex={0}
            onClick={fetchAnnouncements}
            className="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-base-content relative"
            title="Notifikasi & Pengumuman"
          >
            <div className="indicator">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="badge badge-xs bg-rose-500 text-white border-white dark:border-slate-900 indicator-item font-bold text-[10px] px-1 h-4 min-w-4 flex items-center justify-center rounded-full">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
          </button>
          <div
            tabIndex={0}
            className="dropdown-content z-[50] card card-compact w-80 sm:w-96 p-0 shadow-2xl bg-base-100 border border-base-200 mt-3 rounded-2xl overflow-hidden"
          >
            <div className="p-3.5 border-b border-base-200 flex items-center justify-between bg-base-200/50">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-sm text-base-content">Pengumuman Sistem</h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full border border-rose-500/20">
                    {unreadCount} Baru
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Tandai Semua Dibaca
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-base-200 p-2 space-y-1.5">
              {announcements.length === 0 ? (
                <div className="p-6 text-center text-base-content/40">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-semibold">Belum ada pengumuman baru</p>
                  <p className="text-[11px] text-base-content/40 mt-0.5">Semua notifikasi sistem akan muncul di sini.</p>
                </div>
              ) : (
                announcements.map((item) => {
                  const style = getTypeStyle(item.type);
                  return (
                    <div
                      key={item.id}
                      onClick={() => !item.isRead && handleMarkSingleRead(item.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        item.isRead
                          ? "bg-base-100 border-base-200 opacity-80 hover:opacity-100 hover:bg-base-200/50"
                          : `${style.border} shadow-xs hover:shadow-sm`
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          {style.icon}
                          <span
                            className={`text-xs font-bold truncate ${
                              item.isRead ? "text-base-content/80" : "text-base-content font-extrabold"
                            }`}
                          >
                            {item.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {item.isPinned && (
                            <span className="text-amber-500" title="Disematkan">
                              <Pin className="w-3 h-3 fill-current" />
                            </span>
                          )}
                          {!item.isRead && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-base-content/70 mt-1.5 leading-relaxed font-normal whitespace-pre-line">
                        {item.message}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-base-200 text-[10px] text-base-content/50 font-medium">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${style.badge}`}>
                          {style.label}
                        </span>
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* User Profile Dropdown */}
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-sm gap-2 pl-2 pr-3.5 rounded-full border border-base-300 text-base-content font-bold bg-base-200/70 hover:bg-base-200"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold hidden md:inline text-base-content">
              {currentUser?.name || (isAdmin ? "Admin (Online)" : "User (Online)")}
            </span>
          </div>
          <ul
            tabIndex={0}
            className="menu dropdown-content z-[1] p-2 shadow-xl bg-base-100 rounded-2xl w-56 mt-3 border border-base-200 text-sm"
          >
            <li className="menu-title px-4 py-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-base-content/50 uppercase tracking-wider">ID USER</span>
                {isAdmin && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-primary/10 text-primary border border-primary/20">
                    ADMIN
                  </span>
                )}
              </div>
              <span
                className="font-mono text-[11px] font-bold text-base-content/80 bg-base-200 px-2.5 py-1 rounded-lg border border-base-300 mt-1 select-all truncate block"
                title={currentUser?.id || ""}
              >
                {currentUser?.id ? (currentUser.id.length > 18 ? `#${currentUser.id.slice(0, 14)}...` : `#${currentUser.id}`) : "#USR-ONLINE"}
              </span>
            </li>
            <div className="divider my-1"></div>
            <li>
              <Link
                href="/dashboard/settings"
                prefetch={true}
                className="flex items-center gap-2 font-medium text-base-content/80 hover:text-base-content"
              >
                <User className="w-4 h-4 text-base-content/60" /> Pengaturan Akun
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/billing"
                prefetch={true}
                className="flex items-center gap-2 font-medium text-base-content/80 hover:text-base-content"
              >
                <Zap className="w-4 h-4 text-amber-500" /> Upgrade Paket
              </Link>
            </li>
            {isAdmin && (
              <>
                <li>
                  <Link
                    href="/admin"
                    prefetch={true}
                    className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                  >
                    <ShieldCheck className="w-4 h-4" /> Admin Panel
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/account"
                    prefetch={true}
                    className="flex items-center gap-2 font-medium text-base-content/80 hover:text-base-content"
                  >
                    <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Akun Super Admin
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/settings"
                    prefetch={true}
                    className="flex items-center gap-2 font-medium text-base-content/80 hover:text-base-content"
                  >
                    <ShieldCheck className="w-4 h-4 text-base-content/60" /> Pengaturan Sistem
                  </Link>
                </li>
              </>
            )}
            <div className="divider my-1"></div>
            <li>
              <button
                onClick={handleLogout}
                className="text-rose-600 dark:text-rose-400 flex items-center gap-2 hover:bg-rose-500/10 font-bold"
              >
                <LogOut className="w-4 h-4" /> Keluar (Logout)
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
