#!/bin/bash

# 502 Bad Gateway Hatası Otomatik Düzeltme Scripti
# Bu script SMSTK projesindeki 502 hatasını otomatik olarak düzeltir

set -e

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
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Konfigürasyon değişkenleri
DOMAIN_NAME=""
PROJECT_DIR="/var/www"

# Konfigürasyon kontrolü
check_config() {
    log "Konfigürasyon kontrolü yapılıyor..."
    
    if [ -z "$DOMAIN_NAME" ]; then
        error "DOMAIN_NAME değişkeni boş! Lütfen domain adını girin."
        exit 1
    fi
    
    if [ ! -d "$PROJECT_DIR/$DOMAIN_NAME" ]; then
        error "Proje dizini bulunamadı: $PROJECT_DIR/$DOMAIN_NAME"
        exit 1
    fi
    
    log "Konfigürasyon kontrolü tamamlandı ✅"
}

# Backend durumunu kontrol et
check_backend_status() {
    log "Backend durumu kontrol ediliyor..."
    
    # PM2 durumu
    if command -v pm2 &> /dev/null; then
        pm2_status=$(pm2 status 2>/dev/null | grep smstk-backend || echo "NOT_FOUND")
        if [[ "$pm2_status" == "NOT_FOUND" ]]; then
            warning "PM2'de smstk-backend process'i bulunamadı"
            return 1
        else
            log "PM2 process'i bulundu ✅"
            return 0
        fi
    else
        warning "PM2 bulunamadı"
        return 1
    fi
}

# Port durumunu kontrol et
check_port_status() {
    log "Port 5000 durumu kontrol ediliyor..."
    
    if lsof -i :5000 > /dev/null 2>&1; then
        log "Port 5000 aktif ✅"
        return 0
    else
        warning "Port 5000'de servis yok"
        return 1
    fi
}

# Backend'i yeniden başlat
restart_backend() {
    log "Backend yeniden başlatılıyor..."
    
    cd "$PROJECT_DIR/$DOMAIN_NAME/backend"
    
    # PM2 ile yeniden başlat
    if command -v pm2 &> /dev/null; then
        pm2 restart smstk-backend 2>/dev/null || {
            warning "PM2 restart başarısız, yeniden başlatılıyor..."
            pm2 delete smstk-backend 2>/dev/null || true
            pm2 start ecosystem.config.js 2>/dev/null || {
                error "PM2 başlatma başarısız"
                return 1
            }
        }
        log "Backend PM2 ile yeniden başlatıldı ✅"
    else
        # Manuel başlatma
        pkill -f "node.*index.js" 2>/dev/null || true
        nohup node index.js > ../logs/out.log 2> ../logs/err.log &
        log "Backend manuel olarak başlatıldı ✅"
    fi
    
    # Kısa bekleme
    sleep 3
}

# Veritabanı bağlantısını test et
test_database() {
    log "Veritabanı bağlantısı test ediliyor..."
    
    # Environment dosyasından bilgileri al
    if [ -f "$PROJECT_DIR/$DOMAIN_NAME/backend/.env" ]; then
        source "$PROJECT_DIR/$DOMAIN_NAME/backend/.env"
        
        # MySQL bağlantı testi
        if mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT 1;" > /dev/null 2>&1; then
            log "Veritabanı bağlantısı başarılı ✅"
            return 0
        else
            error "Veritabanı bağlantısı başarısız"
            return 1
        fi
    else
        error "Environment dosyası bulunamadı"
        return 1
    fi
}

# Nginx konfigürasyonunu kontrol et
check_nginx_config() {
    log "Nginx konfigürasyonu kontrol ediliyor..."
    
    if nginx -t > /dev/null 2>&1; then
        log "Nginx konfigürasyonu geçerli ✅"
        systemctl reload nginx
        log "Nginx yeniden yüklendi ✅"
        return 0
    else
        error "Nginx konfigürasyonu hatalı"
        return 1
    fi
}

# Dosya izinlerini düzelt
fix_permissions() {
    log "Dosya izinleri düzeltiliyor..."
    
    # Dosya sahipliğini düzelt
    chown -R www-data:www-data "$PROJECT_DIR/$DOMAIN_NAME/"
    
    # İzinleri düzelt
    chmod -R 755 "$PROJECT_DIR/$DOMAIN_NAME/"
    chmod 600 "$PROJECT_DIR/$DOMAIN_NAME/backend/.env" 2>/dev/null || true
    chmod 600 "$PROJECT_DIR/$DOMAIN_NAME/frontend/.env" 2>/dev/null || true
    
    # Uploads klasörü izinleri
    mkdir -p "$PROJECT_DIR/$DOMAIN_NAME/uploads"
    chmod 755 "$PROJECT_DIR/$DOMAIN_NAME/uploads"
    chown www-data:www-data "$PROJECT_DIR/$DOMAIN_NAME/uploads"
    
    log "Dosya izinleri düzeltildi ✅"
}

# Backend'i test et
test_backend() {
    log "Backend test ediliyor..."
    
    # Kısa bekleme
    sleep 2
    
    # API testi
    if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
        log "Backend API çalışıyor ✅"
        return 0
    else
        error "Backend API testi başarısız"
        return 1
    fi
}

# Logları kontrol et
check_logs() {
    log "Log dosyaları kontrol ediliyor..."
    
    # PM2 logları
    if command -v pm2 &> /dev/null; then
        echo -e "\n${BLUE}=== PM2 Logları (Son 10 satır) ===${NC}"
        pm2 logs smstk-backend --lines 10 2>/dev/null || echo "PM2 logları alınamadı"
    fi
    
    # Manuel log dosyaları
    if [ -f "$PROJECT_DIR/$DOMAIN_NAME/logs/err.log" ]; then
        echo -e "\n${BLUE}=== Error Logları (Son 10 satır) ===${NC}"
        tail -10 "$PROJECT_DIR/$DOMAIN_NAME/logs/err.log"
    fi
    
    if [ -f "$PROJECT_DIR/$DOMAIN_NAME/logs/out.log" ]; then
        echo -e "\n${BLUE}=== Output Logları (Son 10 satır) ===${NC}"
        tail -10 "$PROJECT_DIR/$DOMAIN_NAME/logs/out.log"
    fi
    
    # Nginx error logları
    if [ -f "/var/log/nginx/$DOMAIN_NAME.error.log" ]; then
        echo -e "\n${BLUE}=== Nginx Error Logları (Son 10 satır) ===${NC}"
        tail -10 "/var/log/nginx/$DOMAIN_NAME.error.log"
    fi
}

# Sistem durumunu göster
show_system_status() {
    log "Sistem durumu gösteriliyor..."
    
    echo -e "\n${BLUE}=== PM2 Durumu ===${NC}"
    pm2 status 2>/dev/null || echo "PM2 bulunamadı"
    
    echo -e "\n${BLUE}=== Port Durumu ===${NC}"
    lsof -i :5000 2>/dev/null || echo "Port 5000'de servis yok"
    
    echo -e "\n${BLUE}=== Nginx Durumu ===${NC}"
    systemctl status nginx --no-pager -l 2>/dev/null || echo "Nginx durumu alınamadı"
    
    echo -e "\n${BLUE}=== MySQL Durumu ===${NC}"
    systemctl status mysql --no-pager -l 2>/dev/null || echo "MySQL durumu alınamadı"
}

# Ana fonksiyon
main() {
    log "502 Bad Gateway Hatası Düzeltme Scripti başlatılıyor..."
    
    check_config
    
    # Sistem durumunu göster
    show_system_status
    
    # Backend durumunu kontrol et
    if ! check_backend_status; then
        warning "Backend çalışmıyor, yeniden başlatılıyor..."
        restart_backend
    fi
    
    # Port durumunu kontrol et
    if ! check_port_status; then
        warning "Port 5000'de servis yok, backend yeniden başlatılıyor..."
        restart_backend
        sleep 5
        check_port_status
    fi
    
    # Veritabanı bağlantısını test et
    test_database
    
    # Nginx konfigürasyonunu kontrol et
    check_nginx_config
    
    # Dosya izinlerini düzelt
    fix_permissions
    
    # Backend'i test et
    if test_backend; then
        log "🎉 502 Bad Gateway hatası düzeltildi!"
        log ""
        log "📋 Test Sonuçları:"
        log "   ✅ Backend çalışıyor"
        log "   ✅ Port 5000 aktif"
        log "   ✅ Veritabanı bağlantısı OK"
        log "   ✅ Nginx konfigürasyonu OK"
        log ""
        log "🌐 Test URL'leri:"
        log "   Backend: http://localhost:5000/api/health"
        log "   Frontend: https://$DOMAIN_NAME"
        log ""
        log "📊 Monitoring:"
        log "   PM2: pm2 status"
        log "   Loglar: pm2 logs smstk-backend"
    else
        error "❌ 502 hatası düzeltilemedi"
        log ""
        log "🔍 Logları kontrol edin:"
        check_logs
        log ""
        log "📞 Manuel kontrol gerekli"
    fi
}

# Script başlatma
if [ "$EUID" -ne 0 ]; then
    error "Bu script root yetkisi gerektirir!"
    exit 1
fi

# Konfigürasyon değişkenlerini ayarla
if [ -z "$1" ]; then
    echo "Kullanım: $0 <domain_name>"
    echo "Örnek: $0 example.com"
    exit 1
fi

DOMAIN_NAME="$1"

main 