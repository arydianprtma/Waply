# 🚀 Panduan Lengkap Deploy Waply WhatsApp Gateway di VPS SumoPod (Docker)

Panduan ini menjelaskan langkah demi langkah cara men-deploy **Waply** di server VPS Ubuntu (SumoPod / Tencent Cloud) dari awal hingga live dengan domain `waply.web.id` dan SSL HTTPS.

---

## 📋 Spesifikasi Rekomendasi VPS
* **OS:** Ubuntu 22.04 LTS atau Ubuntu 24.04 LTS
* **RAM:** Minimal 1 GB (Sangat disarankan 2 GB + Swap 4 GB otomatis via script)
* **Storage:** Minimal 20 GB SSD
* **Domain:** `waply.web.id` (dengan fallback dev `ardp.my.id`)

---

## ⚡ Jalur Cepat (Automated 1-Click Setup)

Ketika VPS SumoPod sudah aktif dan Anda sudah login via terminal SSH (`ssh root@<IP_VPS>`):

### 1. Inisialisasi Server & Docker Otomatis
```bash
# Masuk ke direktori /opt
cd /opt

# Clone repository Waply
git clone https://github.com/arydianprtma/Waply.git waply
cd waply

# Berikan izin eksekusi pada script
chmod +x setup-vps.sh deploy.sh

# Jalankan script instalasi sistem (Swap, Docker, Nginx, Certbot, Firewall)
./setup-vps.sh
```

---

### 2. Atur Environment (.env)
Salin template environment dan isi dengan kredensial produksi:
```bash
cp .env.example .env
nano .env
```
Variabel penting yang perlu diperhatikan:
```env
# Domain Publik Utama
NEXT_PUBLIC_APP_URL="https://waply.web.id"

# Database PostgreSQL Lokal Container
DATABASE_URL="postgresql://waply:waply_secret_password@waply-db:5432/waply?schema=public"
DIRECT_URL="postgresql://waply:waply_secret_password@waply-db:5432/waply?schema=public"

# Midtrans Production (setelah nama merchant Waply aktif)
MIDTRANS_IS_PRODUCTION=true
MIDTRANS_SERVER_KEY=Mid-server-YOUR_PROD_KEY
MIDTRANS_CLIENT_KEY=Mid-client-YOUR_PROD_KEY

# Resend SMTP Email (Port 465 SSL)
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_YOUR_RESEND_API_KEY
SMTP_FROM="Waply <noreply@waply.web.id>"
```
> Tekan `Ctrl + O` lalu `Enter` untuk menyimpan, kemudian `Ctrl + X` untuk keluar dari nano.

---

### 3. Deploy Aplikasi dengan Script Otomatis
Cukup jalankan satu perintah:
```bash
./deploy.sh
```
Script ini akan:
1. Memeriksa file `.env`
2. Mem-build seluruh image Docker (`waply-db`, `waply-gateway`, `waply-web`)
3. Menjalankan container di background
4. Melakukan migrasi/sinkronisasi skema Prisma ke database PostgreSQL secara otomatis

---

### 4. Setup Domain Nginx & SSL HTTPS Gratis (Certbot)

Arahkan DNS Record domain Anda di Cloudflare / registrar:
* **Tipe A:** `@` atau `waply.web.id` -> `<IP_VPS_SUMOPOD>`

Kemudian di terminal VPS:
```bash
# 1. Pasang konfigurasi Nginx
sudo cp nginx.conf.example /etc/nginx/sites-available/waply.web.id
sudo ln -s /etc/nginx/sites-available/waply.web.id /etc/nginx/sites-enabled/

# 2. Uji dan restart Nginx
sudo nginx -t
sudo systemctl reload nginx

# 3. Terbitkan Sertifikat SSL HTTPS (Let's Encrypt)
sudo certbot --nginx -d waply.web.id -d ardp.my.id
```

Website dan API Waply kini sudah live di **`https://waply.web.id`** dengan HTTPS aman! 🔒

---

## 🔄 Cara Update Kode Saat Ada Fitur Baru
Jika di kemudian hari ada commit atau pembaruan kode di GitHub:
```bash
cd /opt/waply
./deploy.sh
```
Script akan otomatis melakukan `git pull`, rebuild container, dan migrasi database tanpa perlu langkah manual tambahan.

---

## 🛠️ Perintah Berguna untuk Monitoring & Debugging

| Kebutuhan | Perintah |
| :--- | :--- |
| **Cek status semua container** | `docker compose ps` |
| **Cek log real-time semua container** | `docker compose logs -f` |
| **Cek log WhatsApp Gateway saja** | `docker compose logs -f waply-gateway` |
| **Cek log Web Next.js saja** | `docker compose logs -f waply-web` |
| **Restart semua container** | `docker compose restart` |
| **Stop semua container** | `docker compose down` |

---

## 💾 Keamanan Data & Persistent Sessions WhatsApp
Semua data penting tersimpan aman di Docker Named Volumes:
* `waply_gateway_sessions`: Sesi login QR Baileys WhatsApp (tidak akan hilang/logout saat container di-restart atau di-update).
* `waply_postgres_data`: Seluruh database PostgreSQL (pengguna, transaksi, broadcast, auto-reply).
* `waply_web_data`: Media cache dan data shared.
