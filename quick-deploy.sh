#!/bin/bash

# 🚀 SMSTK Hızlı Kurulum Scripti
# Bu script sadece temel bilgilerle hızlı kurulum yapar

echo "🚀 SMSTK Hızlı Kurulum"
echo "========================"

# Bilgileri al
read -p "🌐 Domain adresiniz (örn: test.ztaak.com): " DOMAIN
read -p "👤 SSH kullanıcı adınız: " SSH_USER
read -p "🗄️ MySQL kullanıcı adı (örn: smstk_db): " DB_USER
read -p "🔑 MySQL şifresi: " DB_PASSWORD
read -p "📧 E-posta adresiniz (SSL için): " SSL_EMAIL

# Konfigürasyon dosyasını oluştur
cat > deploy-config.env << EOF
# 🚀 SMSTK Sunucu Yükleme Konfigürasyonu
DOMAIN=${DOMAIN}
SSH_USER=${SSH_USER}
DB_HOST=${DOMAIN}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=smstk_db
DB_PORT=3306
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2024
SSL_EMAIL=${SSL_EMAIL}
NODE_ENV=production
PORT=5000
EOF

echo "✅ Konfigürasyon dosyası oluşturuldu: deploy-config.env"
echo "🚀 Otomatik yükleme başlatılıyor..."

# Otomatik yükleme scriptini çalıştır
./deploy-automated.sh
