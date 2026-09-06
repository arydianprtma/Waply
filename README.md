<div align="center">

# 🚀 Sendora - WhatsApp Gateway & Messaging API

**Solusi Cloud WhatsApp Gateway, REST API, Broadcast & Automasi Pesan Modern untuk Bisnis.**

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Baileys](https://img.shields.io/badge/Baileys-WhatsApp_Engine-25D366?style=flat-square&logo=whatsapp)](https://github.com/WhiskeySockets/Baileys)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[Fitur Utama](#-fitur-utama) • [Struktur Proyek](#-struktur-arsitektur-proyek) • [Panduan Instalasi](#-panduan-instalasi--menjalankan) • [Dokumentasi API](#-dokumentasi-singkat-rest-api) • [Variabel Environment](#-variabel-environment)

---

</div>

## 📌 Tentang Sendora

**Sendora** adalah platform WhatsApp Gateway *all-in-one* yang memungkinkan integrasi pengiriman pesan WhatsApp secara otomatis ke dalam aplikasi, website, bot, atau sistem CRM Anda. Dilengkapi dengan dashboard manajemen modern, panel admin lengkap, billing payment gateway Midtrans, dan sistem anti-ban cerdas.

---

## ✨ Fitur Utama

### 📱 1. WhatsApp Multi-Device & Gateway Engine
* **Koneksi QR Code & Pairing Code:** Hubungkan nomor WhatsApp bisnis Anda secara instan dalam hitungan detik.
* **Auto-Reconnect & Session Persistence:** Sesi tetap aman tersimpan dan otomatis tersambung kembali saat server restart.
* **Smart Device Rotation:** Kirim pesan bergantian antar beberapa nomor WhatsApp secara otomatis untuk menghindari batas limit.
* **Warmup & Anti-Ban Safety:** Algoritma pengatur jeda pengiriman (throttling), *human typing simulation*, dan *safety score* untuk menjaga nomor tetap aman.

### 💬 2. Messaging & Broadcast Tools
* **Broadcast / Blast Massal:** Kirim pesan ke ratusan hingga ribuan kontak dengan status pengiriman real-time (Pending, Sent, Delivered, Read, Failed).
* **Format Spintax Dinamis:** Dukungan variasi kata `{Halo|Hai|Selamat siang}` untuk mencegah deteksi pesan berulang.
* **Placeholder Variabel:** Kustomisasi pesan otomatis dengan variabel pelanggan seperti `{{name}}`, `{{order_id}}`, `{{total}}`, dll.
* **Contacts & Group Management:** Kelola daftar kontak, segmentasi grup, dan fitur import/export file CSV/Excel.
* **Blacklist & DND Protection:** Lindungi nomor tertentu agar tidak menerima pesan broadcast otomatis.

### 🤖 3. Automasi & Bot
* **Keyword Auto Reply:** Respon pesan masuk otomatis berdasarkan kata kunci (*Exact Match* atau *Contains*).
* **Riwayat & Log Pesan Masuk:** Pantau seluruh pesan masuk (*inbound*) dan pesan keluar (*outbound*) secara transparan.

### 🔌 4. Developers & REST API
* **REST API v1:** Endpoint lengkap untuk mengirim pesan teks, gambar, dokumen, dan media lainnya.
* **Autentikasi API Key SHA-256:** Kunci API aman dengan prefix `snd_live_`.
* **Inbound Webhooks:** Menerima event pesan masuk (`message.received`), status pesan terkirim (`message.delivered`), dan status koneksi perangkat secara real-time dengan verifikasi tanda tangan HMAC-SHA256.
* **Interactive API Playground:** Uji coba endpoint API langsung dari dashboard pengguna.

### 💳 5. Billing, Voucher & Manajemen Langganan
* **Integrasi Midtrans Core API & Snap:** Pembayaran otomatis via QRIS Nasional, Virtual Account (BCA, Mandiri, BRI, BNI), dan GoPay.
* **Sistem Voucher & Promo:** Buat dan kelola kode promo diskon persentase (%) atau potongan tetap (Rp) dengan batasan kuota pemakaian dan masa berlaku.
* **Email Notifikasi Transaksional (Nodemailer / SMTP):** Pengiriman otomatis tagihan invoice, kwitansi pembayaran resmi, dan link pemulihan password berdesain elegan.
* **1-Step Checkout & Auto-Registration:** Tamu yang melakukan checkout paket otomatis dibuatkan akun dan langsung login setelah pembayaran.

### 🛡️ 6. Super Admin Control Panel
* **Manajemen Pengguna:** Pantau, aktifkan, nonaktifkan, atau blokir pengguna.
* **Pengaturan Paket Layanan:** Kelola harga, batas kuota pesan, batas jumlah device WhatsApp, dan hak akses fitur per paket.
* **Pusat Pengumuman (Announcements):** Buat banner pengumuman pemeliharaan atau info penting untuk seluruh pengguna.

---

## 📁 Struktur Arsitektur Proyek

Proyek ini dibangun menggunakan arsitektur **Monorepo**:

```text
WhatsApp-Gateway/
├── apps/
│   ├── web/                     # Frontend Next.js 15 (App Router, Tailwind CSS, DaisyUI)
│   │   ├── src/
│   │   │   ├── app/             # Halaman Web, Dashboard, Admin, API Routes
│   │   │   ├── components/      # Komponen UI Reusable
│   │   │   └── lib/             # Service Email, Auth, Billing, Webhooks, Vouchers
│   │   └── package.json
│   │
│   └── gateway/                 # WhatsApp Gateway Service (@whiskeysockets/baileys)
│       ├── src/
│       │   ├── routes/          # Express REST API Gateway (Session & Message)
│       │   ├── services/        # Baileys Engine, Session Manager, Safety Engine
│       │   └── utils/           # Spintax Parser, Logger
│       └── package.json
│
├── packages/
│   └── database/                # Prisma ORM & Database Schema
│       ├── prisma/
│       │   └── schema.prisma    # Schema Model (User, Device, Message, ApiKey, dll)
│       └── src/
│
├── .env.example                 # Template Variabel Environment
├── .gitignore                   # Aturan Pengabaian File Sensitif
├── docker-compose.yml           # Konfigurasi Deployment Docker
├── ecosystem.config.js          # Konfigurasi Process Manager PM2
├── package.json                 # Root Workspace Scripts
└── README.md                    # Dokumentasi Proyek
```

---

## 🛠️ Panduan Instalasi & Menjalankan

### Prasyarat
* **Node.js** versi 18.x atau lebih baru
* **npm** atau **pnpm** / **yarn**

### 1. Clone Repositori
```bash
git clone https://github.com/arydianprtma/WhatsApp-Gateway.git
cd WhatsApp-Gateway
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Konfigurasi Environment
Salin file template `.env.example` menjadi `.env.local` pada `apps/web` (atau di root):
```bash
cp .env.example apps/web/.env.local
```
Sesuaikan konfigurasi seperti port, kunci Midtrans, dan kredensial SMTP email Anda.

### 4. Menjalankan di Mode Development
Jalankan seluruh layanan secara bersamaan:
```bash
npm run dev
```
Atau jalankan masing-masing service secara terpisah:
* **Web Dashboard & API:** `npm run dev:web` (Port `3001`)
* **WhatsApp Gateway:** `npm run dev:gateway` (Port `3002`)

Buka browser Anda di `http://localhost:3001` untuk mengakses dashboard Sendora.

---

## 🔑 Dokumentasi Singkat REST API

### Kirim Pesan WhatsApp

**Endpoint:** `POST /api/v1/messages/send`

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer snd_live_YOUR_API_KEY
```

**Payload Request (JSON):**
```json
{
  "to": "6281234567890",
  "message": "{Halo|Hai} {{name}}, pesanan Anda {{order_id}} telah berhasil dikonfirmasi!",
  "deviceId": "auto_rotate",
  "variables": {
    "name": "Budi Santoso",
    "order_id": "INV-2026-001"
  }
}
```

**Contoh Response Sukses (JSON):**
```json
{
  "success": true,
  "messageId": "msg_1741289102",
  "status": "SENT",
  "recipient": "6281234567890",
  "deviceId": "dev_acc_01"
}
```

---

## ⚙️ Variabel Environment

| Variabel | Deskripsi | Default / Contoh |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | URL domain frontend web dashboard | `http://localhost:3001` |
| `GATEWAY_URL` | URL internal service WhatsApp Gateway | `http://localhost:3002` |
| `NEXT_PUBLIC_SUPABASE_URL` | *(Opsional)* URL Project Supabase | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(Opsional)* Anon Key Supabase | `your-anon-key` |
| `MIDTRANS_SERVER_KEY` | Server Key Midtrans Payment Gateway | `SB-Mid-server-xxxx` |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | Client Key Midtrans | `SB-Mid-client-xxxx` |
| `MIDTRANS_IS_PRODUCTION` | Mode Sandbox (`false`) / Production (`true`) | `false` |
| `SMTP_HOST` | Host SMTP mail server | `smtp.gmail.com` |
| `SMTP_PORT` | Port SMTP (465 SSL / 587 TLS) | `465` |
| `SMTP_USER` | Email pengirim SMTP | `admin@bisnis.id` |
| `SMTP_PASS` | Password / App Password email SMTP | `xxxx-xxxx-xxxx-xxxx` |
| `SMTP_FROM` | Nama & alamat pengirim email | `"Sendora Gateway" <no-reply@bisnis.id>` |

---

## 🔒 Keamanan & Praktik Terbaik

1. **Jangan pernah meng-commit file `.env`** atau kredensial nyata ke repositori publik.
2. **Gunakan App Password** saat menggunakan Gmail SMTP untuk keamanan akun email.
3. **Simpan Secret Key Webhook** secara aman dan selalu verifikasi signature pada endpoint webhook Anda.
4. **Gunakan jeda pengiriman (delay)** yang wajar pada pengiriman broadcast massal guna menjaga reputasi nomor WhatsApp.

---

## 📄 Lisensi

Proyek ini didistribusikan di bawah lisensi **MIT License**.

---

<div align="center">
  Dibuat dengan ❤️ untuk kemudahan integrasi WhatsApp & Messaging API.
</div>
