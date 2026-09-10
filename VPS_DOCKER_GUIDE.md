# 🚀 Panduan Lengkap Deploy Waply WhatsApp Gateway di VPS Menggunakan Docker

Panduan ini menjelaskan langkah demi langkah cara men-deploy **Waply** di server VPS Ubuntu / Debian dari awal hingga live dengan domain dan SSL HTTPS.

---

## 📋 Prasyarat Server VPS
- **OS:** Ubuntu 22.04 LTS / Ubuntu 24.04 LTS (atau Debian 11/12)
- **RAM:** Minimal 1 GB (Disarankan 2 GB + Swap 2 GB)
- **Storage:** Minimal 20 GB SSD
- **Port Terbuka:** Port 80 (HTTP), 443 (HTTPS), 22 (SSH)

---

## 🛠️ Langkah 1: Update Server & Install Docker + Docker Compose

Jalankan perintah berikut di terminal SSH VPS Anda:

```bash
# 1. Update package index
sudo apt update && sudo apt upgrade -y

# 2. Install dependencies pendukung
sudo apt install -y curl git ufw fail2ban

# 3. Install Docker Engine resmi
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 4. Beri akses user non-root ke Docker (Opsional)
sudo usermod -aG docker $USER

# 5. Verifikasi instalasi Docker
docker --version
docker compose version
```

---

## 📦 Langkah 2: Clone Repository & Persiapan File Konfigurasi

```bash
# 1. Masuk ke folder home atau /opt
cd /opt

# 2. Clone repository Anda
git clone https://github.com/arydianprtma/Waply.git waply
cd waply

# 3. Buat file .env dari template
cp .env.example .env

# 4. Edit file .env dengan kredensial produksi Anda
nano .env
```

Isi variabel `.env` dengan data asli (Supabase, Midtrans Production, JWT Secret, SMTP Email, dll). Simpan dengan menekan `Ctrl+O` lalu `Enter`, kemudian keluar dengan `Ctrl+X`.

---

## 🚢 Langkah 3: Build & Jalankan Container dengan Docker Compose

Jalankan perintah berikut untuk mem-build dan menjalankan kedua service (`waply-web` dan `waply-gateway`):

```bash
# Build dan jalankan di background (Daemon)
docker compose up -d --build
```

### Cek Status Container:
```bash
# Cek apakah kedua container berstatus 'Up'
docker compose ps

# Cek log aplikasi secara real-time
docker compose logs -f
```

---

## 🌐 Langkah 4: Setup Domain & SSL HTTPS

Terdapat 2 opsi mudah untuk menghubungkan domain `ardp.my.id`:

### Opsi A: Menggunakan Cloudflare Tunnel (Paling Mudah, Tanpa Port Forwarding / Nginx)
1. Install Cloudflare Tunnel di VPS:
   ```bash
   curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   sudo dpkg -i cloudflared.deb
   ```
2. Hubungkan tunnel Anda:
   ```bash
   sudo cloudflared service install <YOUR_CLOUDFLARE_TUNNEL_TOKEN>
   ```
3. Arahkan public hostname di Dashboard Cloudflare:
   - Hostname: `ardp.my.id`
   - Service: `http://localhost:3001`

---

### Opsi B: Menggunakan Nginx & Let's Encrypt Certbot
1. Install Nginx & Certbot:
   ```bash
   sudo apt install -y nginx certbot python3-certbot-nginx
   ```
2. Salin konfigurasi Nginx:
   ```bash
   sudo cp nginx.conf.example /etc/nginx/sites-available/ardp.my.id
   sudo ln -s /etc/nginx/sites-available/ardp.my.id /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```
3. Generate sertifikat SSL gratis:
   ```bash
   sudo certbot --nginx -d ardp.my.id
   ```

---

## 🔄 Langkah 5: Cara Update / Deploy Ulang Saat Ada Code Baru

Jika Anda melakukan push commit baru ke GitHub:

```bash
cd /opt/waply
git pull origin main
docker compose up -d --build
```

---

## 💾 Manajemen Persistent Volume & Backup

Data sesi login WhatsApp tersimpan aman di Docker Named Volumes sehingga **tidak akan logout saat container di-restart atau di-update**:
* `waply_gateway_sessions`: Menyimpan auth token WhatsApp multi-device.
* `waply_web_data`: Menyimpan cache & data lokal.

Untuk backup folder sesi manual:
```bash
# Cek lokasi volume di host VPS
docker volume inspect waply_gateway_sessions
```
