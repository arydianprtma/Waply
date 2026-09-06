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
  MessageSquare,
  Sparkles,
  LogOut,
  ShieldCheck,
  Code2,
} from "lucide-react";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";

import { useState, useEffect } from "react";
import { useUserSession } from "@/lib/use-user-session";
import { performLogout } from "@/lib/auth-logout";
import { SendoraLogo } from "@/components/brand/SendoraLogo";

import { PlanFeatureAccess } from "@/lib/billing-types";
import { Lock } from "lucide-react";

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

import { useBillingPlan } from "@/lib/use-billing-plan";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUserSession();
  const userRole = user?.role || (typeof document !== "undefined" ? document.cookie.match(/sendora_user_role=([^;]+)/)?.[1] : null);

  const { planAccess, currentPlanName } = useBillingPlan();

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

  return (
    <aside className="w-64 bg-base-100 border-r border-base-200 flex flex-col h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
        <SendoraLogo href="/dashboard" size="md" badge="v1.0" />
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
                const isLocked = Boolean(item.accessKey && planAccess[item.accessKey] === false);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      prefetch={true}
                      className={clsx(
                        "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all",
                        isActive
                          ? "bg-emerald-600 text-white shadow-sm font-bold"
                          : isLocked
                          ? "text-slate-500 font-medium hover:bg-slate-100 hover:text-slate-800"
                          : "text-slate-700 font-medium hover:bg-slate-100 hover:text-slate-950"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={clsx("w-4 h-4 flex-shrink-0", isLocked && !isActive ? "text-slate-400" : "")} />
                        <span className="truncate">{item.name}</span>
                      </div>

                      {/* Locked or custom badge */}
                      {isLocked ? (
                        <span
                          className={clsx(
                            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold tracking-tight shadow-2xs shrink-0",
                            isActive
                              ? "bg-amber-400/30 text-amber-200 border border-amber-300/40"
                              : "bg-amber-50 text-amber-700 border border-amber-200/80"
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
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
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
      <div className="p-3 border-t border-slate-200 space-y-2 bg-white">
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
          <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Anti-Ban Engine
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active
            </span>
          </div>
          <p className="text-slate-600 text-[11px] font-medium mt-1">
            Delay: 4-12s • Typing: On • Warmup: Safe
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors"
        >
          <LogOut className="w-4 h-4" /> Keluar (Logout)
        </button>
      </div>
    </aside>
  );
}
