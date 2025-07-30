#!/bin/bash

# SMSTK ISPManager Deployment Paketi Oluşturma Scripti
# Bu script sunucuya yüklemek için gerekli tüm dosyaları paketler

set -e

# Renk kodları
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 SMSTK ISPManager Deployment Paketi Oluşturuluyor...${NC}"

# Paket adı ve versiyon
PACKAGE_NAME="smstk-ispmanager-deployment"
VERSION="1.0.0"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PACKAGE_FILE="${PACKAGE_NAME}-v${VERSION}-${TIMESTAMP}.tar.gz"

# Geçici dizin oluştur
TEMP_DIR="/tmp/${PACKAGE_NAME}-${TIMESTAMP}"
mkdir -p "$TEMP_DIR"

echo -e "${YELLOW}📦 Paket dosyaları hazırlanıyor...${NC}"

# Gerekli dosyaları kopyala
cp -r ../../server "$TEMP_DIR/"
cp -r ../../client "$TEMP_DIR/"
cp install.sh "$TEMP_DIR/"
cp ecosystem.config.js "$TEMP_DIR/"
cp nginx.conf "$TEMP_DIR/"
cp README.md "$TEMP_DIR/"

# Deployment scriptlerini kopyala
cp ../../scripts/quick-deploy-ispmanager.sh "$TEMP_DIR/"
cp ../../scripts/deploy-ispmanager.sh "$TEMP_DIR/"

# Dokümantasyon dosyalarını kopyala
mkdir -p "$TEMP_DIR/docs"
cp ../../docs/ISPManager_KURULUM_REHBERI.md "$TEMP_DIR/docs/"
cp ../../docs/ISPManager_KONTROL_LISTESI.md "$TEMP_DIR/docs/"

# Ek dosyalar oluştur
cat > "$TEMP_DIR/setup.sh" << 'EOF'
#!/bin/bash

# SMSTK ISPManager Hızlı Kurulum Scripti
echo "🚀 SMSTK ISPManager Kurulumu Başlatılıyor..."

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

echo -e "${GREEN}✅ Bilgiler alındı, kurulum başlatılıyor...${NC}"

# Kurulum scriptini çalıştır
chmod +x install.sh
./install.sh "$DOMAIN_NAME" "$DB_PASSWORD" "$JWT_SECRET"

echo ""
echo -e "${GREEN}🎉 Kurulum tamamlandı!${NC}"
echo ""
echo -e "${YELLOW}📋 Sonraki adımlar:${NC}"
echo "1. ISPManager'da domain oluşturun: $DOMAIN_NAME"
echo "2. SSL sertifikası ekleyin (Let's Encrypt)"
echo "3. https://$DOMAIN_NAME adresini ziyaret edin"
echo "4. Varsayılan giriş: admin / admin123"
echo ""
echo -e "${YELLOW}⚠️  Güvenlik için admin şifresini değiştirin!${NC}"
EOF

# Kurulum talimatları
cat > "$TEMP_DIR/KURULUM_TALIMATLARI.md" << 'EOF'
# 🚀 SMSTK ISPManager Kurulum Talimatları

## ⚡ Hızlı Kurulum (5 Dakika)

### 1. Sunucuya Dosyaları Yükleyin
```bash
# Sunucuya SSH ile bağlanın
ssh root@your-server-ip

# Dosyaları sunucuya kopyalayın (SCP ile)
scp smstk-ispmanager-deployment-v1.0.0-*.tar.gz root@your-server-ip:/tmp/

# Sunucuda dosyaları çıkarın
cd /tmp
tar -xzf smstk-ispmanager-deployment-v1.0.0-*.tar.gz
cd smstk-ispmanager-deployment-*
```

### 2. Otomatik Kurulum Scriptini Çalıştırın
```bash
chmod +x setup.sh
./setup.sh
```

### 3. ISPManager'da Domain Oluşturun
1. ISPManager paneline giriş yapın
2. **WWW-domains** > **Create** butonuna tıklayın
3. Domain bilgilerini girin:
   - **Domain name**: `yourdomain.com`
   - **Document root**: `/var/www/yourdomain.com`
   - **PHP version**: **Node.js** seçin
   - **Node.js version**: **18.x** seçin
4. **Create** butonuna tıklayın

### 4. SSL Sertifikası Ekleyin
1. **SSL certificates** > **Create** butonuna tıklayın
2. **Let's Encrypt** seçin
3. Domain adını girin
4. **Create** butonuna tıklayın

### 5. Nginx Konfigürasyonu
1. **WWW-domains** > **yourdomain.com** > **Nginx** bölümüne gidin
2. `nginx.conf` dosyasının içeriğini kopyalayın
3. Domain adını `yourdomain.com` yerine kendi domain adınızla değiştirin
4. **Save** butonuna tıklayın

### 6. Test Edin
Tarayıcıda `https://yourdomain.com` adresini ziyaret edin.

**Varsayılan giriş:** `admin` / `admin123`

## 📋 Manuel Kurulum

Detaylı kurulum talimatları için `docs/ISPManager_KURULUM_REHBERI.md` dosyasını inceleyin.

## 🛠️ Sorun Giderme

Sorun yaşarsanız:
1. Log dosyalarını kontrol edin
2. `docs/ISPManager_KONTROL_LISTESI.md` dosyasını takip edin
3. Sistem yöneticinizle iletişime geçin

## 📞 Destek

- **Dokümantasyon**: `docs/` klasörü
- **Kontrol Listesi**: `docs/ISPManager_KONTROL_LISTESI.md`
- **Detaylı Rehber**: `docs/ISPManager_KURULUM_REHBERI.md`
EOF

# Paket bilgileri
cat > "$TEMP_DIR/PACKAGE_INFO.txt" << EOF
SMSTK ISPManager Deployment Paketi
==================================

Paket Adı: $PACKAGE_NAME
Versiyon: $VERSION
Oluşturulma Tarihi: $(date)
Sunucu Gereksinimleri:
- Linux (Ubuntu 20.04+ veya CentOS 7+)
- ISPManager 5.x+
- Node.js 18+
- MySQL 8.0+ veya MariaDB 10.5+
- Nginx

İçerik:
- Backend (Node.js API)
- Frontend (React uygulaması)
- Kurulum scriptleri
- Konfigürasyon dosyaları
- Dokümantasyon

Kurulum:
1. Dosyaları sunucuya yükleyin
2. setup.sh scriptini çalıştırın
3. ISPManager'da domain oluşturun
4. SSL sertifikası ekleyin
5. Nginx konfigürasyonunu yapın

Varsayılan Giriş:
- URL: https://yourdomain.com
- Kullanıcı: admin
- Şifre: admin123

Güvenlik: Kurulum sonrası admin şifresini değiştirmeyi unutmayın!
EOF

# Dosya izinlerini ayarla
chmod +x "$TEMP_DIR/setup.sh"
chmod +x "$TEMP_DIR/install.sh"
chmod +x "$TEMP_DIR/quick-deploy-ispmanager.sh"
chmod +x "$TEMP_DIR/deploy-ispmanager.sh"

# Paket oluştur
echo -e "${YELLOW}📦 Paket sıkıştırılıyor...${NC}"
cd /tmp
tar -czf "$PACKAGE_FILE" "${PACKAGE_NAME}-${TIMESTAMP}"

# Temizlik
rm -rf "$TEMP_DIR"

# Sonuç
echo -e "${GREEN}✅ Paket başarıyla oluşturuldu!${NC}"
echo -e "${GREEN}📁 Paket dosyası: /tmp/$PACKAGE_FILE${NC}"
echo ""
echo -e "${YELLOW}📋 Paket İçeriği:${NC}"
echo "├── server/                    # Backend (Node.js API)"
echo "├── client/                    # Frontend (React uygulaması)"
echo "├── setup.sh                   # Hızlı kurulum scripti"
echo "├── install.sh                 # Otomatik kurulum scripti"
echo "├── ecosystem.config.js        # PM2 konfigürasyonu"
echo "├── nginx.conf                 # Nginx konfigürasyonu"
echo "├── docs/                      # Dokümantasyon"
echo "│   ├── ISPManager_KURULUM_REHBERI.md"
echo "│   └── ISPManager_KONTROL_LISTESI.md"
echo "├── KURULUM_TALIMATLARI.md     # Kurulum talimatları"
echo "└── PACKAGE_INFO.txt           # Paket bilgileri"
echo ""
echo -e "${YELLOW}🚀 Sunucuya Yükleme:${NC}"
echo "1. scp /tmp/$PACKAGE_FILE root@your-server-ip:/tmp/"
echo "2. ssh root@your-server-ip"
echo "3. cd /tmp && tar -xzf $PACKAGE_FILE"
echo "4. cd smstk-ispmanager-deployment-*"
echo "5. ./setup.sh"
echo ""
echo -e "${GREEN}🎉 Paket hazır! Sunucuya yükleyebilirsiniz.${NC}" 