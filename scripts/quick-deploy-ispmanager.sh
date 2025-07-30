#!/bin/bash

# SMSTK ISPManager Hızlı Deployment Script
# Bu script SMSTK projesini ISPManager ile hızlıca yayınlar

echo "🚀 SMSTK ISPManager Hızlı Deployment"
echo "======================================"

# Renk kodları
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Kullanıcıdan bilgi alma
read -p "Domain adını girin (örn: example.com): " DOMAIN_NAME
read -s -p "MySQL root şifresini girin: " MYSQL_ROOT_PASS
echo
read -s -p "Veritabanı kullanıcı şifresini girin: " DB_PASSWORD
echo
read -s -p "JWT Secret Key girin: " JWT_SECRET
echo

# Güvenlik kontrolü
if [ -z "$DOMAIN_NAME" ] || [ -z "$MYSQL_ROOT_PASS" ] || [ -z "$DB_PASSWORD" ] || [ -z "$JWT_SECRET" ]; then
    echo -e "${RED}❌ Tüm alanları doldurun!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Bilgiler alındı, deployment başlatılıyor...${NC}"

# Deployment script'ini çalıştır
if [ -f "deploy-ispmanager.sh" ]; then
    chmod +x deploy-ispmanager.sh
    ./deploy-ispmanager.sh "$DOMAIN_NAME" "$DB_PASSWORD" "$JWT_SECRET"
else
    echo -e "${RED}❌ deploy-ispmanager.sh dosyası bulunamadı!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Deployment tamamlandı!${NC}"
echo ""
echo -e "${YELLOW}📋 Sonraki adımlar:${NC}"
echo "1. ISPManager'da domain oluşturun: $DOMAIN_NAME"
echo "2. SSL sertifikası ekleyin (Let's Encrypt)"
echo "3. https://$DOMAIN_NAME adresini ziyaret edin"
echo "4. Varsayılan giriş: admin / admin123"
echo ""
echo -e "${YELLOW}⚠️  Güvenlik için admin şifresini değiştirin!${NC}" 