"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Layers,
  Smartphone,
  MessageSquare,
  ScrollText,
  ChevronLeft,
  LogOut,
  Settings,
  UserCog,
  Megaphone,
  Ticket,
} from "lucide-react";
import clsx from "clsx";
import { performLogout } from "@/lib/auth-logout";
import { SendoraLogo } from "@/components/brand/SendoraLogo";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

export function AdminSidebar() {
  const pathname = usePathname();

  const navigation: NavSection[] = [
    {
      items: [
        { name: "Overview", href: "/admin", icon: LayoutDashboard },
      ],
    },
    {
      title: "SaaS & Pengguna",
      items: [
        { name: "Manajemen User", href: "/admin/users", icon: Users, badge: "Users" },
        { name: "Pengumuman", href: "/admin/announcements", icon: Megaphone, badge: "Broadcast" },
        { name: "Layanan & Paket", href: "/admin/plans", icon: Layers, badge: "Plans" },
        { name: "Voucher & Promo", href: "/admin/vouchers", icon: Ticket, badge: "Promo" },
      ],
    },
    {
      title: "Monitoring & Engine",
      items: [
        { name: "Devices & Health", href: "/admin/devices", icon: Smartphone, badge: "Live" },
        { name: "Messages", href: "/admin/messages", icon: MessageSquare },
        { name: "System Logs", href: "/admin/logs", icon: ScrollText },
      ],
    },
    {
      title: "Konfigurasi",
      items: [
        { name: "Akun Admin", href: "/admin/account", icon: UserCog },
        { name: "Pengaturan Sistem", href: "/admin/settings", icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-base-100 border-r border-base-200 flex flex-col h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
        <SendoraLogo href="/admin" size="md" badge="Admin" />
      </div>

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navigation.map((section, idx) => (
          <div key={idx}>
            {section.title && (
              <div className="px-3 mb-2 text-[11px] font-extrabold tracking-wider text-slate-500 uppercase">
                {section.title}
              </div>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      prefetch={true}
                      className={clsx(
                        "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all",
                        isActive
                          ? "bg-emerald-600 text-white shadow-sm font-bold"
                          : "text-slate-700 font-medium hover:bg-slate-100 hover:text-slate-950"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={clsx(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide",
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer: Admin status & Return to Dashboard */}
      <div className="p-3 border-t border-slate-200 space-y-2 bg-white">
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
          <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Admin Mode
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
              Super Admin
            </span>
          </div>
          <p className="text-slate-600 text-[11px] font-medium mt-1">
            Akses penuh kontrol & monitoring sistem
          </p>
        </div>

        <Link
          href="/dashboard"
          prefetch={true}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Kembali ke Dashboard
        </Link>

        <button
          onClick={() => performLogout("/login")}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors"
        >
          <LogOut className="w-4 h-4" /> Keluar (Logout)
        </button>
      </div>
    </aside>
  );
}
