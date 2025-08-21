#!/bin/bash

echo "🚀 SMSTK Backend API Kurulum Scripti"
echo "===================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

set -e

# 1. Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Bu script proje kök dizininde çalıştırılmalıdır${NC}"
    exit 1
fi

# 2. Check if server directory exists
if [ ! -d "server" ]; then
    echo -e "${RED}❌ Server dizini bulunamadı${NC}"
    echo -e "${YELLOW}💡 Backend dosyalarını yüklediğinizden emin olun${NC}"
    exit 1
fi

# 3. Install backend dependencies
echo -e "${BLUE}📦 Backend bağımlılıkları yükleniyor...${NC}"
cd server
npm install
cd ..

# 4. Create environment file
echo -e "${BLUE}⚙️ Environment dosyası oluşturuluyor...${NC}"
if [ ! -f "server/.env" ]; then
    cp server/env.example server/.env
    echo -e "${YELLOW}⚠️ Lütfen server/.env dosyasını düzenleyin${NC}"
    echo -e "${BLUE}📋 Gerekli ayarlar:${NC}"
    echo "   - DB_HOST=localhost"
    echo "   - DB_USER=root"
    echo "   - DB_PASSWORD=your_mysql_password"
    echo "   - DB_NAME=smstk_db"
    echo "   - JWT_SECRET=your_secure_secret"
    echo "   - CORS_ORIGIN=https://yourdomain.com"
else
    echo -e "${GREEN}✅ Environment dosyası mevcut${NC}"
fi

# 5. Test database connection
echo -e "${BLUE}🗄️ Veritabanı bağlantısı test ediliyor...${NC}"
if [ -f "server-db-test.js" ]; then
    node server-db-test.js
else
    echo -e "${YELLOW}⚠️ Veritabanı test scripti bulunamadı${NC}"
fi

# 6. Check PM2
echo -e "${BLUE}📊 PM2 kontrol ediliyor...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}📦 PM2 yükleniyor...${NC}"
    npm install -g pm2
fi

# 7. Start backend with PM2
echo -e "${BLUE}🚀 Backend PM2 ile başlatılıyor...${NC}"
if [ -f "pm2-config.json" ]; then
    pm2 start pm2-config.json
    pm2 save
    pm2 startup
else
    echo -e "${YELLOW}📋 PM2 config bulunamadı, manuel başlatılıyor...${NC}"
    pm2 start server/index.js --name "smstk-api" --env production
    pm2 save
fi

# 8. Wait for server to start
echo -e "${BLUE}⏳ Sunucu başlatılıyor...${NC}"
sleep 5

# 9. Test API endpoints
echo -e "${BLUE}🔍 API endpoint'leri test ediliyor...${NC}"

# Health check
echo "Health Check:"
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo -e "${GREEN}✅ Health check başarılı${NC}"
else
    echo -e "${RED}❌ Health check başarısız${NC}"
fi

# Dashboard test
echo "Dashboard:"
if curl -s http://localhost:5000/api/dashboard > /dev/null; then
    echo -e "${GREEN}✅ Dashboard API çalışıyor${NC}"
else
    echo -e "${RED}❌ Dashboard API çalışmıyor${NC}"
fi

# Products test
echo "Products:"
if curl -s http://localhost:5000/api/products > /dev/null; then
    echo -e "${GREEN}✅ Products API çalışıyor${NC}"
else
    echo -e "${RED}❌ Products API çalışmıyor${NC}"
fi

# 10. Show PM2 status
echo -e "${BLUE}📊 PM2 Durumu:${NC}"
pm2 status

# 11. Show logs
echo -e "${BLUE}📝 Son loglar:${NC}"
pm2 logs smstk-api --lines 10

echo -e "${GREEN}🎉 Backend kurulumu tamamlandı!${NC}"
echo -e "${BLUE}📋 Sonraki adımlar:${NC}"
echo "1. server/.env dosyasını düzenleyin"
echo "2. Veritabanı bağlantısını test edin"
echo "3. Web arayüzünden giriş yapın"
echo "4. API endpoint'lerini kontrol edin"

