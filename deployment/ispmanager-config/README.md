# 🚀 SMSTK ISPManager Deployment Paketi

Bu paket SMSTK (Stok Yönetim Sistemi) projesini ISPManager kullanarak Linux sunucuda yayınlamak için gerekli tüm dosyaları içerir.

## 📦 Paket İçeriği

```
ispmanager-config/
├── install.sh              # Otomatik kurulum scripti
├── ecosystem.config.js     # PM2 konfigürasyonu
├── nginx.conf             # Nginx konfigürasyonu
└── README.md              # Bu dosya
```

## ⚡ Hızlı Kurulum

### 1. Sunucuya Dosyaları Yükleyin
```bash
# Sunucuya SSH ile bağlanın
ssh root@your-server-ip

# Dosyaları sunucuya kopyalayın
scp -r ispmanager-config/ root@your-server-ip:/tmp/
```

### 2. Kurulum Scriptini Çalıştırın
```bash
cd /tmp/ispmanager-config
chmod +x install.sh
./install.sh yourdomain.com your_db_password your_jwt_secret
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

### Gereksinimler
- Linux sunucu (Ubuntu 20.04+ veya CentOS 7+)
- ISPManager 5.x veya üzeri
- Node.js 18+
- MySQL 8.0+ veya MariaDB 10.5+
- Nginx

### Adım Adım Kurulum

#### 1. Veritabanı Oluşturma
ISPManager'da **Databases** bölümünde:
- Database name: `smstk_db`
- Database user: `smstk_user`
- Password: Güçlü bir şifre
- Host: `localhost`

#### 2. Dosya Yapısı
```
/var/www/yourdomain.com/
├── backend/          # Node.js API
├── frontend/         # React uygulaması
├── uploads/          # Yüklenen dosyalar
├── logs/            # Log dosyaları
└── index.html       # React build dosyası
```

#### 3. Backend Kurulumu
```bash
cd /var/www/yourdomain.com/backend

# Environment dosyası oluşturun
cat > .env << EOF
PORT=5000
DB_HOST=localhost
DB_USER=smstk_user
DB_PASSWORD=your_secure_password
DB_NAME=smstk_db
DB_PORT=3306
JWT_SECRET=your-super-secure-jwt-secret-key-2024
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
EOF

# Bağımlılıkları yükleyin
npm install --production

# PM2 ile başlatın
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 4. Frontend Kurulumu
```bash
cd /var/www/yourdomain.com/frontend

# Environment dosyası oluşturun
cat > .env << EOF
REACT_APP_API_URL=https://yourdomain.com/api
REACT_APP_VERSION=1.0.0
GENERATE_SOURCEMAP=false
EOF

# Build edin
npm install
npm run build

# Build dosyalarını kopyalayın
cp -r build/* /var/www/yourdomain.com/
```

#### 5. Nginx Konfigürasyonu
ISPManager'da **WWW-domains** > **yourdomain.com** > **Nginx** bölümünde `nginx.conf` dosyasının içeriğini kullanın.

## 🔧 Konfigürasyon Dosyaları

### PM2 Ecosystem (ecosystem.config.js)
Node.js uygulamasını PM2 ile yönetmek için konfigürasyon dosyası.

### Nginx Konfigürasyonu (nginx.conf)
Web sunucusu konfigürasyonu, API proxy, SSL ayarları ve güvenlik başlıkları içerir.

## 🛠️ Yönetim Komutları

### PM2 Yönetimi
```bash
# Durum kontrolü
pm2 status

# Logları görüntüleme
pm2 logs smstk-backend

# Yeniden başlatma
pm2 restart smstk-backend

# Durdurma
pm2 stop smstk-backend

# Başlatma
pm2 start smstk-backend
```

### Nginx Yönetimi
```bash
# Konfigürasyon testi
nginx -t

# Yeniden yükleme
systemctl reload nginx

# Durum kontrolü
systemctl status nginx
```

### MySQL Yönetimi
```bash
# Bağlantı testi
mysql -u smstk_user -p smstk_db

# Veritabanı yedekleme
mysqldump -u smstk_user -p smstk_db > backup.sql

# Veritabanı geri yükleme
mysql -u smstk_user -p smstk_db < backup.sql
```

## 📊 Monitoring

### Log Dosyaları
```bash
# PM2 logları
tail -f /var/www/yourdomain.com/logs/combined.log

# Nginx logları
tail -f /var/log/nginx/yourdomain.com.access.log
tail -f /var/log/nginx/yourdomain.com.error.log

# MySQL logları
tail -f /var/log/mysql/error.log
```

### Performans İzleme
```bash
# PM2 monitoring
pm2 monit

# Sistem kaynakları
htop
df -h
free -h
```

## 🔒 Güvenlik

### Güvenlik Kontrol Listesi
- [ ] Varsayılan admin şifresini değiştirin
- [ ] JWT_SECRET'ı güçlü bir değerle değiştirin
- [ ] Firewall kurallarını kontrol edin
- [ ] SSL sertifikasının aktif olduğunu kontrol edin
- [ ] Düzenli yedekleme yapın

### Güvenlik Komutları
```bash
# Firewall durumu
ufw status

# SSL sertifikası kontrolü
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Dosya izinleri kontrolü
ls -la /var/www/yourdomain.com/
```

## 🔄 Yedekleme

### Otomatik Yedekleme
Script otomatik olarak günlük yedekleme oluşturur:
- Veritabanı yedeği: `/var/www/backups/db_backup_YYYYMMDD_HHMMSS.sql`
- Dosya yedeği: `/var/www/backups/files_backup_YYYYMMDD_HHMMSS.tar.gz`

### Manuel Yedekleme
```bash
# Veritabanı yedekleme
mysqldump -u smstk_user -p smstk_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Dosya yedekleme
tar -czf backup_$(date +%Y%m%d_%H%M%S).tar.gz /var/www/yourdomain.com/
```

## 🚨 Sorun Giderme

### Yaygın Sorunlar

#### 1. 502 Bad Gateway
```bash
# Backend durumu kontrolü
pm2 status

# Port kullanımı kontrolü
netstat -tlnp | grep :5000

# Logları kontrol et
pm2 logs smstk-backend
```

#### 2. Veritabanı Bağlantı Hatası
```bash
# MySQL servis durumu
systemctl status mysql

# Bağlantı testi
mysql -u smstk_user -p smstk_db -e "SELECT 1;"
```

#### 3. SSL Sertifikası Sorunu
```bash
# Sertifika kontrolü
openssl s_client -connect yourdomain.com:443

# ISPManager'da SSL ayarlarını kontrol edin
```

#### 4. Dosya İzinleri
```bash
# İzinleri düzelt
chown -R www-data:www-data /var/www/yourdomain.com/
chmod -R 755 /var/www/yourdomain.com/
chmod 600 /var/www/yourdomain.com/backend/.env
```

### Debug Komutları
```bash
# Sistem durumu
systemctl status nginx mysql

# Port dinleme
netstat -tlnp

# Disk kullanımı
df -h

# Bellek kullanımı
free -h

# CPU kullanımı
top
```

## 📈 Performans Optimizasyonu

### Node.js Optimizasyonu
```bash
# Node.js memory limit artırma
export NODE_OPTIONS="--max-old-space-size=2048"

# PM2 cluster mode
pm2 start index.js --name "smstk-backend" -i max
```

### MySQL Optimizasyonu
```sql
-- MySQL performans ayarları
SET GLOBAL innodb_buffer_pool_size = 1073741824; -- 1GB
SET GLOBAL query_cache_size = 67108864; -- 64MB
SET GLOBAL max_connections = 200;
```

### Nginx Optimizasyonu
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