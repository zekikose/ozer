#!/bin/bash

# SMSTK ISPManager Deployment Script
# Bu script SMSTK projesini ISPManager üzerinde yayınlamak için kullanılır

set -e

echo "🚀 SMSTK ISPManager Deployment Başlatılıyor..."

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
        error "Node.js yüklü değil. ISPManager'da Node.js desteğini etkinleştirin."
    fi
    
    if ! command -v npm &> /dev/null; then
        error "npm yüklü değil. ISPManager'da Node.js desteğini etkinleştirin."
    fi
    
    if ! command -v mysql &> /dev/null; then
        warn "MySQL client yüklü değil. Veritabanı bağlantısını manuel olarak yapılandırmanız gerekebilir."
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

# Dependencies yükle
install_dependencies() {
    log "Dependencies yükleniyor..."
    
    npm install --production
    
    log "✅ Dependencies yüklendi"
}

# Gerekli klasörleri oluştur
create_directories() {
    log "Gerekli klasörler oluşturuluyor..."
    
    mkdir -p logs uploads backups
    chmod 755 logs uploads backups
    
    log "✅ Klasörler oluşturuldu"
}

# Veritabanını hazırla
setup_database() {
    log "Veritabanı hazırlanıyor..."
    
    if [ -f "scripts/init.sql" ]; then
        if command -v mysql &> /dev/null; then
            source .env
            if mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -e "USE $DB_NAME;" 2>/dev/null; then
                log "Veritabanı tabloları oluşturuluyor..."
                mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME < scripts/init.sql
                log "✅ Veritabanı tabloları oluşturuldu"
            else
                warn "⚠️ Veritabanı bağlantısı başarısız. ISPManager'da veritabanını manuel olarak oluşturun."
            fi
        else
            warn "⚠️ MySQL client yüklü değil. Veritabanı scriptini manuel olarak çalıştırın."
        fi
    else
        warn "⚠️ init.sql dosyası bulunamadı."
    fi
}

# ISPManager Node.js uygulaması için konfigürasyon
create_ispmanager_config() {
    log "ISPManager konfigürasyonu oluşturuluyor..."
    
    cat > ispmanager-nodejs.conf << EOF
# ISPManager Node.js Uygulama Konfigürasyonu
# Bu dosyayı ISPManager'da Node.js uygulaması oluştururken kullanın

Uygulama Adı: smstk
Domain: yourdomain.com
Startup File: index.js
Working Directory: /var/www/yourdomain.com
Node.js Version: 18.x
Port: 3000
Auto Restart: Evet
Start on Boot: Evet
Log Rotation: Evet

Environment Variables:
- NODE_ENV=production
- PORT=3000
- DB_HOST=localhost
- DB_USER=smstk_user
- DB_PASSWORD=your_secure_password
- DB_NAME=smstk_db
- JWT_SECRET=your_jwt_secret
- CORS_ORIGIN=https://yourdomain.com
EOF
    
    log "✅ ISPManager konfigürasyonu oluşturuldu: ispmanager-nodejs.conf"
}

# Nginx konfigürasyonu oluştur
create_nginx_config() {
    log "Nginx konfigürasyonu oluşturuluyor..."
    
    cat > ispmanager-nginx.conf << 'EOF'
# ISPManager Nginx Konfigürasyonu
# Bu konfigürasyonu ISPManager'da domain'inizin Nginx ayarlarına ekleyin

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend static files
    location / {
        root /var/www/yourdomain.com/public;
        try_files $uri $uri/ /index.html;
        
        # Cache static files
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EOF
    
    log "✅ Nginx konfigürasyonu oluşturuldu: ispmanager-nginx.conf"
}

# Backup scripti oluştur
create_backup_script() {
    log "Backup scripti oluşturuluyor..."
    
    cat > backup.sh << 'EOF'
#!/bin/bash

# SMSTK Backup Script (ISPManager)
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Environment variables'ları yükle
source .env

# Database backup (if MySQL client is available)
if command -v mysql &> /dev/null; then
    mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql
    echo "Database backup completed: $BACKUP_DIR/db_backup_$DATE.sql"
fi

# Application files backup
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz --exclude=node_modules --exclude=logs .

echo "Application backup completed: $BACKUP_DIR/app_backup_$DATE.tar.gz"

# Clean old backups (keep last 30 days)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/"
EOF
    
    chmod +x backup.sh
    log "✅ Backup scripti oluşturuldu"
}

# Test scripti oluştur
create_test_script() {
    log "Test scripti oluşturuluyor..."
    
    cat > test-deployment.sh << 'EOF'
#!/bin/bash

# SMSTK Deployment Test Script
echo "🧪 SMSTK Deployment Test Başlatılıyor..."

# Environment kontrolü
if [ ! -f .env ]; then
    echo "❌ .env dosyası bulunamadı"
    exit 1
fi

# Node.js kontrolü
if ! command -v node &> /dev/null; then
    echo "❌ Node.js yüklü değil"
    exit 1
fi

# npm kontrolü
if ! command -v npm &> /dev/null; then
    echo "❌ npm yüklü değil"
    exit 1
fi

# Dependencies kontrolü
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules klasörü bulunamadı"
    exit 1
fi

# Veritabanı bağlantı testi
source .env
if command -v mysql &> /dev/null; then
    if mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -e "USE $DB_NAME;" 2>/dev/null; then
        echo "✅ Veritabanı bağlantısı başarılı"
    else
        echo "⚠️ Veritabanı bağlantısı başarısız"
    fi
else
    echo "⚠️ MySQL client yüklü değil"
fi

# Port kontrolü
if netstat -tlnp | grep -q ":3000"; then
    echo "⚠️ Port 3000 kullanımda"
else
    echo "✅ Port 3000 boş"
fi

# Dosya izinleri kontrolü
if [ -w "logs" ] && [ -w "uploads" ] && [ -w "backups" ]; then
    echo "✅ Dosya izinleri doğru"
else
    echo "❌ Dosya izinleri yanlış"
fi

echo "✅ Test tamamlandı"
EOF
    
    chmod +x test-deployment.sh
    log "✅ Test scripti oluşturuldu"
}

# Ana deployment fonksiyonu
main() {
    log "SMSTK ISPManager Deployment başlatılıyor..."
    
    check_requirements
    check_env
    install_dependencies
    create_directories
    setup_database
    create_ispmanager_config
    create_nginx_config
    create_backup_script
    create_test_script
    
    log "🎉 ISPManager Deployment hazırlığı tamamlandı!"
    log ""
    log "📋 Sonraki Adımlar:"
    log ""
    log "1. ISPManager'a giriş yapın"
    log "2. 'WWW-domains' bölümünde domain oluşturun"
    log "3. 'Databases' bölümünde veritabanı oluşturun"
    log "4. 'Node.js' bölümünde uygulama oluşturun"
    log "5. ispmanager-nodejs.conf dosyasındaki ayarları kullanın"
    log "6. ispmanager-nginx.conf dosyasını Nginx ayarlarına ekleyin"
    log ""
    log "📁 Oluşturulan Dosyalar:"
    log "   - ispmanager-nodejs.conf (Node.js konfigürasyonu)"
    log "   - ispmanager-nginx.conf (Nginx konfigürasyonu)"
    log "   - backup.sh (Backup scripti)"
    log "   - test-deployment.sh (Test scripti)"
    log ""
    log "🔧 Test Etmek İçin:"
    log "   ./test-deployment.sh"
    log ""
    log "📞 Destek:"
    log "   ISPManager loglarını kontrol edin"
    log "   Node.js uygulama loglarını kontrol edin"
}

# Scripti çalıştır
main "$@" 