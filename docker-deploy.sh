#!/bin/bash

# 🐳 SMSTK Docker Deployment Script
# Tek komutla sunucuya yükleyin!

set -e

echo "🐳 SMSTK Docker Deployment başlatılıyor..."

# Renkli çıktı
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Docker kontrolü
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker bulunamadı. Yükleniyor...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo -e "${YELLOW}⚠️  Lütfen sistemi yeniden başlatın ve script'i tekrar çalıştırın${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}📦 Docker Compose yükleniyor...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Mevcut container'ları durdur
echo -e "${BLUE}🛑 Mevcut container'lar durduruluyor...${NC}"
docker-compose down 2>/dev/null || true

# Eski image'ları temizle
echo -e "${BLUE}🧹 Eski image'lar temizleniyor...${NC}"
docker system prune -f

# SSL sertifikası için domain sor
echo -e "${YELLOW}🌐 Domain adınızı girin (SSL için):${NC}"
read -p "Domain: " DOMAIN

if [ ! -z "$DOMAIN" ]; then
    # SSL sertifikası oluştur
    echo -e "${BLUE}🔒 SSL sertifikası oluşturuluyor...${NC}"
    mkdir -p ssl
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/nginx.key -out ssl/nginx.crt \
        -subj "/C=TR/ST=Istanbul/L=Istanbul/O=SMSTK/CN=$DOMAIN"
    
    # Nginx konfigürasyonunu güncelle
    sed -i "s/localhost/$DOMAIN/g" nginx-docker.conf
fi

# Container'ları başlat
echo -e "${BLUE}🚀 Container'lar başlatılıyor...${NC}"
docker-compose up -d --build

# Sağlık kontrolü
echo -e "${BLUE}🧪 Sağlık kontrolü yapılıyor...${NC}"
sleep 30

# API test
if curl -s http://localhost/api/health > /dev/null; then
    echo -e "${GREEN}✅ API başarıyla çalışıyor!${NC}"
else
    echo -e "${RED}❌ API çalışmıyor!${NC}"
    echo -e "${YELLOW}📋 Log'ları kontrol edin: docker-compose logs api${NC}"
fi

# Frontend test
if curl -s http://localhost > /dev/null; then
    echo -e "${GREEN}✅ Frontend başarıyla çalışıyor!${NC}"
else
    echo -e "${RED}❌ Frontend çalışmıyor!${NC}"
    echo -e "${YELLOW}📋 Log'ları kontrol edin: docker-compose logs frontend${NC}"
fi

# Container durumu
echo -e "${BLUE}📊 Container durumu:${NC}"
docker-compose ps

echo -e "${GREEN}🎉 SMSTK Docker ile başarıyla yüklendi!${NC}"
echo -e "${BLUE}📋 Erişim bilgileri:${NC}"
echo -e "🌐 Frontend: ${GREEN}http://$DOMAIN${NC}"
echo -e "🔌 API: ${GREEN}http://$DOMAIN/api${NC}"
echo -e "📊 Health: ${GREEN}http://$DOMAIN/health${NC}"
echo -e "🔑 Admin: ${GREEN}admin/admin123${NC}"

echo -e "${BLUE}📋 Yönetim komutları:${NC}"
echo -e "🛑 Durdur: ${YELLOW}docker-compose down${NC}"
echo -e "🔄 Yeniden başlat: ${YELLOW}docker-compose restart${NC}"
echo -e "📋 Log'lar: ${YELLOW}docker-compose logs${NC}"
echo -e "📊 Durum: ${YELLOW}docker-compose ps${NC}"
