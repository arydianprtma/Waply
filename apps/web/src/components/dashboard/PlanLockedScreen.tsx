"use client";

import React from "react";
import Link from "next/link";
import {
  Lock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Zap,
  CreditCard,
  Flame,
  Radio,
  Users,
  Bot,
  KeyRound,
  Webhook,
  ScrollText,
} from "lucide-react";
import { PlanFeatureAccess, FEATURE_ACCESS_LABELS } from "@/lib/billing-types";
import { useBillingPlan } from "@/lib/use-billing-plan";

interface PlanLockedScreenProps {
  featureKey: keyof PlanFeatureAccess;
  featureTitle?: string;
  description?: string;
}

const FEATURE_META: Partial<
  Record<
    keyof PlanFeatureAccess,
    {
      icon: React.ElementType;
      title: string;
      description: string;
      benefits: string[];
      suggestedMinPlan: string;
    }
  >
> = {
  broadcast: {
    icon: Radio,
    title: "Broadcast / Blast Pesan Massal",
    description:
      "Kirim pesan kampanye promosi dan pengumuman massal ke ribuan kontak sekaligus dengan batch delay otomatis dan anti-ban protection.",
    benefits: [
      "Pengiriman pesan massal berjadwal tanpa batas kontak",
      "Variasi pesan dinamis dengan Spintax & Personalisasi Nama",
      "Auto-pause & delay cerdas untuk mencegah banned",
      "Statistik real-time pesan terkirim, pending, dan gagal",
    ],
    suggestedMinPlan: "STARTER",
  },
  autoReply: {
    icon: Bot,
    title: "Bot Auto Reply & Keyword Trigger",
    description:
      "Otomatisasi balasan chat customer 24/7 menggunakan kecerdasan keyword matcher, exact match, dan regex trigger.",
    benefits: [
      "Respon instan 24 jam untuk CS dan FAQ pelanggan",
      "Mendukung variabel dinamis dan format multi-line",
      "Simulasi human typing delay sebelum pesan dikirim",
      "Riwayat eksekusi bot tercatat rapi di log sistem",
    ],
    suggestedMinPlan: "STARTER",
  },
  contacts: {
    icon: Users,
    title: "Manajemen Kontak & Grup Pelanggan",
    description:
      "Kelola ribuan nomor kontak customer, segmentasikan berdasarkan label/grup, dan import dari CSV/Excel dengan sekali klik.",
    benefits: [
      "Import batch kontak tak terbatas dari file CSV / Excel",
      "Segmentasi daftar kontak berdasarkan kategori / grup",
      "Sinkronisasi langsung dengan kampanye broadcast",
    ],
    suggestedMinPlan: "STARTER",
  },
  blacklistDnd: {
    icon: ShieldCheck,
    title: "Blacklist & DND (Do Not Disturb)",
    description:
      "Lindungi reputasi nomor WhatsApp Anda dengan memblokir nomor sensitif atau nomor yang meminta berhenti berlangganan.",
    benefits: [
      "Proteksi nomor otomatis dari pengiriman broadcast",
      "Pencegahan komplain spam dari customer",
      "Daftar nomor opt-out sinkron di semua device",
    ],
    suggestedMinPlan: "STARTER",
  },
  warmupHealth: {
    icon: Flame,
    title: "Warmup Protokol & Anti-Ban Safety",
    description:
      "Protokol pemanasan nomor WhatsApp bertahap untuk membangun reputasi socket nomor baru agar terhindar dari pemblokiran.",
    benefits: [
      "Penyesuaian limit kirim harian secara bertahap (Stage Warmup)",
      "Circuit breaker otomatis saat terdeteksi anomali disconnect",
      "Simulasi interaksi alami manusia",
    ],
    suggestedMinPlan: "BUSINESS",
  },
  apiKeys: {
    icon: KeyRound,
    title: "API Keys Developer",
    description:
      "Integrasikan REST API Waply ke aplikasi web, sistem kasir (POS), CRM, atau backend kustom Anda dengan token aman.",
    benefits: [
      "Pembuatan multiple API Key dengan izin terspesifikasi",
      "Akses penuh ke semua endpoint kirim pesan dan template",
      "Rate limit tinggi & pemantauan penggunaan kuota API",
    ],
    suggestedMinPlan: "STARTER",
  },
  webhooks: {
    icon: Webhook,
    title: "Webhook Integration & Realtime Events",
    description:
      "Terima notifikasi instan (HTTP POST) saat ada pesan masuk, pesan terkirim, status terbaca, atau status koneksi WhatsApp.",
    benefits: [
      "Pengiriman event real-time (message.received, message.delivered, etc.)",
      "Verifikasi HMAC SHA-256 signature yang aman",
      "Auto-retry jika server endpoint Anda sedang down",
    ],
    suggestedMinPlan: "STARTER",
  },
  systemLogs: {
    icon: ScrollText,
    title: "System & Activity Logs",
    description:
      "Audit jejak eksekusi webhook, respons bot, pengiriman broadcast, dan status antrean pesan secara lengkap.",
    benefits: [
      "Pelacakan error detail dan kode status HTTP",
      "Payload inspeksi untuk kemudahan debugging developer",
      "Filter multi-kategori dan pencarian cepat",
    ],
    suggestedMinPlan: "STARTER",
  },
  devices: {
    icon: Zap,
    title: "Koneksi WhatsApp Devices",
    description: "Hubungkan nomor WhatsApp untuk mengirim dan menerima pesan secara otomatis.",
    benefits: [
      "Koneksi socket stabil multi-device",
      "Rotasi otomatis antar device (Auto-Rotate)",
    ],
    suggestedMinPlan: "STARTER",
  },
  sendMessage: {
    icon: Zap,
    title: "Send Message",
    description: "Kirim pesan WhatsApp langsung.",
    benefits: ["Pengiriman pesan instan"],
    suggestedMinPlan: "STARTER",
  },
  messageLogs: {
    icon: Zap,
    title: "Message Logs",
    description: "Riwayat pesan masuk dan keluar.",
    benefits: ["Riwayat pengiriman lengkap"],
    suggestedMinPlan: "STARTER",
  },
  templatesSpintax: {
    icon: Sparkles,
    title: "Templates & Spintax",
    description: "Pustaka template pesan dan generator spintax dinamis.",
    benefits: ["Template shortcode reusable", "Variasi kata acak spintax"],
    suggestedMinPlan: "STARTER",
  },
  apiDocs: {
    icon: Zap,
    title: "API Documentation",
    description: "Dokumentasi REST API lengkap.",
    benefits: ["Panduan integrasi multi-bahasa"],
    suggestedMinPlan: "STARTER",
  },
};

export function PlanLockedScreen({
  featureKey,
  featureTitle,
  description,
}: PlanLockedScreenProps) {
  const { currentPlanName, getRecommendedUpgradePlan } = useBillingPlan();
  const meta = FEATURE_META[featureKey] || {
    icon: Lock,
    title: featureTitle || FEATURE_ACCESS_LABELS[featureKey] || "Fitur Terkunci",
    description:
      description ||
      "Fitur ini belum termasuk dalam paket langganan aktif Anda saat ini. Tingkatkan paket langganan Anda untuk menikmati fitur ini.",
    benefits: ["Akses penuh tanpa batasan fitur", "Dukungan prioritas dari tim teknis"],
    suggestedMinPlan: "STARTER",
  };

  const Icon = meta.icon;
  const recommendedPlan = getRecommendedUpgradePlan ? getRecommendedUpgradePlan(featureKey) : null;
  const targetPlanName = recommendedPlan?.name || meta.suggestedMinPlan;

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full card bg-base-100 border border-base-200 shadow-xl rounded-3xl p-6 sm:p-10 text-center relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-primary/10 blur-3xl pointer-events-none" />

        {/* Lock Icon Badge */}
        <div className="relative mx-auto mb-6 w-20 h-20 rounded-3xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shadow-inner">
          <Icon className="w-9 h-9" />
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center border-2 border-white shadow-xs">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Title & Description */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Fitur Premium • Paket {targetPlanName}</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {meta.title}
        </h2>

        <p className="text-sm text-base-content/70 max-w-lg mx-auto mt-2 leading-relaxed">
          {meta.description}
        </p>

        {/* Benefits Box */}
        <div className="my-8 text-left bg-base-200/50 rounded-2xl p-5 border border-base-300">
          <p className="text-xs font-bold text-base-content/70 uppercase tracking-wider mb-3">
            Keuntungan Membuka Fitur Ini:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {meta.benefits.map((benefit, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Current Plan Indicator & CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard/billing"
            className="btn btn-primary btn-md w-full sm:w-auto px-7 rounded-xl font-bold gap-2 shadow-sm text-white"
          >
            <CreditCard className="w-4 h-4" />
            Upgrade ke Paket {targetPlanName}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>

          <Link
            href="/dashboard"
            className="btn btn-ghost btn-md w-full sm:w-auto rounded-xl text-base-content/60"
          >
            Kembali ke Overview
          </Link>
        </div>

        <p className="text-[11px] text-base-content/40 mt-5">
          Paket Anda saat ini: <strong className="text-slate-700 font-semibold">{currentPlanName}</strong>. Upgrade instan aktif otomatis.
        </p>
      </div>
    </div>
  );
}
