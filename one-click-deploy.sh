#!/bin/bash

# 🚀 SMSTK One-Click Deployment
# Tek komutla her şeyi yükler!

set -e

echo "🚀 SMSTK One-Click Deployment başlatılıyor..."

# Renkli çıktı
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Sistem kontrolü
echo -e "${BLUE}🔍 Sistem kontrol ediliyor...${NC}"
OS=$(uname -s)
if [[ "$OS" == "Linux" ]]; then
    echo -e "${GREEN}✅ Linux sistemi tespit edildi${NC}"
elif [[ "$OS" == "Darwin" ]]; then
    echo -e "${GREEN}✅ macOS sistemi tespit edildi${NC}"
else
    echo -e "${RED}❌ Desteklenmeyen işletim sistemi${NC}"
    exit 1
fi

# Deployment yöntemi seçimi
echo -e "${BLUE}📋 Deployment yöntemi seçin:${NC}"
echo "1) 🐳 Docker (Önerilen - En Kolay)"
echo "2) 🔧 Manuel Kurulum"
echo "3) ☁️ Cloud Deployment (AWS/DigitalOcean)"

read -p "Seçiminiz (1-3): " CHOICE

case $CHOICE in
    1)
        echo -e "${GREEN}🐳 Docker deployment seçildi${NC}"
        ./docker-deploy.sh
        ;;
    2)
        echo -e "${GREEN}🔧 Manuel kurulum seçildi${NC}"
        ./deploy-automated.sh
        ;;
    3)
        echo -e "${GREEN}☁️ Cloud deployment seçildi${NC}"
        ./cloud-deploy.sh
        ;;
    *)
        echo -e "${RED}❌ Geçersiz seçim${NC}"
        exit 1
        ;;
esac
