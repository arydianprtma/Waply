"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Smartphone,
  Flame,
  Send,
  Radio,
  Users,
  FileText,
  ShieldBan,
  KeyRound,
  Webhook,
  Bot,
  CreditCard,
  Settings,
  Sparkles,
  LogOut,
  ShieldCheck,
  Code2,
  Lock,
  X,
} from "lucide-react";
import clsx from "clsx";

import { useUserSession } from "@/lib/use-user-session";
import { performLogout } from "@/lib/auth-logout";
import { SendoraLogo } from "@/components/brand/SendoraLogo";
import { PlanFeatureAccess } from "@/lib/billing-types";
import { useBillingPlan } from "@/lib/use-billing-plan";
import { useMobileNav } from "@/lib/mobile-nav-context";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  accessKey?: keyof PlanFeatureAccess;
  minPlanBadge?: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUserSession();
  const { isOpen, closeNav } = useMobileNav();
  const userRole = user?.role || (typeof document !== "undefined" ? document.cookie.match(/sendora_user_role=([^;]+)/)?.[1] : null);

  const { planAccess } = useBillingPlan();

  const handleLogout = async () => {
    await performLogout("/login");
  };

  const navigation: NavSection[] = [
    {
      items: [
        { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "WhatsApp",
      items: [
        { name: "Devices", href: "/dashboard/devices", icon: Smartphone, accessKey: "devices" },
        { name: "Warmup & Health", href: "/dashboard/devices/warmup", icon: Flame, badge: "Safety", accessKey: "warmupHealth", minPlanBadge: "Business" },
      ],
    },
    {
      title: "Messaging",
      items: [
        { name: "Broadcast", href: "/dashboard/broadcast", icon: Radio, badge: "Bulk", accessKey: "broadcast", minPlanBadge: "Starter" },
        { name: "Contacts & Groups", href: "/dashboard/contacts", icon: Users, accessKey: "contacts", minPlanBadge: "Starter" },
        { name: "Send Message", href: "/dashboard/messages/send", icon: Send, accessKey: "sendMessage" },
        { name: "Message Logs", href: "/dashboard/messages", icon: FileText, accessKey: "messageLogs" },
        { name: "Templates & Spintax", href: "/dashboard/templates", icon: Sparkles, accessKey: "templatesSpintax" },
        { name: "Blacklist / DND", href: "/dashboard/blacklist", icon: ShieldBan, accessKey: "blacklistDnd", minPlanBadge: "Starter" },
      ],
    },
    {
      title: "Developers & API",
      items: [
        { name: "API Docs", href: "/docs", icon: Code2, badge: "v1.0", accessKey: "apiDocs" },
        { name: "API Keys", href: "/dashboard/api-keys", icon: KeyRound, accessKey: "apiKeys" },
        { name: "Webhooks", href: "/dashboard/webhooks", icon: Webhook, accessKey: "webhooks" },
      ],
    },
    {
      title: "Automation",
      items: [
        { name: "Auto Reply Rules", href: "/dashboard/automation", icon: Bot, accessKey: "autoReply", minPlanBadge: "Starter" },
      ],
    },
    {
      title: "Account & Billing",
      items: [
        { name: "Subscription & Billing", href: "/dashboard/billing", icon: CreditCard },
        { name: "Settings", href: "/dashboard/settings", icon: Settings },
      ],
    },
    ...(userRole === "admin"
      ? [
          {
            title: "Administration",
            items: [
              { name: "Admin Panel", href: "/admin", icon: ShieldCheck, badge: "Admin" },
            ],
          },
        ]
      : []),
  ];

  const renderNavContent = (isMobile = false) => (
    <div className="flex flex-col h-full justify-between select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-base-200 flex items-center justify-between shrink-0">
        <SendoraLogo href="/dashboard" size="md" badge="v1.0" />
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
                const isLocked = Boolean(item.accessKey && planAccess[item.accessKey] === false);

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
                          : isLocked
                          ? "text-base-content/40 font-medium hover:bg-base-200 hover:text-base-content"
                          : "text-base-content/80 font-medium hover:bg-base-200 hover:text-base-content"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={clsx("w-4 h-4 flex-shrink-0", isLocked && !isActive ? "text-base-content/30" : "")} />
                        <span className="truncate">{item.name}</span>
                      </div>

                      {/* Locked or custom badge */}
                      {isLocked ? (
                        <span
                          className={clsx(
                            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold tracking-tight shadow-2xs shrink-0",
                            isActive
                              ? "bg-amber-400/30 text-amber-200 border border-amber-300/40"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          )}
                          title={`Fitur ${item.name} memerlukan paket ${item.minPlanBadge || "Starter"}`}
                        >
                          <Lock className="w-2.5 h-2.5 shrink-0" />
                          <span>{item.minPlanBadge || "Lock"}</span>
                        </span>
                      ) : item.badge ? (
                        <span
                          className={clsx(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide shrink-0",
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          )}
                        >
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer: Anti-Ban status & Quick Logout */}
      <div className="p-3 border-t border-base-200 space-y-2 bg-base-100 shrink-0">
        <div className="p-3 rounded-2xl bg-base-200/60 border border-base-300 text-xs">
          <div className="flex items-center justify-between font-bold text-base-content mb-1">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Anti-Ban Engine
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Active
            </span>
          </div>
          <p className="text-base-content/60 text-[11px] font-medium mt-1">
            Delay: 4-12s • Typing: On • Warmup: Safe
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition-colors cursor-pointer"
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
