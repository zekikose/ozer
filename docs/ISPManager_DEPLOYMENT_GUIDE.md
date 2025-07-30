# SMSTK Projesi ISPManager ile Linux Sunucuda Yayınlama Rehberi

## 📋 Ön Gereksinimler

### Sunucu Gereksinimleri
- Linux sunucu (Ubuntu 20.04+ veya CentOS 7+)
- ISPManager 5.x veya üzeri
- Node.js 18+ desteği
- MySQL 8.0+ veya MariaDB 10.5+
- Nginx web sunucusu

### Minimum Sistem Gereksinimleri
- CPU: 2 çekirdek
- RAM: 4GB
- Disk: 20GB boş alan
- İnternet bağlantısı

## 🚀 Adım 1: ISPManager'da Domain ve Hosting Oluşturma

### 1.1 Domain Ekleme
1. ISPManager paneline giriş yapın
2. **WWW-domains** bölümüne gidin
3. **Create** butonuna tıklayın
4. Domain bilgilerini girin:
   - **Domain name**: `yourdomain.com`
   - **Document root**: `/var/www/yourdomain.com`
   - **PHP version**: **Node.js** seçin
   - **Node.js version**: **18.x** seçin

### 1.2 SSL Sertifikası Ekleme
1. **SSL certificates** bölümüne gidin
2. **Create** butonuna tıklayın
3. **Let's Encrypt** seçin
4. Domain adını girin ve **Create** butonuna tıklayın

## 🗄️ Adım 2: MySQL Veritabanı Oluşturma

### 2.1 Veritabanı Oluşturma
1. ISPManager'da **Databases** bölümüne gidin
2. **Create** butonuna tıklayın
3. Veritabanı bilgilerini girin:
   - **Database name**: `smstk_db`
   - **Database user**: `smstk_user`
   - **Password**: Güçlü bir şifre oluşturun (örn: `Smstk2024!Secure`)
   - **Host**: `localhost`

### 2.2 Veritabanı Kullanıcısı Yetkilendirme
1. Oluşturulan veritabanına tıklayın
2. **Privileges** sekmesine gidin
3. Kullanıcıya **ALL PRIVILEGES** verin
4. **Save** butonuna tıklayın

## 📁 Adım 3: Proje Dosyalarını Sunucuya Yükleme

### 3.1 FTP/SFTP ile Bağlantı
```bash
# FTP bilgileri (ISPManager'dan alınacak)
Host: yourdomain.com
Username: yourdomain.com
Password: [ISPManager'da belirlediğiniz şifre]
Port: 21 (FTP) veya 22 (SFTP)
```

### 3.2 Dosya Yapısı
```
/var/www/yourdomain.com/
├── backend/          # Node.js API
├── frontend/         # React uygulaması
├── uploads/          # Yüklenen dosyalar
└── logs/            # Log dosyaları
```

## 🔧 Adım 4: Backend (Node.js API) Kurulumu

### 4.1 Backend Dosyalarını Yükleme
1. `server/` klasöründeki tüm dosyaları `backend/` klasörüne yükleyin
2. Dosya izinlerini ayarlayın:
```bash
chmod 755 /var/www/yourdomain.com/backend
chmod 644 /var/www/yourdomain.com/backend/*.js
chmod 644 /var/www/yourdomain.com/backend/config/*.js
```

### 4.2 Environment Dosyası Oluşturma
`/var/www/yourdomain.com/backend/.env` dosyası oluşturun:
```env
PORT=5000
DB_HOST=localhost
DB_USER=smstk_user
DB_PASSWORD=Smstk2024!Secure
DB_NAME=smstk_db
DB_PORT=3306
JWT_SECRET=your-super-secure-jwt-secret-key-2024
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

### 4.3 Node.js Bağımlılıklarını Yükleme
```bash
cd /var/www/yourdomain.com/backend
npm install --production
```

### 4.4 PM2 ile Process Yönetimi
```bash
# PM2 global kurulum
npm install -g pm2

# Uygulamayı PM2 ile başlatma
pm2 start index.js --name "smstk-backend"

# PM2 startup script oluşturma
pm2 startup
pm2 save
```

## ⚛️ Adım 5: Frontend (React) Kurulumu

### 5.1 Frontend Dosyalarını Yükleme
1. `client/` klasöründeki tüm dosyaları `frontend/` klasörüne yükleyin
2. Dosya izinlerini ayarlayın:
```bash
chmod 755 /var/www/yourdomain.com/frontend
chmod 644 /var/www/yourdomain.com/frontend/package.json
```

### 5.2 Environment Dosyası Oluşturma
`/var/www/yourdomain.com/frontend/.env` dosyası oluşturun:
```env
REACT_APP_API_URL=https://yourdomain.com/api
REACT_APP_VERSION=1.0.0
GENERATE_SOURCEMAP=false
```

### 5.3 React Uygulamasını Build Etme
```bash
cd /var/www/yourdomain.com/frontend
npm install
npm run build
```

### 5.4 Build Dosyalarını Web Root'a Kopyalama
```bash
# Build dosyalarını web root'a kopyala
cp -r /var/www/yourdomain.com/frontend/build/* /var/www/yourdomain.com/

# Dosya izinlerini ayarla
chown -R www-data:www-data /var/www/yourdomain.com/
chmod -R 755 /var/www/yourdomain.com/
```

## 🌐 Adım 6: Nginx Konfigürasyonu

### 6.1 ISPManager'da Nginx Ayarları
1. **WWW-domains** > **yourdomain.com** > **Settings** bölümüne gidin
2. **Apache** yerine **Nginx** seçin
3. **Node.js** desteğini aktif edin

### 6.2 Nginx Konfigürasyon Dosyası
ISPManager'da **WWW-domains** > **yourdomain.com** > **Nginx** bölümünde aşağıdaki konfigürasyonu ekleyin:

```nginx
# API Proxy
location /api/ {
    proxy_pass http://localhost:5000/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 86400;
}

# Static files
location / {
    try_files $uri $uri/ /index.html;
}

# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

## 🔒 Adım 7: Güvenlik Ayarları

### 7.1 Firewall Ayarları
```bash
# UFW firewall aktif etme
ufw enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3306/tcp  # MySQL (sadece localhost)
```

### 7.2 Dosya İzinleri
```bash
# Kritik dosyaların izinlerini kısıtlama
chmod 600 /var/www/yourdomain.com/backend/.env
chmod 600 /var/www/yourdomain.com/frontend/.env

# Uploads klasörü izinleri
mkdir -p /var/www/yourdomain.com/uploads
chmod 755 /var/www/yourdomain.com/uploads
chown www-data:www-data /var/www/yourdomain.com/uploads
```

### 7.3 SSL/TLS Güvenlik Ayarları
ISPManager'da SSL sertifikası ayarlarında:
- **HSTS** aktif edin
- **HTTP/2** desteğini aktif edin
- **TLS 1.3** kullanın

## 🚀 Adım 8: Uygulamayı Başlatma ve Test

### 8.1 Backend Başlatma
```bash
cd /var/www/yourdomain.com/backend
pm2 start index.js --name "smstk-backend"
pm2 status
```

### 8.2 Veritabanı Bağlantı Testi
```bash
# MySQL bağlantı testi
mysql -u smstk_user -p smstk_db -e "SELECT 1;"
```

### 8.3 API Testi
```bash
# API endpoint testi
curl -X GET https://yourdomain.com/api/health
```

### 8.4 Frontend Testi
Tarayıcıda `https://yourdomain.com` adresini ziyaret edin.

## 📊 Adım 9: Monitoring ve Logging

### 9.1 PM2 Monitoring
```bash
# PM2 monitoring
pm2 monit

# Logları görüntüleme
pm2 logs smstk-backend
```

### 9.2 Nginx Logları
```bash
# Nginx access logları
tail -f /var/log/nginx/yourdomain.com.access.log

# Nginx error logları
tail -f /var/log/nginx/yourdomain.com.error.log
```

### 9.3 MySQL Logları
```bash
# MySQL slow query logları
tail -f /var/log/mysql/slow.log
```

## 🔄 Adım 10: Otomatik Yedekleme

### 10.1 Veritabanı Yedekleme Scripti
`/var/www/yourdomain.com/backup.sh` dosyası oluşturun:

```bash
#!/bin/bash
BACKUP_DIR="/var/www/yourdomain.com/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="smstk_db"
DB_USER="smstk_user"
DB_PASS="Smstk2024!Secure"

# Backup dizini oluştur
mkdir -p $BACKUP_DIR

# Veritabanı yedekleme
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Dosya yedekleme
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz /var/www/yourdomain.com/backend /var/www/yourdomain.com/uploads

# 30 günden eski yedekleri sil
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

### 10.2 Cron Job Ekleme
```bash
# Crontab düzenleme
crontab -e

# Günlük yedekleme (her gece 02:00'da)
0 2 * * * /var/www/yourdomain.com/backup.sh >> /var/log/backup.log 2>&1
```

## 🛠️ Adım 11: Sorun Giderme

### 11.1 Yaygın Sorunlar ve Çözümleri

#### Port 5000 Kullanımda
```bash
# Port kullanımını kontrol et
netstat -tlnp | grep :5000

# Gerekirse process'i sonlandır
kill -9 [PID]
```

#### Veritabanı Bağlantı Hatası
```bash
# MySQL servis durumu
systemctl status mysql

# MySQL bağlantı testi
mysql -u smstk_user -p -h localhost smstk_db
```

#### Nginx 502 Bad Gateway
```bash
# Backend servis durumu
pm2 status

# Nginx error logları
tail -f /var/log/nginx/error.log
```

### 11.2 Log Dosyaları
```bash
# PM2 logları
pm2 logs smstk-backend --lines 100

# Nginx logları
tail -f /var/log/nginx/yourdomain.com.error.log

# MySQL logları
tail -f /var/log/mysql/error.log
```

## 📈 Adım 12: Performans Optimizasyonu

### 12.1 Node.js Optimizasyonu
```bash
# Node.js memory limit artırma
export NODE_OPTIONS="--max-old-space-size=2048"

# PM2 cluster mode
pm2 start index.js --name "smstk-backend" -i max
```

### 12.2 MySQL Optimizasyonu
```sql
-- MySQL performans ayarları
SET GLOBAL innodb_buffer_pool_size = 1073741824; -- 1GB
SET GLOBAL query_cache_size = 67108864; -- 64MB
SET GLOBAL max_connections = 200;
```

### 12.3 Nginx Optimizasyonu
```nginx
# Nginx performans ayarları
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

## ✅ Kurulum Tamamlandı!

### Test Edilecek Özellikler:
1. ✅ Ana sayfa yükleniyor mu?
2. ✅ Kullanıcı girişi çalışıyor mu?
3. ✅ API endpoint'leri erişilebilir mi?
4. ✅ Veritabanı işlemleri çalışıyor mu?
5. ✅ Dosya yükleme çalışıyor mu?
6. ✅ SSL sertifikası aktif mi?

### Varsayılan Giriş Bilgileri:
- **Kullanıcı Adı**: `admin`
- **Şifre**: `admin123`
- **URL**: `https://yourdomain.com`

### Güvenlik Önerileri:
1. Varsayılan admin şifresini değiştirin
2. JWT_SECRET'ı güçlü bir değerle değiştirin
3. Düzenli güvenlik güncellemeleri yapın
4. Firewall kurallarını gözden geçirin

---

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Log dosyalarını kontrol edin
2. ISPManager dokümantasyonunu inceleyin
3. Sistem yöneticinizle iletişime geçin

**Not**: Bu rehber genel bir kurulum sürecini açıklar. Sunucu konfigürasyonunuza göre bazı adımlar farklılık gösterebilir. 