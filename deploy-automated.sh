#!/bin/bash

# 🚀 SMSTK Otomatik Deployment Script
# Bu script'i sunucunuzda çalıştırarak projeyi otomatik olarak yükleyin

set -e  # Hata durumunda script'i durdur

echo "🚀 SMSTK Deployment başlatılıyor..."

# Renkli çıktı için
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Gerekli paketleri kontrol et ve yükle
echo -e "${BLUE}📦 Gerekli paketler kontrol ediliyor...${NC}"

# Node.js kontrolü
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js bulunamadı. Yükleniyor...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# PM2 kontrolü
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}📦 PM2 yükleniyor...${NC}"
    sudo npm install -g pm2
fi

# Nginx kontrolü
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}📦 Nginx yükleniyor...${NC}"
    sudo apt-get update
    sudo apt-get install -y nginx
fi

# MySQL kontrolü
if ! command -v mysql &> /dev/null; then
    echo -e "${YELLOW}📦 MySQL yükleniyor...${NC}"
    sudo apt-get install -y mysql-server
fi

echo -e "${GREEN}✅ Tüm paketler hazır${NC}"

# Proje dizinini oluştur
PROJECT_DIR="/var/www/smstk"
echo -e "${BLUE}📁 Proje dizini oluşturuluyor: $PROJECT_DIR${NC}"
sudo mkdir -p $PROJECT_DIR
sudo chown $USER:$USER $PROJECT_DIR

# Proje dosyalarını kopyala (bu script'i proje dizininde çalıştırın)
echo -e "${BLUE}📋 Proje dosyaları kopyalanıyor...${NC}"
cp -r . $PROJECT_DIR/
cd $PROJECT_DIR

# Environment dosyasını oluştur
echo -e "${BLUE}⚙️ Environment dosyası oluşturuluyor...${NC}"
if [ ! -f "server/.env" ]; then
    cp deploy-config.env server/.env
    echo -e "${YELLOW}⚠️  Lütfen server/.env dosyasını düzenleyerek sunucu bilgilerinizi girin${NC}"
fi

# Bağımlılıkları yükle
echo -e "${BLUE}📦 Bağımlılıklar yükleniyor...${NC}"
npm run install:all

# Production build oluştur
echo -e "${BLUE}🔨 Production build oluşturuluyor...${NC}"
npm run build

# Veritabanını oluştur
echo -e "${BLUE}🗄️ Veritabanı oluşturuluyor...${NC}"
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS smstk_db;"

# PM2 log dizinini oluştur
echo -e "${BLUE}📝 PM2 log dizini oluşturuluyor...${NC}"
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# PM2 ile uygulamayı başlat
echo -e "${BLUE}🚀 PM2 ile uygulama başlatılıyor...${NC}"
pm2 start pm2-config.json
pm2 save
pm2 startup

# Nginx konfigürasyonu
echo -e "${BLUE}🌐 Nginx konfigürasyonu ayarlanıyor...${NC}"
sudo cp nginx-config.conf /etc/nginx/sites-available/smstk
sudo ln -sf /etc/nginx/sites-available/smstk /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default  # Varsayılan siteyi kaldır

# Nginx syntax kontrolü
if sudo nginx -t; then
    sudo systemctl reload nginx
    echo -e "${GREEN}✅ Nginx konfigürasyonu başarılı${NC}"
else
    echo -e "${RED}❌ Nginx konfigürasyonu hatası${NC}"
    exit 1
fi

# Firewall ayarları
echo -e "${BLUE}🔥 Firewall ayarları yapılıyor...${NC}"
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw --force enable

# SSL sertifikası (Let's Encrypt)
echo -e "${BLUE}🔒 SSL sertifikası kuruluyor...${NC}"
if ! command -v certbot &> /dev/null; then
    sudo apt-get install -y certbot python3-certbot-nginx
fi

echo -e "${YELLOW}⚠️  SSL sertifikası için domain adınızı girin:${NC}"
read -p "Domain: " DOMAIN

if [ ! -z "$DOMAIN" ]; then
    sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
fi

# Son kontroller
echo -e "${BLUE}🔍 Son kontroller yapılıyor...${NC}"
pm2 status
sudo systemctl status nginx

echo -e "${GREEN}🎉 Deployment tamamlandı!${NC}"
echo -e "${BLUE}📋 Sonraki adımlar:${NC}"
echo -e "1. ${YELLOW}server/.env dosyasını düzenleyin${NC}"
echo -e "2. ${YELLOW}nginx-config.conf dosyasında domain adınızı değiştirin${NC}"
echo -e "3. ${YELLOW}Veritabanı bağlantısını test edin${NC}"
echo -e "4. ${YELLOW}https://$DOMAIN adresinden uygulamayı kontrol edin${NC}"

echo -e "${GREEN}✅ SMSTK başarıyla yüklendi!${NC}"
