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
  Headphones,
  X,
} from "lucide-react";
import clsx from "clsx";
import { performLogout } from "@/lib/auth-logout";
import { SendoraLogo } from "@/components/brand/SendoraLogo";
import { useMobileNav } from "@/lib/mobile-nav-context";

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
  const { isOpen, closeNav } = useMobileNav();

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
        { name: "Tiket Bantuan & CS", href: "/admin/tickets", icon: Headphones, badge: "CS" },
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

  const renderNavContent = (isMobile = false) => (
    <div className="flex flex-col h-full justify-between select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-base-200 flex items-center justify-between shrink-0">
        <SendoraLogo href="/admin" size="md" badge="Admin" />
        {isMobile && (
          <button
            onClick={closeNav}
            className="btn btn-ghost btn-circle btn-sm text-base-content/60 hover:bg-base-200 lg:hidden"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navigation.map((section, idx) => (
          <div key={idx}>
            {section.title && (
              <div className="px-3 mb-2 text-[11px] font-extrabold tracking-wider text-base-content/50 uppercase">
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
                      onClick={isMobile ? closeNav : undefined}
                      className={clsx(
                        "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all",
                        isActive
                          ? "bg-emerald-600 text-white shadow-sm font-bold"
                          : "text-base-content/80 font-medium hover:bg-base-200 hover:text-base-content"
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
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
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
      <div className="p-3 border-t border-base-200 space-y-2 bg-base-100 shrink-0">
        <div className="p-3 rounded-2xl bg-base-200/60 border border-base-300 text-xs">
          <div className="flex items-center justify-between font-bold text-base-content mb-1">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Admin Mode
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
              Super Admin
            </span>
          </div>
          <p className="text-base-content/60 text-[11px] font-medium mt-1">
            Akses penuh kontrol & monitoring sistem
          </p>
        </div>

        <Link
          href="/dashboard"
          prefetch={true}
          onClick={isMobile ? closeNav : undefined}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-base-200 hover:bg-base-300 text-base-content text-xs font-bold transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Kembali ke Dashboard
        </Link>

        <button
          onClick={() => performLogout("/login")}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" /> Keluar (Logout)
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent on lg screens) */}
      <aside className="hidden lg:flex flex-col w-64 bg-base-100 border-r border-base-200 h-screen sticky top-0 shrink-0">
        {renderNavContent(false)}
      </aside>

      {/* Mobile / Tablet Off-Canvas Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden animate-in fade-in duration-200">
          {/* Backdrop with blur */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={closeNav}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="fixed top-0 left-0 bottom-0 w-[280px] sm:w-80 bg-base-100 shadow-2xl z-50 border-r border-base-200 animate-in slide-in-from-left duration-300 flex flex-col">
            {renderNavContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
