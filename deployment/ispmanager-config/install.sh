#!/bin/bash

# SMSTK ISPManager Otomatik Kurulum Scripti
# Bu script SMSTK projesini ISPManager ile Linux sunucuda otomatik olarak yayınlar

set -e  # Hata durumunda script'i durdur

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log fonksiyonu
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Konfigürasyon değişkenleri
DOMAIN_NAME=""
DB_NAME="smstk_db"
DB_USER="smstk_user"
DB_PASSWORD=""
JWT_SECRET=""
BACKUP_DIR="/var/www/backups"
PROJECT_DIR="/var/www"

# Konfigürasyon kontrolü
check_config() {
    log "Konfigürasyon kontrolü yapılıyor..."
    
    if [ -z "$DOMAIN_NAME" ]; then
        error "DOMAIN_NAME değişkeni boş! Lütfen domain adını girin."
    fi
    
    if [ -z "$DB_PASSWORD" ]; then
        error "DB_PASSWORD değişkeni boş! Lütfen veritabanı şifresini girin."
    fi
    
    if [ -z "$JWT_SECRET" ]; then
        error "JWT_SECRET değişkeni boş! Lütfen JWT secret key girin."
    fi
    
    log "Konfigürasyon kontrolü tamamlandı ✅"
}

# Sistem gereksinimleri kontrolü
check_requirements() {
    log "Sistem gereksinimleri kontrol ediliyor..."
    
    # Node.js kontrolü
    if ! command -v node &> /dev/null; then
        error "Node.js bulunamadı! Lütfen Node.js 18+ kurun."
    fi
    
    # NPM kontrolü
    if ! command -v npm &> /dev/null; then
        error "NPM bulunamadı! Lütfen NPM kurun."
    fi
    
    # MySQL kontrolü
    if ! command -v mysql &> /dev/null; then
        error "MySQL bulunamadı! Lütfen MySQL kurun."
    fi
    
    # PM2 kontrolü
    if ! command -v pm2 &> /dev/null; then
        warning "PM2 bulunamadı! Kuruluyor..."
        npm install -g pm2
    fi
    
    log "Sistem gereksinimleri kontrolü tamamlandı ✅"
}

# Dizin oluşturma
create_directories() {
    log "Gerekli dizinler oluşturuluyor..."
    
    mkdir -p "$PROJECT_DIR/$DOMAIN_NAME"
    mkdir -p "$PROJECT_DIR/$DOMAIN_NAME/backend"
    mkdir -p "$PROJECT_DIR/$DOMAIN_NAME/frontend"
    mkdir -p "$PROJECT_DIR/$DOMAIN_NAME/uploads"
    mkdir -p "$PROJECT_DIR/$DOMAIN_NAME/logs"
    mkdir -p "$BACKUP_DIR"
    
    log "Dizinler oluşturuldu ✅"
}

# Veritabanı kurulumu
setup_database() {
    log "Veritabanı kurulumu yapılıyor..."
    
    # Veritabanı oluşturma
    mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    
    # Kullanıcı oluşturma
    mysql -u root -p -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';"
    
    # Yetkilendirme
    mysql -u root -p -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';"
    mysql -u root -p -e "FLUSH PRIVILEGES;"
    
    log "Veritabanı kurulumu tamamlandı ✅"
}

# Backend kurulumu
setup_backend() {
    log "Backend kurulumu yapılıyor..."
    
    cd "$PROJECT_DIR/$DOMAIN_NAME/backend"
    
    # Backend dosyalarını kopyala (server/ klasöründen)
    if [ -d "../../../server" ]; then
        cp -r ../../../server/* .
    else
        error "Server klasörü bulunamadı!"
    fi
    
    # Environment dosyası oluştur
    cat > .env << EOF
PORT=5000
DB_HOST=localhost
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME
DB_PORT=3306
JWT_SECRET=$JWT_SECRET
NODE_ENV=production
CORS_ORIGIN=https://$DOMAIN_NAME
EOF
    
    # Bağımlılıkları yükle
    npm install --production
    
    # Dosya izinlerini ayarla
    chmod 755 .
    chmod 644 *.js
    chmod 644 config/*.js
    chmod 600 .env
    
    log "Backend kurulumu tamamlandı ✅"
}

# Frontend kurulumu
setup_frontend() {
    log "Frontend kurulumu yapılıyor..."
    
    cd "$PROJECT_DIR/$DOMAIN_NAME/frontend"
    
    # Frontend dosyalarını kopyala (client/ klasöründen)
    if [ -d "../../../client" ]; then
        cp -r ../../../client/* .
    else
        error "Client klasörü bulunamadı!"
    fi
    
    # Environment dosyası oluştur
    cat > .env << EOF
REACT_APP_API_URL=https://$DOMAIN_NAME/api
REACT_APP_VERSION=1.0.0
GENERATE_SOURCEMAP=false
EOF
    
    # Bağımlılıkları yükle ve build et
    npm install
    npm run build
    
    # Build dosyalarını web root'a kopyala
    cp -r build/* "$PROJECT_DIR/$DOMAIN_NAME/"
    
    # Dosya izinlerini ayarla
    chmod 755 .
    chmod 644 package.json
    chmod 600 .env
    
    log "Frontend kurulumu tamamlandı ✅"
}

# PM2 kurulumu
setup_pm2() {
    log "PM2 kurulumu yapılıyor..."
    
    cd "$PROJECT_DIR/$DOMAIN_NAME/backend"
    
    # PM2 ecosystem dosyası oluştur
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'smstk-backend',
    script: 'index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '../logs/err.log',
    out_file: '../logs/out.log',
    log_file: '../logs/combined.log',
    time: true
  }]
};
EOF
    
    # PM2 ile uygulamayı başlat
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup
    
    log "PM2 kurulumu tamamlandı ✅"
}

# Yedekleme scripti
setup_backup() {
    log "Yedekleme scripti oluşturuluyor..."
    
    cat > "$PROJECT_DIR/$DOMAIN_NAME/backup.sh" << EOF
#!/bin/bash
BACKUP_DIR="$BACKUP_DIR"
DATE=\$(date +%Y%m%d_%H%M%S)
DB_NAME="$DB_NAME"
DB_USER="$DB_USER"
DB_PASS="$DB_PASSWORD"

# Backup dizini oluştur
mkdir -p \$BACKUP_DIR

# Veritabanı yedekleme
mysqldump -u \$DB_USER -p\$DB_PASS \$DB_NAME > \$BACKUP_DIR/db_backup_\$DATE.sql

# Dosya yedekleme
tar -czf \$BACKUP_DIR/files_backup_\$DATE.tar.gz $PROJECT_DIR/$DOMAIN_NAME/backend $PROJECT_DIR/$DOMAIN_NAME/uploads

# 30 günden eski yedekleri sil
find \$BACKUP_DIR -name "*.sql" -mtime +30 -delete
find \$BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: \$DATE" >> $PROJECT_DIR/$DOMAIN_NAME/logs/backup.log
EOF
    
    chmod +x "$PROJECT_DIR/$DOMAIN_NAME/backup.sh"
    
    # Cron job ekle
    (crontab -l 2>/dev/null; echo "0 2 * * * $PROJECT_DIR/$DOMAIN_NAME/backup.sh") | crontab -
    
    log "Yedekleme scripti oluşturuldu ✅"
}

# Güvenlik ayarları
setup_security() {
    log "Güvenlik ayarları yapılıyor..."
    
    # Dosya izinlerini ayarla
    chown -R www-data:www-data "$PROJECT_DIR/$DOMAIN_NAME"
    chmod -R 755 "$PROJECT_DIR/$DOMAIN_NAME"
    chmod 600 "$PROJECT_DIR/$DOMAIN_NAME/backend/.env"
    chmod 600 "$PROJECT_DIR/$DOMAIN_NAME/frontend/.env"
    
    # Uploads klasörü izinleri
    chmod 755 "$PROJECT_DIR/$DOMAIN_NAME/uploads"
    chown www-data:www-data "$PROJECT_DIR/$DOMAIN_NAME/uploads"
    
    # Firewall ayarları (UFW varsa)
    if command -v ufw &> /dev/null; then
        ufw allow 22/tcp
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw --force enable
    fi
    
    log "Güvenlik ayarları tamamlandı ✅"
}

# Test fonksiyonu
test_deployment() {
    log "Deployment test ediliyor..."
    
    # Backend testi
    if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
        log "Backend API çalışıyor ✅"
    else
        warning "Backend API testi başarısız!"
    fi
    
    # Veritabanı testi
    if mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT 1;" > /dev/null 2>&1; then
        log "Veritabanı bağlantısı çalışıyor ✅"
    else
        warning "Veritabanı bağlantı testi başarısız!"
    fi
    
    # PM2 durumu
    pm2 status
    
    log "Deployment testi tamamlandı ✅"
}

# Ana fonksiyon
main() {
    log "SMSTK ISPManager Deployment başlatılıyor..."
    
    check_config
    check_requirements
    create_directories
    setup_database
    setup_backend
    setup_frontend
    setup_pm2
    setup_backup
    setup_security
    test_deployment
    
    log "🎉 Deployment başarıyla tamamlandı!"
    log ""
    log "📋 Özet:"
    log "   Domain: https://$DOMAIN_NAME"
    log "   Backend: http://localhost:5000"
    log "   Database: $DB_NAME"
    log "   PM2: pm2 status"
    log ""
    log "🔑 Varsayılan giriş bilgileri:"
    log "   Kullanıcı: admin"
    log "   Şifre: admin123"
    log ""
    log "⚠️  Güvenlik için admin şifresini değiştirmeyi unutmayın!"
}

# Script başlatma
if [ "$EUID" -ne 0 ]; then
    error "Bu script root yetkisi gerektirir!"
fi

# Konfigürasyon değişkenlerini ayarla
if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ]; then
    echo "Kullanım: $0 <domain_name> <db_password> <jwt_secret>"
    echo "Örnek: $0 example.com MySecurePass123 MyJWTSecretKey2024"
    exit 1
fi

DOMAIN_NAME="$1"
DB_PASSWORD="$2"
JWT_SECRET="$3"

main 