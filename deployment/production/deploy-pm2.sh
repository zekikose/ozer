#!/bin/bash

# SMSTK Production Deployment Script (PM2 Version)
# Bu script projeyi sunucuda yayınlamak için kullanılır

set -e

echo "🚀 SMSTK Production Deployment Başlatılıyor (PM2 Version)..."

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

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Gerekli araçları kontrol et
check_requirements() {
    log "Gerekli araçlar kontrol ediliyor..."
    
    if ! command -v node &> /dev/null; then
        error "Node.js yüklü değil. Lütfen Node.js'i yükleyin."
    fi
    
    if ! command -v npm &> /dev/null; then
        error "npm yüklü değil. Lütfen npm'i yükleyin."
    fi
    
    if ! command -v mysql &> /dev/null; then
        warn "MySQL client yüklü değil. Veritabanı bağlantısını manuel olarak yapılandırmanız gerekebilir."
    fi
    
    log "✅ Gerekli araçlar mevcut"
}

# PM2 yükle
install_pm2() {
    log "PM2 yükleniyor..."
    
    if ! command -v pm2 &> /dev/null; then
        npm install -g pm2
        log "✅ PM2 yüklendi"
    else
        log "✅ PM2 zaten yüklü"
    fi
}

# Environment dosyasını kontrol et
check_env() {
    log "Environment dosyası kontrol ediliyor..."
    
    if [ ! -f .env ]; then
        warn ".env dosyası bulunamadı. env.example'dan kopyalanıyor..."
        cp env.example .env
        error "Lütfen .env dosyasını düzenleyin ve gerekli değerleri girin."
    fi
    
    # Gerekli değişkenleri kontrol et
    source .env
    
    if [ "$DB_PASSWORD" = "your_secure_password_here" ]; then
        error "Lütfen .env dosyasında DB_PASSWORD değerini değiştirin."
    fi
    
    if [ "$JWT_SECRET" = "your_super_secure_jwt_secret_key_here_change_this_in_production" ]; then
        error "Lütfen .env dosyasında JWT_SECRET değerini değiştirin."
    fi
    
    log "✅ Environment dosyası hazır"
}

# Dependencies yükle
install_dependencies() {
    log "Dependencies yükleniyor..."
    
    npm install --production
    
    log "✅ Dependencies yüklendi"
}

# Veritabanını hazırla
setup_database() {
    log "Veritabanı hazırlanıyor..."
    
    # MySQL bağlantısını test et
    if command -v mysql &> /dev/null; then
        if mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -e "USE $DB_NAME;" 2>/dev/null; then
            log "✅ Veritabanı bağlantısı başarılı"
        else
            warn "⚠️ Veritabanı bağlantısı başarısız. Manuel olarak veritabanını oluşturmanız gerekebilir."
        fi
    else
        warn "⚠️ MySQL client yüklü değil. Veritabanını manuel olarak yapılandırın."
    fi
}

# PM2 ile uygulamayı başlat
start_application() {
    log "Uygulama PM2 ile başlatılıyor..."
    
    # Eğer uygulama zaten çalışıyorsa durdur
    if pm2 list | grep -q "smstk"; then
        log "Mevcut uygulama durduruluyor..."
        pm2 stop smstk
        pm2 delete smstk
    fi
    
    # Uygulamayı başlat
    pm2 start ecosystem.config.js
    
    # PM2 startup scriptini oluştur
    pm2 startup
    pm2 save
    
    log "✅ Uygulama PM2 ile başlatıldı"
}

# Nginx yapılandırması
setup_nginx() {
    log "Nginx yapılandırması kontrol ediliyor..."
    
    if command -v nginx &> /dev/null; then
        # Nginx config dosyasını kopyala
        if [ -f nginx.conf ]; then
            sudo cp nginx.conf /etc/nginx/sites-available/smstk
            sudo ln -sf /etc/nginx/sites-available/smstk /etc/nginx/sites-enabled/
            sudo nginx -t && sudo systemctl reload nginx
            log "✅ Nginx yapılandırması tamamlandı"
        else
            warn "⚠️ nginx.conf dosyası bulunamadı"
        fi
    else
        warn "⚠️ Nginx yüklü değil. Manuel olarak web server yapılandırması yapmanız gerekebilir."
    fi
}

# Servislerin durumunu kontrol et
check_services() {
    log "Servislerin durumu kontrol ediliyor..."
    
    sleep 5
    
    # PM2 durumu
    if pm2 list | grep -q "smstk.*online"; then
        log "✅ PM2 uygulaması çalışıyor"
    else
        error "❌ PM2 uygulaması başlatılamadı"
    fi
    
    # Backend kontrolü
    if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
        log "✅ Backend API çalışıyor"
    else
        warn "⚠️ Backend API henüz hazır değil, biraz bekleyin..."
    fi
    
    # Frontend kontrolü
    if curl -f http://localhost:5000 > /dev/null 2>&1; then
        log "✅ Frontend çalışıyor"
    else
        warn "⚠️ Frontend henüz hazır değil, biraz bekleyin..."
    fi
}

# Backup scripti oluştur
create_backup_script() {
    log "Backup scripti oluşturuluyor..."
    
    cat > backup.sh << 'EOF'
#!/bin/bash

# SMSTK Backup Script
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Database backup (if MySQL client is available)
if command -v mysql &> /dev/null; then
    source .env
    mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql
    echo "Database backup completed: $BACKUP_DIR/db_backup_$DATE.sql"
fi

# Application files backup
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz --exclude=node_modules --exclude=logs .

echo "Application backup completed: $BACKUP_DIR/app_backup_$DATE.tar.gz"
echo "Backup completed: $BACKUP_DIR/"
EOF
    
    chmod +x backup.sh
    log "✅ Backup scripti oluşturuldu"
}

# Ana deployment fonksiyonu
main() {
    log "SMSTK Production Deployment başlatılıyor (PM2 Version)..."
    
    check_requirements
    install_pm2
    check_env
    install_dependencies
    setup_database
    start_application
    setup_nginx
    check_services
    create_backup_script
    
    log "🎉 Deployment tamamlandı!"
    log ""
    log "📱 Erişim bilgileri:"
    log "   Frontend & Backend: http://localhost:5000"
    log "   Admin Panel: http://localhost:5000"
    log ""
    log "🔑 Giriş bilgileri:"
    log "   Kullanıcı Adı: admin"
    log "   Şifre: admin123"
    log ""
    log "📋 Yararlı komutlar:"
    log "   Uygulamayı durdur: pm2 stop smstk"
    log "   Uygulamayı başlat: pm2 start smstk"
    log "   Logları görüntüle: pm2 logs smstk"
    log "   Backup al: ./backup.sh"
    log "   PM2 durumu: pm2 status"
    log "   Uygulamayı yeniden başlat: pm2 restart smstk"
}

# Scripti çalıştır
main "$@" 