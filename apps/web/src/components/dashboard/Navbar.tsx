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
  Moon,
  Sun,
  ShieldCheck,
  Zap,
  Megaphone,
  Info,
  AlertTriangle,
  CheckCircle,
  Pin,
  CheckCheck,
} from "lucide-react";

import { useUserSession } from "@/lib/use-user-session";
import { performLogout } from "@/lib/auth-logout";

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
  const [isDark, setIsDark] = useState(false);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
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

  useEffect(() => {
    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 60000); // Check every 60s
    return () => clearInterval(interval);
  }, [fetchAnnouncements]);

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

  const toggleTheme = () => {
    const nextTheme = isDark ? "sendoraLight" : "sendoraDark";
    document.documentElement.setAttribute("data-theme", nextTheme);
    setIsDark(!isDark);
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

  return (
    <header className="navbar bg-white border-b border-slate-200 px-6 h-16 shrink-0 sticky top-0 z-40 shadow-xs">
      {/* Left side: Search & Status */}
      <div className="flex-1 flex items-center gap-4">
        <div className="form-control hidden md:block w-72">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari pesan, nomor, API key..."
              className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs font-medium focus:bg-white focus:outline-emerald-500 transition-all"
            />
            <Search className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Gateway Online
        </div>
      </div>

      {/* Right side: Quick Actions & Profile */}
      <div className="flex-none flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="btn btn-ghost btn-circle btn-sm text-slate-600 hover:text-slate-900"
          title="Ganti Tema"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <div className="dropdown dropdown-end">
          <button
            tabIndex={0}
            onClick={fetchAnnouncements}
            className="btn btn-ghost btn-circle btn-sm text-slate-600 hover:text-slate-900 relative"
            title="Notifikasi & Pengumuman"
          >
            <div className="indicator">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="badge badge-xs bg-rose-500 text-white border-white indicator-item font-bold text-[10px] px-1 h-4 min-w-4 flex items-center justify-center rounded-full">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
          </button>
          <div
            tabIndex={0}
            className="dropdown-content z-[50] card card-compact w-80 sm:w-96 p-0 shadow-2xl bg-white border border-slate-200 mt-3 rounded-2xl overflow-hidden"
          >
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Pengumuman Sistem</h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] font-extrabold bg-rose-100 text-rose-700 rounded-full">
                    {unreadCount} Baru
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Tandai Semua Dibaca
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5">
              {announcements.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-semibold">Belum ada pengumuman baru</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Semua notifikasi sistem akan muncul di sini.</p>
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
                          ? "bg-white border-slate-100 opacity-80 hover:opacity-100 hover:bg-slate-50"
                          : `${style.border} shadow-xs hover:shadow-sm`
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          {style.icon}
                          <span
                            className={`text-xs font-bold truncate ${
                              item.isRead ? "text-slate-800" : "text-slate-950 font-extrabold"
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

                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-normal whitespace-pre-line">
                        {item.message}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100/60 text-[10px] text-slate-400 font-medium">
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
            className="btn btn-ghost btn-sm gap-2 pl-2 pr-3.5 rounded-full border border-slate-200 text-slate-800 font-bold bg-slate-50 hover:bg-slate-100"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold hidden md:inline text-slate-900">
              {currentUser?.name || (isAdmin ? "Admin (Online)" : "User (Online)")}
            </span>
          </div>
          <ul
            tabIndex={0}
            className="menu dropdown-content z-[1] p-2 shadow-xl bg-white rounded-2xl w-56 mt-3 border border-slate-200 text-sm"
          >
            <li className="menu-title px-4 py-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">ID USER</span>
                {isAdmin && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-primary/10 text-primary border border-primary/20">
                    ADMIN
                  </span>
                )}
              </div>
              <span
                className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200/80 mt-1 select-all truncate block"
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
                className="flex items-center gap-2 font-medium text-slate-700 hover:text-slate-900"
              >
                <User className="w-4 h-4 text-slate-500" /> Pengaturan Akun
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/billing"
                prefetch={true}
                className="flex items-center gap-2 font-medium text-slate-700 hover:text-slate-900"
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
                    className="flex items-center gap-2 font-bold text-emerald-700 hover:bg-emerald-50"
                  >
                    <ShieldCheck className="w-4 h-4" /> Admin Panel
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/account"
                    prefetch={true}
                    className="flex items-center gap-2 font-medium text-slate-700 hover:text-slate-900"
                  >
                    <User className="w-4 h-4 text-emerald-600" /> Akun Super Admin
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/settings"
                    prefetch={true}
                    className="flex items-center gap-2 font-medium text-slate-700 hover:text-slate-900"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-500" /> Pengaturan Sistem
                  </Link>
                </li>
              </>
            )}
            <div className="divider my-1"></div>
            <li>
              <button
                onClick={handleLogout}
                className="text-rose-600 flex items-center gap-2 hover:bg-rose-50 font-bold"
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
