import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import { getStoredMessages } from "@/lib/messages";
import { getTemplates } from "@/lib/templates";
import { getAllUserDeviceRecords } from "@/lib/user-devices";
import { getAllManagedUsers } from "@/lib/admin-users";
import { getAllTickets, getUserTickets } from "@/lib/support-tickets";
import { getAllPlans } from "@/lib/billing";
import { getAllKnowledge } from "@/lib/ai-knowledge";

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  category:
    | "Navigasi"
    | "Pesan & Log"
    | "WhatsApp Device"
    | "Template & Spintax"
    | "Admin & Users"
    | "Tiket Support"
    | "Dokumentasi & API";
  url: string;
  badge?: string;
}

const USER_NAV_ITEMS = [
  { id: "nav-dash", title: "Dashboard Overview", subtitle: "Ringkasan statistik, kuota pesan, dan status device", url: "/dashboard", category: "Navigasi" as const },
  { id: "nav-dev", title: "WhatsApp Devices", subtitle: "Kelola koneksi nomor WhatsApp, scan QR, dan auto-rotate", url: "/dashboard/devices", category: "Navigasi" as const },
  { id: "nav-send", title: "Kirim Pesan Manual", subtitle: "Kirim pesan teks, gambar, PDF, dan dokumen via WhatsApp", url: "/dashboard/send", category: "Navigasi" as const },
  { id: "nav-logs", title: "Riwayat Pesan (Message Logs)", subtitle: "Daftar pesan terkirim, pending, status centang, dan log error", url: "/dashboard/logs", category: "Navigasi" as const },
  { id: "nav-tpl", title: "Templates & Spintax", subtitle: "Pustaka template pesan dan generator variasi kata spintax", url: "/dashboard/templates", category: "Navigasi" as const },
  { id: "nav-bcast", title: "Broadcast & Kampanye Massal", subtitle: "Kirim pesan massal terjadwal dengan perlindungan anti-banned", url: "/dashboard/broadcast", category: "Navigasi" as const },
  { id: "nav-contacts", title: "Manajemen Kontak & Grup", subtitle: "Daftar kontak penerima, import CSV, dan pengelompokan grup", url: "/dashboard/contacts", category: "Navigasi" as const },
  { id: "nav-autoreply", title: "Auto-Reply & Chatbot Bot", subtitle: "Aturan balasan otomatis berdasarkan kata kunci pesan masuk", url: "/dashboard/autoreply", category: "Navigasi" as const },
  { id: "nav-blacklist", title: "Blacklist & DND Protection", subtitle: "Blokir nomor telepon dari broadcast dan auto-reply", url: "/dashboard/blacklist", category: "Navigasi" as const },
  { id: "nav-warmup", title: "Device Warmup & Anti-Ban", subtitle: "Panduan dan automasi pemanasan kuota harian nomor baru", url: "/dashboard/devices/warmup", category: "Navigasi" as const },
  { id: "nav-api", title: "API Keys & Developer", subtitle: "Buat token API Key Bearer untuk integrasi backend", url: "/dashboard/api-keys", category: "Dokumentasi & API" as const },
  { id: "nav-webhooks", title: "Inbound Webhooks", subtitle: "Konfigurasi URL callback penerima pesan masuk real-time", url: "/dashboard/webhooks", category: "Dokumentasi & API" as const },
  { id: "nav-docs", title: "Dokumentasi API & SDK", subtitle: "Panduan endpoint REST API, SDK Node.js, Laravel, Python, Flutter", url: "/docs", category: "Dokumentasi & API" as const },
  { id: "nav-billing", title: "Langganan & Billing", subtitle: "Upgrade paket kuota chat, invoice, dan riwayat pembayaran", url: "/dashboard/billing", category: "Navigasi" as const },
  { id: "nav-support", title: "Bantuan & Tiket CS", subtitle: "Ajukan tiket bantuan dan chat langsung dengan AI Support", url: "/dashboard/support", category: "Tiket Support" as const },
  { id: "nav-account", title: "Pengaturan Akun", subtitle: "Kelola profil, ubah password, dan preferensi akun", url: "/dashboard/account", category: "Navigasi" as const },
];

const ADMIN_NAV_ITEMS = [
  { id: "adm-dash", title: "Admin Dashboard", subtitle: "Ringkasan analitik seluruh platform dan trafik gateway", url: "/admin", category: "Navigasi" as const, badge: "Admin" },
  { id: "adm-users", title: "Manajemen Pengguna (Users)", subtitle: "Daftar semua user terdaftar, assign paket, suspend, dan deteksi IP spam", url: "/admin/users", category: "Admin & Users" as const, badge: "Admin" },
  { id: "adm-plans", title: "Kelola Paket & Harga (Plans)", subtitle: "Atur harga, batas kuota chat harian/bulanan, dan diskon promo", url: "/admin/plans", category: "Admin & Users" as const, badge: "Admin" },
  { id: "adm-vouchers", title: "Kupon & Voucher Diskon", subtitle: "Buat kode voucher promo potongan harga checkout", url: "/admin/vouchers", category: "Admin & Users" as const, badge: "Admin" },
  { id: "adm-tickets", title: "Tiket Bantuan & CS Masuk", subtitle: "Balas tiket support pengguna, eskalasi agen, dan resolusi kendala", url: "/admin/tickets", category: "Tiket Support" as const, badge: "Admin" },
  { id: "adm-ai-kb", title: "AI Knowledge Base & Learning", subtitle: "Kelola basis pengetahuan AI bot untuk auto-reply tiket", url: "/admin/ai-knowledge", category: "Admin & Users" as const, badge: "Admin" },
  { id: "adm-ann", title: "Pengumuman & Broadcast Notifikasi", subtitle: "Kirim banner pengumuman global atau popup modal ke user", url: "/admin/announcements", category: "Admin & Users" as const, badge: "Admin" },
  { id: "adm-telemetry", title: "Monitoring Webhook & Telemetri", subtitle: "Pantau pengiriman webhook event, rate limit, dan kegagalan endpoint", url: "/admin/telemetry", category: "Admin & Users" as const, badge: "Admin" },
  { id: "adm-audit", title: "Audit Log & Keamanan Sistem", subtitle: "Riwayat aktivitas sensitif, login IP, dan perubahan admin", url: "/admin/audit-logs", category: "Admin & Users" as const, badge: "Admin" },
  { id: "adm-account", title: "Profil & Akun Admin", subtitle: "Pengaturan akun administrator", url: "/admin/account", category: "Admin & Users" as const, badge: "Admin" },
];

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim().toLowerCase();

    if (!query) {
      // Return top quick shortcuts when search is empty
      const defaultResults: SearchResultItem[] = user.role === "admin"
        ? [...ADMIN_NAV_ITEMS.slice(0, 4), ...USER_NAV_ITEMS.slice(0, 4)]
        : USER_NAV_ITEMS.slice(0, 6);
      return NextResponse.json({ success: true, results: defaultResults });
    }

    const results: SearchResultItem[] = [];

    // 1. Match Navigation Items
    const navPool = user.role === "admin" ? [...ADMIN_NAV_ITEMS, ...USER_NAV_ITEMS] : USER_NAV_ITEMS;
    for (const item of navPool) {
      if (
        item.title.toLowerCase().includes(query) ||
        item.subtitle?.toLowerCase().includes(query) ||
        item.url.toLowerCase().includes(query)
      ) {
        results.push(item);
      }
    }

    // 2. Search User Devices
    try {
      const allDevs = getAllUserDeviceRecords();
      for (const [devId, dev] of Object.entries(allDevs)) {
        if (user.role === "admin" || dev.userId === user.id || dev.userEmail === user.email) {
          if (
            devId.toLowerCase().includes(query) ||
            dev.name?.toLowerCase().includes(query) ||
            dev.userEmail?.toLowerCase().includes(query)
          ) {
            results.push({
              id: `dev-${devId}`,
              title: `Device: ${dev.name || devId}`,
              subtitle: `Session ID: ${devId}${user.role === "admin" && dev.userEmail ? ` • User: ${dev.userEmail}` : ""}`,
              category: "WhatsApp Device",
              url: "/dashboard/devices",
              badge: "Device",
            });
          }
        }
      }
    } catch {}

    // 3. Search Templates
    try {
      const templates = getTemplates(user.id);
      for (const tpl of templates) {
        if (
          tpl.name.toLowerCase().includes(query) ||
          tpl.shortcode.toLowerCase().includes(query) ||
          tpl.content.toLowerCase().includes(query)
        ) {
          results.push({
            id: `tpl-${tpl.id}`,
            title: `Template: ${tpl.name}`,
            subtitle: `Shortcode: ${tpl.shortcode} • "${tpl.content.slice(0, 60)}..."`,
            category: "Template & Spintax",
            url: "/dashboard/templates",
            badge: tpl.category,
          });
        }
      }
    } catch {}

    // 4. Search Message Logs (Sent / Failed Messages)
    try {
      const messages = getStoredMessages(user.role === "admin" ? undefined : user.id);
      for (const msg of messages.slice(-100).reverse()) {
        const dest = (msg.to || msg.recipient || "").toLowerCase();
        const body = (msg.content || "").toLowerCase();
        if (dest.includes(query) || body.includes(query) || msg.id.toLowerCase().includes(query)) {
          results.push({
            id: `msg-${msg.id}`,
            title: `Pesan ke ${msg.to || msg.recipient || "Tujuan"}`,
            subtitle: `Status: ${msg.status} • "${(msg.content || "").slice(0, 65)}..."`,
            category: "Pesan & Log",
            url: "/dashboard/logs",
            badge: msg.status,
          });
          if (results.filter((r) => r.category === "Pesan & Log").length >= 5) break;
        }
      }
    } catch {}

    // 5. Search Support Tickets
    try {
      const tickets = user.role === "admin" ? getAllTickets() : getUserTickets(user.id, user.email);
      for (const t of tickets) {
        if (
          t.subject.toLowerCase().includes(query) ||
          t.id.toLowerCase().includes(query) ||
          t.userEmail?.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query)
        ) {
          results.push({
            id: `tkt-${t.id}`,
            title: `Tiket: ${t.subject}`,
            subtitle: `Status: ${t.status} • Kategori: ${t.category} • ID: ${t.id}`,
            category: "Tiket Support",
            url: user.role === "admin" ? "/admin/tickets" : "/dashboard/support",
            badge: t.status,
          });
        }
      }
    } catch {}

    // 6. If Admin, Search Users & Plans & AI KB
    if (user.role === "admin") {
      try {
        const managedUsers = getAllManagedUsers();
        for (const u of managedUsers) {
          if (
            u.name.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query) ||
            u.planId.toLowerCase().includes(query) ||
            u.id.toLowerCase().includes(query)
          ) {
            results.push({
              id: `user-${u.id}`,
              title: `User: ${u.name || u.email}`,
              subtitle: `${u.email} • Paket: ${u.planId} (${u.status})`,
              category: "Admin & Users",
              url: "/admin/users",
              badge: u.role === "admin" ? "Super Admin" : "User",
            });
          }
        }
      } catch {}

      try {
        const plans = Object.values(getAllPlans());
        for (const p of plans) {
          if (p.name.toLowerCase().includes(query) || p.id.toLowerCase().includes(query)) {
            results.push({
              id: `plan-${p.id}`,
              title: `Paket: ${p.name}`,
              subtitle: `Rp ${p.price.toLocaleString("id-ID")} • Kuota: ${p.monthlyMessages.toLocaleString("id-ID")} pesan • Devices: ${p.maxDevices}`,
              category: "Admin & Users",
              url: "/admin/plans",
              badge: "Plan",
            });
          }
        }
      } catch {}

      try {
        const kbItems = getAllKnowledge();
        for (const kb of kbItems) {
          if (
            kb.title.toLowerCase().includes(query) ||
            kb.problemDescription.toLowerCase().includes(query) ||
            kb.keywords.some((k: string) => k.toLowerCase().includes(query))
          ) {
            results.push({
              id: `kb-${kb.id}`,
              title: `AI KB: ${kb.title}`,
              subtitle: kb.problemDescription,
              category: "Admin & Users",
              url: `/admin/ai-knowledge`,
              badge: kb.category,
            });
          }
        }
      } catch {}
    }

    return NextResponse.json({ success: true, results: results.slice(0, 15) });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
