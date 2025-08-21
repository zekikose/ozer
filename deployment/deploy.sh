#!/bin/bash

# SMSTK Production Deployment Script
# Sunucu: 45.84.191.65
# Klasör: /var/www/ztaak/data/www/test.ztaak.com/

echo "🚀 SMSTK Production Deployment Başlıyor..."

# Sunucu bilgileri
SERVER_IP="45.84.191.65"
SERVER_USER="root"
SERVER_PATH="/var/www/ztaak/data/www/test.ztaak.com/"
DB_NAME="smstk_db"
DB_PASSWORD="oX6eM8aA9y"

# Hata kontrolü
set -e

echo "📦 Dosyalar hazırlanıyor..."

# Sunucuya bağlan ve deployment yap
echo "🔗 Sunucuya bağlanılıyor..."

# 1. Sunucuda hazırlık
ssh ${SERVER_USER}@${SERVER_IP} << 'EOF'
    echo "🧹 Eski dosyalar temizleniyor..."
    rm -rf /var/www/ztaak/data/www/test.ztaak.com/*
    
    echo "📁 Klasör yapısı oluşturuluyor..."
    mkdir -p /var/www/ztaak/data/www/test.ztaak.com/{server,public,logs}
    mkdir -p /var/log/pm2
    
    echo "📦 PM2 kurulumu kontrol ediliyor..."
    if ! command -v pm2 &> /dev/null; then
        echo "PM2 kuruluyor..."
        npm install -g pm2
    fi
    
    echo "🗄️ MySQL kurulumu kontrol ediliyor..."
    if ! command -v mysql &> /dev/null; then
        echo "MySQL kuruluyor..."
        apt update && apt install -y mysql-server
    fi
EOF

# 2. Dosyaları sunucuya kopyala
echo "📤 Dosyalar sunucuya kopyalanıyor..."
scp -r server/* ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}server/
scp -r client-build/* ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}public/
scp ecosystem.config.js ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}
scp nginx.conf ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}

# 3. Sunucuda kurulum ve başlatma
ssh ${SERVER_USER}@${SERVER_IP} << 'EOF'
    cd /var/www/ztaak/data/www/test.ztaak.com/
    
    echo "📦 Node.js dependencies yükleniyor..."
    cd server && npm install --production
    
    echo "🗄️ Veritabanı oluşturuluyor..."
    mysql -u root -p'oX6eM8aA9y' -e "CREATE DATABASE IF NOT EXISTS smstk_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    
    echo "🔄 PM2 ile uygulama başlatılıyor..."
    pm2 delete smstk 2>/dev/null || true
    pm2 start ecosystem.config.js --env production
    pm2 save
    pm2 startup
    
    echo "🌐 Nginx konfigürasyonu güncelleniyor..."
    cp nginx.conf /etc/nginx/sites-available/test.ztaak.com
    ln -sf /etc/nginx/sites-available/test.ztaak.com /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
    
    echo "🔒 SSL sertifikası kontrol ediliyor..."
    if [ ! -f /etc/letsencrypt/live/test.ztaak.com/fullchain.pem ]; then
        echo "SSL sertifikası yok. HTTP konfigürasyonu kullanılıyor..."
        sed -i 's/listen 443 ssl http2;/# listen 443 ssl http2;/' /etc/nginx/sites-available/test.ztaak.com
        sed -i 's/return 301 https:\/\/$server_name$request_uri;/# return 301 https:\/\/$server_name$request_uri;/' /etc/nginx/sites-available/test.ztaak.com
        nginx -t && systemctl reload nginx
    fi
    
    echo "✅ Deployment tamamlandı!"
    echo "🌐 Uygulama: http://test.ztaak.com"
    echo "📊 PM2 Durumu:"
    pm2 status
    echo "📊 Nginx Durumu:"
    systemctl status nginx --no-pager -l
EOF

echo "🎉 Deployment başarıyla tamamlandı!"
echo "🌐 Uygulama URL: http://test.ztaak.com"
echo "📊 API URL: http://test.ztaak.com/api/health"
echo "🔑 Giriş bilgileri:"
echo "   Kullanıcı adı: admin"
echo "   Şifre: admin123"
