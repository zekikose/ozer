# 🚀 SMSTK Sunucu Deployment Rehberi

Bu rehber SMSTK projesini sunucuda yayınlamak için adım adım talimatları içerir.

## 📋 Ön Gereksinimler

### Sunucu Gereksinimleri
- **İşletim Sistemi:** Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **RAM:** Minimum 2GB (Önerilen: 4GB+)
- **CPU:** 2 çekirdek (Önerilen: 4 çekirdek+)
- **Disk:** Minimum 20GB boş alan
- **Port:** 80, 443, 5000 (açık olmalı)

### Yazılım Gereksinimleri
- Node.js 18+
- MySQL 8.0+
- Nginx
- PM2 (Process Manager)
- Git

## 🔧 Adım 1: Sunucu Hazırlığı

### 1.1 Sunucuya Bağlanın
```bash
ssh kullanici@sunucu_ip_adresi
```

### 1.2 Sistem Güncellemelerini Yapın
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Node.js Yükleyin
```bash
# Node.js 18.x repository'sini ekleyin
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Node.js'i yükleyin
sudo apt install -y nodejs

# Versiyonu kontrol edin
node --version
npm --version
```

### 1.4 MySQL Yükleyin
```bash
# MySQL'i yükleyin
sudo apt install -y mysql-server

# MySQL'i başlatın
sudo systemctl start mysql
sudo systemctl enable mysql

# MySQL güvenlik ayarlarını yapın
sudo mysql_secure_installation
```

### 1.5 Nginx Yükleyin
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 1.6 PM2 Yükleyin
```bash
sudo npm install -g pm2
```

## 🔧 Adım 2: Veritabanı Kurulumu

### 2.1 MySQL'e Bağlanın
```bash
sudo mysql -u root -p
```

### 2.2 Veritabanı ve Kullanıcı Oluşturun
```sql
-- Veritabanını oluşturun
CREATE DATABASE smstk_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Kullanıcı oluşturun
CREATE USER 'smstk_user'@'localhost' IDENTIFIED BY 'güvenli_şifre_buraya';

-- Yetkileri verin
GRANT ALL PRIVILEGES ON smstk_db.* TO 'smstk_user'@'localhost';
FLUSH PRIVILEGES;

-- Çıkış yapın
EXIT;
```

## 🔧 Adım 3: Proje Dosyalarını Yükleyin

### 3.1 Proje Klasörünü Oluşturun
```bash
sudo mkdir -p /var/www/smstk
sudo chown $USER:$USER /var/www/smstk
cd /var/www/smstk
```

### 3.2 Proje Dosyalarını Kopyalayın
```bash
# Yerel bilgisayarınızdan dosyaları kopyalayın
scp -r /Applications/MAMP/htdocs/smstk/production/* kullanici@sunucu_ip:/var/www/smstk/
```

### 3.3 Dosya İzinlerini Ayarlayın
```bash
sudo chown -R www-data:www-data /var/www/smstk
sudo chmod -R 755 /var/www/smstk
```

## 🔧 Adım 4: Uygulama Yapılandırması

### 4.1 Environment Dosyasını Düzenleyin
```bash
cd /var/www/smstk
cp env.example .env
nano .env
```

**.env dosyasını şu şekilde düzenleyin:**
```env
# Server Configuration
NODE_ENV=production
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_USER=smstk_user
DB_PASSWORD=güvenli_şifre_buraya
DB_NAME=smstk_db
DB_PORT=3306

# JWT Configuration
JWT_SECRET=çok_güvenli_jwt_secret_key_buraya

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com

# Security
BCRYPT_ROUNDS=12

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
```

### 4.2 Dependencies Yükleyin
```bash
npm install --production
```

### 4.3 Gerekli Klasörleri Oluşturun
```bash
mkdir -p logs uploads backups
chmod 755 logs uploads backups
```

## 🔧 Adım 5: PM2 ile Uygulamayı Başlatın

### 5.1 PM2 Konfigürasyonunu Düzenleyin
```bash
nano ecosystem.config.js
```

### 5.2 Uygulamayı Başlatın
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 5.3 Durumu Kontrol Edin
```bash
pm2 status
pm2 logs smstk
```

## 🔧 Adım 6: Nginx Yapılandırması

### 6.1 Nginx Konfigürasyon Dosyası Oluşturun
```bash
sudo nano /etc/nginx/sites-available/smstk
```

**Aşağıdaki içeriği ekleyin:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend static files
    location / {
        root /var/www/smstk/public;
        try_files $uri $uri/ /index.html;
        
        # Cache static files
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:5000;
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
```

### 6.2 Nginx Site'ını Etkinleştirin
```bash
sudo ln -s /etc/nginx/sites-available/smstk /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔧 Adım 7: SSL Sertifikası (Let's Encrypt)

### 7.1 Certbot Yükleyin
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 7.2 SSL Sertifikası Alın
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 7.3 Otomatik Yenileme
```bash
sudo crontab -e
# Aşağıdaki satırı ekleyin:
0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔧 Adım 8: Firewall Yapılandırması

### 8.1 UFW Firewall'u Etkinleştirin
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 🔧 Adım 9: Backup Sistemi

### 9.1 Backup Scripti Oluşturun
```bash
nano /var/www/smstk/backup.sh
```

**Backup scripti içeriği:**
```bash
#!/bin/bash

BACKUP_DIR="/var/www/smstk/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_USER="smstk_user"
DB_NAME="smstk_db"

mkdir -p $BACKUP_DIR

# Database backup
mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Application files backup
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz --exclude=node_modules --exclude=logs .

# Clean old backups (keep last 30 days)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/"
```

### 9.2 Backup Scriptini Çalıştırılabilir Yapın
```bash
chmod +x /var/www/smstk/backup.sh
```

### 9.3 Otomatik Backup Cron Job'u Ekleyin
```bash
crontab -e
# Aşağıdaki satırı ekleyin (her gün saat 2'de backup alır):
0 2 * * * /var/www/smstk/backup.sh
```

## 🔧 Adım 10: Monitoring ve Logging

### 10.1 PM2 Monitoring
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### 10.2 Log Rotation
```bash
sudo nano /etc/logrotate.d/smstk
```

**Log rotation konfigürasyonu:**
```
/var/www/smstk/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
}
```

## 🔧 Adım 11: Test ve Doğrulama

### 11.1 Uygulama Durumunu Kontrol Edin
```bash
# PM2 durumu
pm2 status

# Nginx durumu
sudo systemctl status nginx

# MySQL durumu
sudo systemctl status mysql

# Port kontrolü
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
sudo netstat -tlnp | grep :5000
```

### 11.2 Web Uygulamasını Test Edin
- Tarayıcıda `https://yourdomain.com` adresine gidin
- Admin paneline giriş yapın:
  - Kullanıcı Adı: `admin`
  - Şifre: `admin123`

## 🔧 Adım 12: Güvenlik Kontrolleri

### 12.1 Güvenlik Taraması
```bash
# Açık portları kontrol edin
sudo nmap -sT -O localhost

# SSL sertifikasını kontrol edin
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

### 12.2 Admin Şifresini Değiştirin
- Web arayüzünden admin paneline giriş yapın
- Kullanıcı yönetimi bölümünden admin şifresini değiştirin

## 📋 Yararlı Komutlar

### Uygulama Yönetimi
```bash
# Uygulamayı yeniden başlat
pm2 restart smstk

# Logları görüntüle
pm2 logs smstk

# Durumu kontrol et
pm2 status

# Uygulamayı durdur
pm2 stop smstk
```

### Nginx Yönetimi
```bash
# Nginx'i yeniden başlat
sudo systemctl restart nginx

# Nginx konfigürasyonunu test et
sudo nginx -t

# Nginx loglarını görüntüle
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Veritabanı Yönetimi
```bash
# MySQL'e bağlan
mysql -u smstk_user -p smstk_db

# Veritabanı yedekle
mysqldump -u smstk_user -p smstk_db > backup.sql

# Veritabanını geri yükle
mysql -u smstk_user -p smstk_db < backup.sql
```

## 🚨 Sorun Giderme

### Uygulama Başlamıyor
```bash
# PM2 loglarını kontrol edin
pm2 logs smstk

# Environment değişkenlerini kontrol edin
cat .env

# Port kullanımını kontrol edin
sudo netstat -tlnp | grep :5000
```

### Veritabanı Bağlantı Hatası
```bash
# MySQL servisini kontrol edin
sudo systemctl status mysql

# MySQL bağlantısını test edin
mysql -u smstk_user -p -h localhost smstk_db
```

### Nginx Hatası
```bash
# Nginx konfigürasyonunu test edin
sudo nginx -t

# Nginx loglarını kontrol edin
sudo tail -f /var/log/nginx/error.log
```

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Logları kontrol edin
2. Sunucu kaynaklarını kontrol edin
3. Konfigürasyon dosyalarını doğrulayın
4. Gerekirse uygulamayı yeniden başlatın

---

**🎉 Tebrikler! SMSTK uygulamanız başarıyla sunucuda yayınlandı!** 