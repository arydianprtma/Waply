#!/usr/bin/env bash
# ==============================================================================
# Waply Automated Deploy Script
# ==============================================================================
# Jalankan script ini untuk pertama kali deploy atau pembaruan kode.
# Penggunaan:
#   chmod +x deploy.sh
#   ./deploy.sh
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔍 [1/4] Memeriksa konfigurasi environment..."
if [ ! -f .env ]; then
    echo "❌ Error: File .env belum ditemukan!"
    echo "Silakan salin template: cp .env.example .env lalu sesuaikan kredensial Anda."
    exit 1
fi

# Tarik perubahan terbaru dari GitHub jika ada repo git
if [ -d .git ]; then
    echo "📥 [2/4] Menarik pembaruan kode terbaru dari git..."
    git pull origin main || echo "⚠️ Git pull dilewati/tidak ada branch main remote."
else
    echo "ℹ️  Melewati git pull (.git tidak ditemukan)."
fi

# Build dan jalankan Docker Compose
echo "🐳 [3/4] Membangun dan menyalakan container (waply-db, waply-gateway, waply-web)..."
docker compose up -d --build

# Inisialisasi Database Prisma
echo "🗄️ [4/4] Sinkronisasi skema database PostgreSQL dengan Prisma..."
echo "Menunggu container siap..."
sleep 5

docker compose exec -T waply-web npx prisma db push --schema=/app/packages/database/prisma/schema.prisma || {
    echo "⚠️ Prisma db push coba ulang dalam 5 detik..."
    sleep 5
    docker compose exec -T waply-web npx prisma db push --schema=/app/packages/database/prisma/schema.prisma
}

echo ""
echo "==========================================================="
echo "🎉 DEPLOY BERHASIL!"
echo "Status Container:"
docker compose ps
echo ""
echo "🔗 Web App: http://127.0.0.1:3001 (atau https://waply.web.id jika Nginx aktif)"
echo "🔗 Gateway: http://127.0.0.1:3002"
echo "Untuk melihat log: docker compose logs -f"
echo "==========================================================="
