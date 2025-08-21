#!/bin/bash

# 🚀 SMSTK API Sunucu Sorun Giderme Scripti
# Bu script sunucuda API sorunlarını çözer

set -e

echo "🔧 SMSTK API Sunucu Sorun Giderme başlatılıyor..."

# Renkli çıktı
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Mevcut process'leri temizle
echo -e "${BLUE}🧹 Mevcut process'ler temizleniyor...${NC}"
pkill -f "node.*index.js" || true
pkill -f "nodemon" || true
pkill -f "pm2" || true

# 2. Port kontrolü
echo -e "${BLUE}🔍 Port kontrolü yapılıyor...${NC}"
if lsof -ti:5000 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 5000 kullanımda, temizleniyor...${NC}"
    lsof -ti:5000 | xargs kill -9
fi

# 3. Environment dosyasını kontrol et
echo -e "${BLUE}⚙️ Environment dosyası kontrol ediliyor...${NC}"
if [ ! -f "server/.env" ]; then
    echo -e "${YELLOW}⚠️  .env dosyası bulunamadı, oluşturuluyor...${NC}"
    cp deploy-config.env server/.env
    echo -e "${RED}❌ Lütfen server/.env dosyasını sunucu bilgilerinizle düzenleyin!${NC}"
    exit 1
fi

# 4. Bağımlılıkları yükle
echo -e "${BLUE}📦 Bağımlılıklar yükleniyor...${NC}"
npm run install:all

# 5. Veritabanı bağlantısını test et
echo -e "${BLUE}🗄️ Veritabanı bağlantısı test ediliyor...${NC}"
NODE_PATH=server/node_modules node server-env-check.js

# 6. Production build oluştur
echo -e "${BLUE}🔨 Production build oluşturuluyor...${NC}"
npm run build

# 7. PM2 ile başlat
echo -e "${BLUE}🚀 PM2 ile API başlatılıyor...${NC}"
if command -v pm2 &> /dev/null; then
    pm2 delete smstk-api 2>/dev/null || true
    pm2 start pm2-config.json
    pm2 save
    pm2 startup
    echo -e "${GREEN}✅ PM2 ile başlatıldı${NC}"
else
    echo -e "${YELLOW}⚠️  PM2 bulunamadı, manuel başlatma...${NC}"
    cd server && nohup node index.js > ../api.log 2>&1 &
    echo -e "${GREEN}✅ Manuel olarak başlatıldı${NC}"
fi

# 8. API test
echo -e "${BLUE}🧪 API test ediliyor...${NC}"
sleep 5
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo -e "${GREEN}✅ API başarıyla çalışıyor!${NC}"
    echo -e "${BLUE}📊 API Endpoint: http://localhost:5000/api/health${NC}"
else
    echo -e "${RED}❌ API çalışmıyor!${NC}"
    echo -e "${YELLOW}📋 Log dosyasını kontrol edin: api.log${NC}"
    exit 1
fi

# 9. Nginx konfigürasyonu
echo -e "${BLUE}🌐 Nginx konfigürasyonu kontrol ediliyor...${NC}"
if command -v nginx &> /dev/null; then
    if [ -f "nginx-config.conf" ]; then
        sudo cp nginx-config.conf /etc/nginx/sites-available/smstk
        sudo ln -sf /etc/nginx/sites-available/smstk /etc/nginx/sites-enabled/
        sudo nginx -t && sudo systemctl reload nginx
        echo -e "${GREEN}✅ Nginx konfigürasyonu güncellendi${NC}"
    fi
fi

echo -e "${GREEN}🎉 API sorun giderme tamamlandı!${NC}"
echo -e "${BLUE}📋 Sonraki adımlar:${NC}"
echo -e "1. ${YELLOW}server/.env dosyasını sunucu bilgilerinizle düzenleyin${NC}"
echo -e "2. ${YELLOW}nginx-config.conf dosyasında domain adınızı değiştirin${NC}"
echo -e "3. ${YELLOW}SSL sertifikası ekleyin (Let's Encrypt)${NC}"
echo -e "4. ${YELLOW}Firewall ayarlarını kontrol edin${NC}"

