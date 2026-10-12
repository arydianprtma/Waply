#!/usr/bin/env bash
# ==============================================================================
# Waply VPS Setup Script (Ubuntu 22.04 / 24.04 LTS)
# ==============================================================================
# Script otomatis untuk inisialisasi VPS baru di SumoPod:
# - Swap 4GB RAM
# - Paket dasar (curl, git, ufw, fail2ban, nginx, certbot)
# - Docker Engine & Docker Compose resmi
# - Pengaturan Firewall (UFW)
# ==============================================================================

set -e

echo "🚀 [1/5] Memperbarui sistem Ubuntu..."
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl wget git ufw fail2ban ca-certificates gnupg lsb-release

# 2. Setup Swap Memory (4GB) untuk kestabilan container
if [ ! -f /swapfile ]; then
    echo "💾 [2/5] Membuat Swap Memory 4GB..."
    sudo fallocate -l 4G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=4096
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✅ Swap 4GB aktif!"
else
    echo "ℹ️  Swapfile sudah ada, melewati langkah ini."
fi

# 3. Instalasi Docker & Docker Compose resmi
echo "🐳 [3/5] Menginstal Docker Engine & Docker Compose..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm -f get-docker.sh
    sudo usermod -aG docker "$USER" || true
    echo "✅ Docker berhasil diinstal!"
else
    echo "ℹ️  Docker sudah terinstal."
fi

# 4. Instalasi Nginx & Certbot SSL
echo "🌐 [4/5] Menginstal Nginx & Certbot SSL..."
sudo apt-get install -y nginx certbot python3-certbot-nginx

# 5. Konfigurasi Firewall UFW
echo "🛡️ [5/5] Mengonfigurasi Firewall UFW..."
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
echo "y" | sudo ufw enable || true
sudo ufw status

echo ""
echo "🎉 ==========================================================="
echo "✅ Setup VPS SumoPod selesai!"
echo "Langkah selanjutnya:"
echo "1. Pastikan repository Waply berada di /opt/waply (atau folder pilihan Anda)."
echo "2. Salin .env.example menjadi .env dan isi kredensial."
echo "3. Jalankan './deploy.sh' untuk membangun & mengaktifkan sistem Waply."
echo "4. Hubungkan domain waply.web.id dengan Nginx & Certbot."
echo "==========================================================="
