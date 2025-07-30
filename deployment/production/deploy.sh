#!/bin/bash

# SMSTK Production Deployment Script
# Bu script projeyi sunucuda yayınlamak için kullanılır

set -e

echo "🚀 SMSTK Production Deployment Başlatılıyor..."

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
    
    if ! command -v docker &> /dev/null; then
        error "Docker yüklü değil. Lütfen Docker'ı yükleyin."
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose yüklü değil. Lütfen Docker Compose'u yükleyin."
    fi
    
    log "✅ Gerekli araçlar mevcut"
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

# SSL sertifikalarını kontrol et
check_ssl() {
    log "SSL sertifikaları kontrol ediliyor..."
    
    if [ ! -d "ssl" ]; then
        warn "SSL klasörü bulunamadı. Oluşturuluyor..."
        mkdir -p ssl
    fi
    
    # Self-signed sertifika oluştur (geliştirme için)
    if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
        warn "SSL sertifikaları bulunamadı. Self-signed sertifika oluşturuluyor..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ssl/key.pem -out ssl/cert.pem \
            -subj "/C=TR/ST=Istanbul/L=Istanbul/O=SMSTK/CN=localhost"
    fi
    
    log "✅ SSL sertifikaları hazır"
}

# Docker imajlarını build et
build_images() {
    log "Docker imajları build ediliyor..."
    
    docker-compose build --no-cache
    
    log "✅ Docker imajları build edildi"
}

# Servisleri başlat
start_services() {
    log "Servisler başlatılıyor..."
    
    docker-compose up -d
    
    log "✅ Servisler başlatıldı"
}

# Servislerin durumunu kontrol et
check_services() {
    log "Servislerin durumu kontrol ediliyor..."
    
    sleep 10
    
    # MySQL kontrolü
    if docker-compose exec mysql mysqladmin ping -h localhost --silent; then
        log "✅ MySQL çalışıyor"
    else
        error "❌ MySQL başlatılamadı"
    fi
    
    # Backend kontrolü
    if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
        log "✅ Backend API çalışıyor"
    else
        warn "⚠️ Backend API henüz hazır değil, biraz bekleyin..."
    fi
    
    # Frontend kontrolü
    if curl -f http://localhost:80 > /dev/null 2>&1; then
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

# Database backup
docker-compose exec mysql mysqldump -u root -p$DB_PASSWORD smstk_db > $BACKUP_DIR/db_backup_$DATE.sql

# Application files backup
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz --exclude=node_modules --exclude=logs .

echo "Backup completed: $BACKUP_DIR/"
EOF
    
    chmod +x backup.sh
    log "✅ Backup scripti oluşturuldu"
}

# Ana deployment fonksiyonu
main() {
    log "SMSTK Production Deployment başlatılıyor..."
    
    check_requirements
    check_env
    check_ssl
    build_images
    start_services
    check_services
    create_backup_script
    
    log "🎉 Deployment tamamlandı!"
    log ""
    log "📱 Erişim bilgileri:"
    log "   Frontend: http://localhost (veya https://localhost)"
    log "   Backend API: http://localhost:5000"
    log "   Admin Panel: http://localhost"
    log ""
    log "🔑 Giriş bilgileri:"
    log "   Kullanıcı Adı: admin"
    log "   Şifre: admin123"
    log ""
    log "📋 Yararlı komutlar:"
    log "   Servisleri durdur: docker-compose down"
    log "   Logları görüntüle: docker-compose logs -f"
    log "   Backup al: ./backup.sh"
    log "   Servisleri yeniden başlat: docker-compose restart"
}

# Scripti çalıştır
main "$@" 