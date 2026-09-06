# PRD - Sendora

**Product:** Sendora  
**Category:** WhatsApp Gateway & Messaging API SaaS  
**Tagline:** Simple Messaging, Powerful Automation  
**Status:** Development / Local First

---

## 1. Product Vision

Sendora adalah platform SaaS yang memungkinkan pengguna menghubungkan nomor WhatsApp mereka ke sistem Sendora dan menggunakannya sebagai Messaging Gateway/API.

Pengguna dapat:

- Menghubungkan WhatsApp melalui QR Code
- Mengirim pesan melalui API
- Menerima pesan melalui webhook
- Membuat API Key
- Melihat log pesan
- Membuat automation
- Mengelola beberapa device
- Memantau penggunaan API
- Mengamankan nomor dari pemblokiran Meta (Anti-Ban & Warmup Protection)
- Membeli paket layanan
- Melakukan pembayaran melalui Midtrans

### Konsep

```text
                SENDORA
                   |
       +-----------+-----------+
       |                       |
    Dashboard               REST API
       |                       |
       +-----------+-----------+
                   |
             Gateway Service
                   |
             WhatsApp Session
                   |
              WhatsApp User
```

---

# 2. Development Strategy: Local First

Pengembangan Sendora dilakukan **sepenuhnya secara lokal terlebih dahulu**.

Jangan melakukan deployment ke Vercel atau VPS pada tahap awal.

Tujuan tahap local-first:

- Memastikan arsitektur aplikasi berjalan
- Menguji database
- Menguji authentication
- Menguji WhatsApp Gateway
- Menguji QR session
- Menguji API
- Menguji webhook
- Menguji billing Midtrans Sandbox
- Menguji automation
- Menyelesaikan bug sebelum deployment

### Arsitektur Development

```text
Local PC
|
+-- Next.js Web App
|
+-- Gateway Service
|     |
|     +-- Baileys
|     +-- WhatsApp Sessions
|     +-- Message Processing
|
+-- PostgreSQL
|     |
|     +-- Supabase Local / Supabase Project
|
+-- Prisma
|
+-- Midtrans Sandbox
|
+-- Docker (opsional)
```

Selama development, seluruh aplikasi dapat dijalankan dari komputer developer.

Contoh:

```text
Next.js
http://localhost:3000

Gateway
http://localhost:3001

API
http://localhost:3000/api

PostgreSQL
localhost / Supabase

Midtrans
Sandbox
```

---

# 3. Teknologi

## Frontend & Web Application

**Next.js + TypeScript**

Digunakan untuk:

- Landing page
- Authentication
- Dashboard
- Admin panel
- Billing
- API documentation
- API routes yang ringan

## UI

**Tailwind CSS + DaisyUI 5**

Komponen:

- Navbar
- Sidebar
- Card
- Modal
- Drawer
- Table
- Tabs
- Badge
- Alert
- Toast
- Dropdown
- Form
- Pagination

## Icons

**Lucide React**

## Charts

**Recharts**

## Table

**TanStack Table**

## Validation

**Zod**

---

# 4. Database

**PostgreSQL melalui Supabase**

ORM:

**Prisma**

Pada tahap development, database dapat menggunakan:

### Opsi A: Supabase Cloud Development Project

```text
Local Next.js
      |
      v
Prisma
      |
      v
Supabase PostgreSQL
```

### Opsi B: Supabase Local

Jika ingin seluruh database berjalan lokal:

```text
Local Next.js
      |
      v
Prisma
      |
      v
Supabase Local
      |
      v
PostgreSQL
```

Untuk MVP, Supabase Cloud Development Project lebih sederhana. Jika ingin environment development yang benar-benar offline/local, gunakan Supabase CLI dan local stack.

### Environment

Contoh:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

NEXT_PUBLIC_SUPABASE_URL="..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
```

Jangan commit `.env` ke Git.

---

# 5. Authentication

Gunakan:

**Supabase Auth**

Supabase Auth menangani:

- Register
- Login
- Logout
- Email verification
- Password reset
- Session

Prisma digunakan untuk business/application data seperti:

- Subscription
- API Key
- Device
- Message
- Invoice
- Webhook
- Automation

Arsitektur:

```text
Supabase Auth
      |
      v
    User
      |
      v
   Prisma
      |
      v
Application Data
```

---

# 6. WhatsApp Gateway

Untuk MVP, gunakan library berbasis WhatsApp Web seperti **Baileys**.

Gateway dipisahkan dari aplikasi Next.js karena membutuhkan proses Node.js yang berjalan terus-menerus.

```text
                  Local Next.js
                       |
                       | HTTP
                       v
                Gateway Service
                       |
              +--------+--------+
              |                 |
         Session A          Session B
              |                 |
              v                 v
         WhatsApp #1        WhatsApp #2
```

Gateway bertanggung jawab atas:

- WhatsApp connection
- QR generation
- Session management
- Message sending
- Message receiving
- Message status
- Webhook processing
- Reconnection
- Device monitoring

### Catatan

Baileys tidak boleh diperlakukan sebagai serverless function. Gateway harus berjalan sebagai persistent Node.js process.

---

# 7. Local Gateway Architecture

Pada tahap development:

```text
                 Browser
                    |
                    v
             localhost:3000
                    |
              Next.js App
                    |
                    | HTTP
                    v
             localhost:3001
                    |
             Gateway Service
                    |
                 Baileys
                    |
                    v
                WhatsApp
```

Contoh command:

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run gateway:dev
```

Gateway dapat menggunakan `tsx`, `nodemon`, atau mode watch Node.js untuk development.

---

# 8. Payment System

Gunakan:

**Midtrans Snap**

Development dimulai dan dilakukan melalui:

**Midtrans Sandbox**

Tidak ada transaksi uang sungguhan pada tahap development.

Flow:

```text
User
 |
 v
Pilih Paket
 |
 v
Create Order
 |
 v
Next.js Backend
 |
 v
Midtrans Snap Sandbox
 |
 v
Test Payment
 |
 v
Midtrans Notification
 |
 v
Webhook Sendora
 |
 v
Update Payment
 |
 v
Activate Subscription
```

## Aturan penting

Subscription tidak boleh diaktifkan hanya berdasarkan callback frontend.

Status pembayaran harus diverifikasi di backend melalui notification/status Midtrans.

### Development

Gunakan credential:

```env
MIDTRANS_SERVER_KEY="SB-Mid-server-..."
MIDTRANS_CLIENT_KEY="SB-Mid-client-..."
MIDTRANS_IS_PRODUCTION="false"
```

Server key hanya boleh berada di server-side environment.

---

# 9. Subscription Plans

Contoh rancangan awal:

## FREE

```text
Rp0

1 WhatsApp Device
100 API messages / bulan
Basic API
Basic webhook
Basic logs
```

## STARTER

```text
Rp49.000 / bulan

2 Devices
5.000 messages
API access
Webhook
Message logs
Basic automation
```

## BUSINESS

```text
Rp149.000 / bulan

5 Devices
25.000 messages
Advanced API
Webhook
Automation
Priority support
```

## PRO

```text
Rp299.000 / bulan

10 Devices
100.000 messages
Advanced automation
Multiple API keys
Advanced analytics
Priority support
```

Harga di atas adalah rancangan awal dan harus divalidasi berdasarkan biaya gateway, hosting, database, bandwidth, support, serta margin.

---

# 10. Dashboard User

Sidebar:

```text
Sendora
────────────────────

Overview

WhatsApp
 ├── Devices
 ├── Connect Device
 ├── Warmup & Health
 └── Sessions

Messaging
 ├── Send Message
 ├── Message Logs
 ├── Templates
 └── Blacklist / DND

API
 ├── API Keys
 ├── Webhooks
 └── API Logs

Automation
 ├── Auto Reply
 └── Rules

Billing
 ├── Subscription
 ├── Usage
 └── Transactions

Settings
 ├── Profile
 ├── Security
 └── Notifications
```

---

# 11. Dashboard Overview

Metric cards:

```text
Messages Today
12,482
+18.4%
```

```text
API Requests
48,291
+12.2%
```

```text
Active Devices
3 / 5
```

```text
Success Rate
98.7%
```

Komponen:

- Message Activity chart
- API Request chart
- Recent Messages
- Device Status
- Usage Summary
- Current Subscription

---

# 12. WhatsApp Device

Halaman Devices:

```text
WhatsApp Devices

+-------------------------------+
| +62 812-xxxx-xxxx             |
| ● Connected                   |
|                               |
| Messages: 12,481              |
| Last active: 2 minutes ago    |
|                               |
| [Manage] [Disconnect]         |
+-------------------------------+

[ + Connect WhatsApp ]
```

Saat connect:

```text
Connect WhatsApp

+---------------------+
|                     |
|      QR CODE        |
|                     |
+---------------------+

Scan QR menggunakan WhatsApp
```

Flow:

```text
Create Session
      |
      v
Baileys
      |
      v
Generate QR
      |
      v
Gateway -> Dashboard
      |
      v
User Scan
      |
      v
Connected
```

---

# 13. API Key System

User dapat membuat beberapa API key.

Contoh:

```text
API Keys

Name              Key             Status
------------------------------------------
Production        snd_live_••••    Active
Development       snd_test_••••    Active
```

API key tidak boleh disimpan plaintext.

Simpan:

```text
key_hash
key_prefix
created_at
last_used_at
revoked_at
```

Contoh API:

```http
POST /api/v1/messages/send
```

Request:

```json
{
  "device": "device_123",
  "to": "628123456789",
  "message": "Hello from Sendora"
}
```

Response:

```json
{
  "success": true,
  "message_id": "msg_abc123",
  "status": "queued"
}
```

---

# 14. Message Processing

Jangan mengirim pesan secara langsung dari request API ke WhatsApp tanpa queue.

Flow:

```text
API Request
    |
    v
Validate API Key & Plan Quota
    |
    v
Check Recipient Blacklist / Opt-Out
    |
    v
Validate Payload & Parse Spintax
    |
    v
Check Device Warm-Up Limit
    |
    v
Create Message (Status: QUEUED)
    |
    v
Queue with Dynamic Delay & Throttle
    |
    v
Gateway Worker
    |
    +---> Simulate Presence ("composing" / typing)
    |
    +---> Send via Baileys Socket
    |
    v
Update Message Status (SENT / DELIVERED / READ / FAILED)
    |
    v
Trigger Webhook Notification
```

Status:

```text
QUEUED
  |
  v
PROCESSING
  |
  v
SENT
  |
  v
DELIVERED
  |
  v
READ
```

Jika gagal:

```text
FAILED
```

Untuk MVP, queue dapat dimulai dengan PostgreSQL. Setelah traffic meningkat, gunakan Redis/Upstash atau message queue khusus.

---

# 15. Anti-Ban & Anti-Spam Protection System

Penggunaan library tidak resmi (WhatsApp Web / Baileys) membawa risiko pemblokiran nomor (*account ban*) oleh Meta jika terdeteksi aktivitas spam atau perilaku robotik abnormal.

Sendora menerapkan arsitektur perlindungan multi-lapis untuk meminimalisir risiko ban:

### 1. Randomized Human Delay & Adaptive Throttling
- **Random Delay Antar Pesan:** Setiap pesan di antrean per device dikirim dengan jeda acak (default: 4–12 detik per pesan, dapat disesuaikan per device).
- **Batch Cooldown:** Setelah mengirim sejumlah pesan beruntun (misal: 25–50 pesan), worker melakukan jeda istirahat (*sleep*) selama 2–5 menit sebelum melanjutkan batch berikutnya.
- **Burst Protection:** Membatasi maksimum pengiriman pesan per menit per device (misal: max 10–15 pesan/menit).

### 2. Human Behavior & Presence Simulation
- **Simulasi Pengetikan (*Composing/Typing Indicator*):** Sebelum pesan dikirim ke socket, worker mengirimkan sinyal `sendPresenceUpdate('composing', jid)` selama beberapa detik (dihitung proporsional dengan panjang karakter pesan).
- **Simulasi Pembacaan (*Read Receipt*):** Pada skenario pesan masuk atau auto-reply, sistem menandai pesan sebagai dibaca secara wajar sebelum membalas.
- **Koneksi Stabil:** Menghindari disconnect/reconnect berulang-ulang yang dapat memicu red-flag pada server WhatsApp.

### 3. Spintax & Message Variation Engine
- Mengizinkan format Spintax pada isi pesan API/Broadcast:
  - Format: `{Halo|Hai|Selamat pagi} {Kak|Bpk/Ibu} {name}, terima kasih telah menghubungi kami.`
  - Setiap penerima akan menerima teks unik sehingga tidak memicu deteksi broadcast spam dengan hash konten identik.
- Placeholder variabel dinamis: `{name}`, `{phone}`, `{order_id}`, `{random_code}`, dll.

### 4. Device Warm-Up Protocol (Pemanasan Nomor Baru)
Nomor yang baru didaftarkan atau nomor baru wajib melewati fase warm-up sebelum dapat mengirim pesan volume tinggi:
- **Hari 1–3 (Stage 1 - Cold):** Max 20–30 pesan / hari.
- **Hari 4–7 (Stage 2 - Warm):** Max 50–100 pesan / hari.
- **Hari 8–14 (Stage 3 - Active):** Max 250–500 pesan / hari.
- **Hari 15+ (Stage 4 - Mature):** Mengikuti batas kuota paket langganan.
- Dashboard menampilkan status kesehatan nomor: `Warmup Stage (Hari ke-X)`, `Healthy`, `Warning`.

### 5. Multi-Device Load Balancing & Auto-Rotation
- Untuk pengguna dengan kuota multi-device (Starter, Business, Pro), sistem menyediakan mode **Auto-Rotate / Round-Robin**:
  - Pesan API/Broadcast didistribusikan secara bergantian ke device-device aktif milik user.
  - Mencegah penumpukan volume blast pada satu nomor tunggal.
- Otomatis melakukan *failover* atau melewati device yang sedang offline/cooldown.

### 6. Opt-Out & Blacklist Automation (Pencegahan Report Meta)
Pemicu ban tercepat adalah penerima yang menekan tombol **"Report Spam & Block"**.
- Fitur otomatis menangkap keyword unsubscribe (seperti `STOP`, `UNSUBSCRIBE`, `BERHENTI`).
- Nomor penerima yang meminta berhenti otomatis dimasukkan ke **Blacklist / DND (Do Not Disturb) List** tingkat user.
- Pengiriman berikutnya ke nomor yang di-blacklist akan otomatis ditolak (*rejected*) oleh sistem sebelum masuk ke queue.

### 7. Working Hours & Sleep Windows (Jadwal Operasional)
- Pengguna dapat menentukan jadwal aktif pengiriman (misal: 08:00 – 21:00 WIB).
- Pesan non-transaksional yang di-request di luar jam kerja akan ditahan dalam queue (`PAUSED`) dan otomatis diproses saat jendela waktu aktif terbuka kembali.

### 8. Circuit Breaker & Health Safety Switch
- **Deteksi Anomali Error:** Jika terjadi kegagalan kirim berturut-turut (misal: 5-10 kegagalan karena session error atau nomor tidak valid), worker otomatis menunda (*pause*) antrean device tersebut dan mengirimkan alert/webhook `device.warning`.
- **Deteksi Disconnect Reason:** Membedakan antara putus jaringan biasa vs logout paksa (*logged out by server*) untuk segera menghentikan queue sebelum memperparah status akun.

---

# 16. Webhook

User dapat mengatur:

```text
Webhook URL

https://example.com/webhook/sendora
```

Event:

```text
message.received
message.sent
message.delivered
message.read
message.failed
device.connected
device.disconnected
```

Contoh payload:

```json
{
  "event": "message.received",
  "timestamp": "2026-09-04T20:00:00Z",
  "device": "device_123",
  "from": "628123456789",
  "message": {
    "id": "msg_123",
    "type": "text",
    "text": "Hello"
  }
}
```

Gunakan signature/HMAC untuk verifikasi webhook.

Contoh:

```text
X-Sendora-Signature
```

---

# 17. Automation

MVP automation:

```text
WHEN
message received

IF
message contains "harga"

THEN
send:
"Untuk informasi harga silakan..."
```

Flow:

```text
Message Received
      |
      v
Check Opt-Out Keyword ("STOP" -> Blacklist)
      |
      v
Check Keyword
      |
      v
Check Device & Warmup Limit
      |
      v
Check Schedule & Working Hours
      |
      v
Simulate Presence & Delay
      |
      v
Send Response
```

Pengembangan berikutnya:

- Keyword matching
- Regex
- Schedule
- Device condition
- Multiple actions
- Templates
- Delay
- Working hours

---

# 18. Billing Dashboard

Contoh:

```text
Current Plan

BUSINESS
Rp149.000 / month

Usage

Messages
18,291 / 25,000

Devices
3 / 5

API Requests
48,291
```

Button:

```text
Upgrade Plan
```

Payment flow:

```text
Select Plan
    |
    v
Create Invoice
    |
    v
Midtrans Sandbox
    |
    v
Test Payment
    |
    v
Notification
    |
    v
Payment PAID
    |
    v
Subscription ACTIVE
```

---

# 19. Admin Dashboard

Menu:

```text
Admin
|
├── Overview
├── Users
├── Subscriptions
├── Payments
├── Devices & Health
├── Messages
├── API Usage
├── Webhooks
├── Plans
├── Coupons
├── System Logs
└── Settings
```

Admin dapat:

- Melihat user
- Suspend user
- Melihat subscription
- Melihat pembayaran
- Melihat device & status kesehatan anti-ban
- Melihat penggunaan
- Mengubah paket
- Membuat promo
- Melihat error gateway

---

# 20. Database Schema

Minimal MVP:

```text
User
 ├── Subscription
 ├── ApiKey
 ├── Device
 │    └── DeviceWarmup
 ├── Message
 ├── Webhook
 ├── Automation
 ├── Blacklist (DND)
 └── Invoice
```

Model:

```text
User
- id
- email
- name
- createdAt
- updatedAt

Plan
- id
- name
- price
- maxDevices
- monthlyMessages

Subscription
- id
- userId
- planId
- status
- startDate
- endDate

Device
- id
- userId
- name
- phoneNumber
- status (CONNECTED, DISCONNECTED, RECONNECTING, BANNED_DETECTED)
- sessionData
- minDelaySeconds (default: 4)
- maxDelaySeconds (default: 12)
- dailyLimit (default based on warmup)
- isWarmupActive (boolean, default: true)
- workingHoursStart (nullable string, e.g. "08:00")
- workingHoursEnd (nullable string, e.g. "21:00")
- lastConnectedAt
- lastSentAt
- createdAt

DeviceWarmup
- id
- deviceId
- stage (1: Cold, 2: Warm, 3: Active, 4: Mature)
- currentDay (1..15)
- dailySentCount
- maxDailyLimit
- lastResetDate

ApiKey
- id
- userId
- name
- keyHash
- keyPrefix
- lastUsedAt
- revokedAt

Message
- id
- userId
- deviceId
- direction (INBOUND, OUTBOUND)
- recipient
- content (rendered spintax)
- rawContent (template with spintax)
- status (QUEUED, PROCESSING, SENT, DELIVERED, READ, FAILED, PAUSED)
- failReason
- providerMessageId
- scheduledAt
- sentAt
- createdAt

Blacklist
- id
- userId
- phoneNumber
- reason ("UNSUBSCRIBE_KEYWORD", "MANUAL")
- createdAt

Webhook
- id
- userId
- url
- secret
- events
- active

Automation
- id
- userId
- deviceId (nullable)
- keyword
- matchType (EXACT, CONTAINS, REGEX)
- replyContent (supports Spintax)
- isActive
- createdAt

Invoice
- id
- userId
- orderId
- amount
- status
- paymentMethod
- paidAt
```

---

# 21. Security

## Authentication

- Secure session
- Email verification
- Password reset
- Optional 2FA

## API

- API key hashing
- Rate limiting
- Request validation
- Payload size limitation
- IP logging
- API usage tracking

## Webhook

Gunakan:

```text
X-Sendora-Signature
```

dengan HMAC.

## Secrets

Jangan pernah expose ke browser:

```text
DATABASE_URL
DIRECT_URL
MIDTRANS_SERVER_KEY
API secrets
WhatsApp session credentials
```

---

# 22. Rate Limiting

Contoh rancangan:

```text
Free
10 requests/minute

Starter
60 requests/minute

Business
300 requests/minute

Pro
1.000 requests/minute
```

MVP dapat menggunakan PostgreSQL untuk kebutuhan sederhana.

Jika traffic meningkat:

```text
PostgreSQL
+
Redis / Upstash
```

Jangan menambahkan Redis hanya karena terlihat keren di architecture diagram.

---

# 23. Observability

Sediakan:

```text
Application Logs
Gateway Logs
Payment Logs
API Logs
Webhook Logs
Anti-Ban & Safety Logs
```

Contoh:

```text
[INFO]
Device device_123 connected

[INFO]
Message msg_123 sent (Spintax rendered, Delay: 6.2s, Typing: 2.1s)

[WARN]
Device device_123 daily warmup threshold reached (50/50 messages)

[WARN]
Webhook failed

[ERROR]
WhatsApp session disconnected (Reason: 401 loggedOut - Circuit Breaker triggered)
```

---

# 24. Local Development Environment

Struktur environment:

```text
Developer PC
|
├── Node.js
├── npm
├── Git
├── Docker (optional)
|
├── Sendora Web
│     └── localhost:3000
|
├── Sendora Gateway
│     └── localhost:3001
|
├── PostgreSQL / Supabase
|
└── Midtrans Sandbox
```

### Recommended scripts

```bash
npm run dev
npm run gateway:dev
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

Jika menggunakan monorepo:

```bash
npm run dev:web
npm run dev:gateway
npm run dev:admin
```

---

# 25. Repository Structure

Gunakan monorepo:

```text
sendora/
|
├── apps/
│   ├── web/
│   │   ├── landing
│   │   ├── dashboard
│   │   ├── billing
│   │   └── api
│   │
│   ├── gateway/
│   │   ├── baileys
│   │   ├── sessions
│   │   ├── messaging
│   │   ├── safety (anti-ban, throttle, spintax)
│   │   └── webhooks
│   │
│   └── admin/
│
├── packages/
│   ├── database/
│   ├── ui/
│   ├── types/
│   ├── config/
│   └── validation/
│
├── prisma/
│   └── schema.prisma
│
├── docker/
│
└── package.json
```

---

# 26. Domain Structure

Domain belum diperlukan pada tahap local development.

Setelah siap production, struktur yang direkomendasikan:

```text
sendora.id
app.sendora.id
api.sendora.id
docs.sendora.id
admin.sendora.id
gateway.sendora.id
```

Pada tahap local:

```text
localhost:3000
localhost:3001
```

---

# 27. Production Deployment Plan

Deployment dilakukan **setelah MVP local selesai dan stabil**.

Target arsitektur production:

```text
                         INTERNET
                            |
                       Cloudflare
                            |
                +-----------+-----------+
                |                       |
                v                       v
             Web App                API
             Next.js              Next.js
                |                       |
                +-----------+-----------+
                            |
                         Supabase
                       PostgreSQL
                            |
                            |
                            v
                    Gateway Server
                         Node.js
                        Baileys
                            |
                            v
                        WhatsApp
```

Hosting production belum menjadi bagian dari MVP development.

Pilihan hosting nantinya:

- Next.js: platform serverless atau VPS
- PostgreSQL: Supabase
- Gateway: VPS/worker persistent
- DNS/CDN/WAF: Cloudflare

Keputusan final hosting dilakukan setelah mengetahui kebutuhan resource dan jumlah pengguna.

---

# 28. MVP Development Phases

## Phase 1 - Foundation

- [x] Setup repository
- [x] Setup Next.js
- [x] Setup TypeScript
- [x] Setup Tailwind CSS
- [x] Setup DaisyUI
- [x] Setup Supabase
- [x] Setup Prisma
- [x] Setup database schema (termasuk Warmup & Blacklist)
- [x] Setup Supabase Auth
- [x] Setup dashboard layout
- [x] Setup environment variables

## Phase 2 - WhatsApp Gateway & Anti-Ban Safety Engine

- [x] Setup Gateway Service
- [x] Integrate Baileys
- [x] Generate QR
- [x] Connect WhatsApp
- [x] Disconnect WhatsApp
- [x] Persist session
- [x] Reconnect session
- [x] Device status & Health monitoring
- [x] Randomized Delay & Throttling
- [x] Presence Simulation (Typing / Composing)
- [x] Circuit Breaker (Auto-pause on abnormal disconnect/errors)
- [x] Basic send message

## Phase 3 - API, Spintax & Queues

- [ ] API Key generation & hashing
- [ ] API authentication
- [ ] Spintax parser & Variable replacer
- [ ] Opt-out / Blacklist verification before sending
- [ ] Send message endpoint
- [ ] Request validation
- [ ] Message queue (PostgreSQL)
- [ ] Warm-Up daily limit tracker
- [ ] Message status transitions (QUEUED -> PROCESSING -> SENT / FAILED)
- [ ] Message logs
- [ ] Rate limiting

## Phase 4 - Webhook

- [ ] Webhook configuration
- [ ] Event system (termasuk `device.warning` dan `message.opt_out`)
- [ ] Webhook delivery
- [ ] HMAC signature (`X-Sendora-Signature`)
- [ ] Retry mechanism
- [ ] Webhook logs

## Phase 5 - Billing

- [ ] Plans
- [ ] Subscription model
- [ ] Invoice model
- [ ] Midtrans Sandbox
- [ ] Snap integration
- [ ] Payment notification
- [ ] Payment verification
- [ ] Subscription activation
- [ ] Subscription expiration

## Phase 6 - Automation & Safety Controls

- [ ] Auto reply
- [ ] Keyword rules
- [ ] Auto-opt-out handler (keyword `STOP` / `BERHENTI` -> auto-blacklist)
- [ ] Working hours scheduler (Sleep window)
- [ ] Message templates with Spintax
- [ ] Multi-device auto-rotation (Round-Robin)
- [ ] Automation logs

## Phase 7 - Admin

- [ ] Admin authentication
- [ ] User management
- [ ] Subscription management
- [ ] Payment monitoring
- [ ] Device & Anti-Ban health monitoring
- [ ] API usage
- [ ] System logs

## Phase 8 - Production Preparation

- [ ] Production environment
- [ ] Production database
- [ ] Production Midtrans
- [ ] Gateway deployment
- [ ] Domain
- [ ] HTTPS
- [ ] Monitoring
- [ ] Backup
- [ ] Error tracking
- [ ] Load testing
- [ ] Security audit

---

# 29. MVP Target

Versi pertama Sendora cukup memiliki:

```text
Landing Page
      |
      v
Register / Login
      |
      v
Dashboard
      |
      +-- Connect WhatsApp (QR Code + Warmup Status)
      |
      +-- API Keys
      |
      +-- Send Message (Spintax & Anti-Ban Throttle)
      |
      +-- Message Logs
      |
      +-- Blacklist / Opt-Out List
      |
      +-- Webhooks
      |
      +-- Billing
              |
              v
        Midtrans Sandbox
```

Setelah fitur inti stabil, baru tambahkan:

```text
Advanced Automation
Complex Spintax & Campaign Wizard
Analytics
Multiple Devices Auto-Rotation
Team Management
Role & Permission
```

---

# 30. Final Technology Stack

| Layer | Technology |
|---|---|
| Web | Next.js |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI | DaisyUI 5 |
| Icons | Lucide React |
| Database | PostgreSQL |
| Database Provider | Supabase |
| ORM | Prisma |
| Authentication | Supabase Auth |
| WhatsApp Gateway | Baileys |
| Gateway Runtime | Node.js |
| Anti-Ban Engine | Dynamic Throttling + Presence Simulation + Spintax + Warmup Tracker |
| Payment | Midtrans Snap |
| Payment Environment | Midtrans Sandbox |
| Validation | Zod |
| Charts | Recharts |
| Tables | TanStack Table |
| Queue MVP | PostgreSQL |
| Queue Scale-up | Redis / Upstash |
| Local Development | Node.js + npm |
| Containerization | Docker (optional) |
| Production Web | To be decided |
| Production Gateway | VPS / Persistent Worker |
| DNS/CDN | Cloudflare |

---

# 31. Recommended Architecture

```text
                         LOCAL DEVELOPMENT
                               |
                               v
                     +---------------------+
                     |     Developer PC    |
                     +----------+----------+
                                |
                +---------------+---------------+
                |                               |
                v                               v
        +---------------+               +---------------+
        |   Next.js Web |               |    Gateway    |
        | localhost:3000|               | localhost:3001|
        +-------+-------+               +-------+-------+
                |                               |
                | Prisma                        | Baileys + Safety Engine
                v                               v
        +---------------+                   WhatsApp
        |   PostgreSQL  |
        |    Supabase   |
        +---------------+
                |
                v
           Application Data
          (Warmup, Blacklist,
           Queue & Messages)

        External Service:
        Midtrans Sandbox
```

### Prinsip utama

1. **Local first**
2. **Gateway dipisahkan dari Next.js**
3. **Anti-Ban & Anti-Spam protection built-in sejak awal**
4. **Database menggunakan PostgreSQL + Prisma**
5. **UI menggunakan DaisyUI**
6. **Payment dimulai dari Midtrans Sandbox**
7. **Tidak ada deployment sebelum MVP stabil**
8. **Infrastructure dibuat sesederhana mungkin**
9. **Tambahkan Redis/queue infrastructure hanya ketika memang diperlukan**
10. **Production hosting ditentukan setelah kebutuhan resource diketahui**

---

## Catatan Kepatuhan

Jika Sendora menggunakan koneksi WhatsApp Web melalui library pihak ketiga seperti Baileys, produk harus memperhatikan Terms dan kebijakan WhatsApp. Sendora tidak boleh diposisikan sebagai produk resmi WhatsApp kecuali menggunakan jalur resmi WhatsApp Business Platform.

Penggunaan library pihak ketiga juga memiliki risiko session/account restriction yang harus diperhitungkan dalam desain produk dan terms of service. Fitur anti-ban, spintax, jeda acak, simulasi pengetikan, dan protokol warm-up dirancang untuk meminimalkan risiko tersebut.
