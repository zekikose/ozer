# 🚀 SMSTK Sunucuya Yükleme Rehberi

Bu rehber SMSTK projesini ISPManager kullanarak Linux sunucuda yayınlamak için hazırlanmış paket dosyalarını kullanır.

## 📦 Hazır Paket Dosyaları

### Ana Paket
- **Dosya**: `smstk-ispmanager-deployment-v1.0.0-*.tar.gz`
- **Boyut**: ~100MB
- **İçerik**: Tüm proje dosyaları, scriptler ve dokümantasyon

### Paket İçeriği
```
smstk-ispmanager-deployment-*/
├── server/                    # Backend (Node.js API)
├── client/                    # Frontend (React uygulaması)
├── setup.sh                   # Hızlı kurulum scripti
├── install.sh                 # Otomatik kurulum scripti
├── ecosystem.config.js        # PM2 konfigürasyonu
├── nginx.conf                 # Nginx konfigürasyonu
├── docs/                      # Dokümantasyon
│   ├── ISPManager_KURULUM_REHBERI.md
│   └── ISPManager_KONTROL_LISTESI.md
├── KURULUM_TALIMATLARI.md     # Kurulum talimatları
└── PACKAGE_INFO.txt           # Paket bilgileri
```

## ⚡ Hızlı Yükleme (5 Dakika)

### 1. Sunucuya Bağlanın
```bash
ssh root@your-server-ip
```

### 2. Paket Dosyasını Sunucuya Yükleyin
```bash
# Yerel bilgisayarınızdan (SCP ile)
scp smstk-ispmanager-deployment-v1.0.0-*.tar.gz root@your-server-ip:/tmp/
```

### 3. Sunucuda Dosyaları Çıkarın
```bash
# Sunucuda
cd /tmp
tar -xzf smstk-ispmanager-deployment-v1.0.0-*.tar.gz
cd smstk-ispmanager-deployment-*
```

### 4. Otomatik Kurulum Scriptini Çalıştırın
```bash
chmod +x setup.sh
./setup.sh
```

Script size şu bilgileri soracak:
- Domain adı (örn: example.com)
- MySQL root şifresi
- Veritabanı kullanıcı şifresi
- JWT Secret Key

### 5. ISPManager'da Domain Oluşturun
1. ISPManager paneline giriş yapın
2. **WWW-domains** > **Create** butonuna tıklayın
3. Domain bilgilerini girin:
   - **Domain name**: `yourdomain.com`
   - **Document root**: `/var/www/yourdomain.com`
   - **PHP version**: **Node.js** seçin
   - **Node.js version**: **18.x** seçin
4. **Create** butonuna tıklayın

### 6. SSL Sertifikası Ekleyin
1. **SSL certificates** > **Create** butonuna tıklayın
2. **Let's Encrypt** seçin
3. Domain adını girin
4. **Create** butonuna tıklayın

### 7. Nginx Konfigürasyonu
1. **WWW-domains** > **yourdomain.com** > **Nginx** bölümüne gidin
2. `nginx.conf` dosyasının içeriğini kopyalayın
3. Domain adını `yourdomain.com` yerine kendi domain adınızla değiştirin
4. **Save** butonuna tıklayın

### 8. Test Edin
Tarayıcıda `https://yourdomain.com` adresini ziyaret edin.

**Varsayılan giriş:** `admin` / `admin123`

## 📋 Detaylı Yükleme Adımları

### Ön Gereksinimler
- ✅ Linux sunucu (Ubuntu 20.04+ veya CentOS 7+)
- ✅ ISPManager 5.x veya üzeri
- ✅ Node.js 18+ desteği
- ✅ MySQL 8.0+ veya MariaDB 10.5+
- ✅ Nginx web sunucusu
- ✅ SSH erişimi
- ✅ Domain adı

### Adım 1: Sunucu Hazırlığı
```bash
# Sunucuya SSH ile bağlanın
ssh root@your-server-ip

# Sistem güncellemelerini yapın
apt update && apt upgrade -y  # Ubuntu/Debian
# veya
yum update -y  # CentOS/RHEL

# Gerekli paketleri kurun
apt install -y curl wget git unzip  # Ubuntu/Debian
# veya
yum install -y curl wget git unzip  # CentOS/RHEL
```

### Adım 2: Paket Yükleme
```bash
# Paket dosyasını sunucuya kopyalayın (SCP ile)
scp smstk-ispmanager-deployment-v1.0.0-*.tar.gz root@your-server-ip:/tmp/

# Sunucuda dosyaları çıkarın
cd /tmp
tar -xzf smstk-ispmanager-deployment-v1.0.0-*.tar.gz
cd smstk-ispmanager-deployment-*

# Dosya izinlerini kontrol edin
ls -la
```

### Adım 3: Otomatik Kurulum
```bash
# Kurulum scriptini çalıştırın
chmod +x setup.sh
./setup.sh
```

Script size şu bilgileri soracak:
- **Domain adı**: Sunucunuzun domain adı (örn: example.com)
- **MySQL root şifresi**: MySQL root kullanıcısının şifresi
- **Veritabanı kullanıcı şifresi**: SMSTK için oluşturulacak veritabanı kullanıcısının şifresi
- **JWT Secret Key**: Güvenlik için güçlü bir JWT secret key

### Adım 4: ISPManager Konfigürasyonu

#### Domain Oluşturma
1. ISPManager paneline giriş yapın
2. **WWW-domains** bölümüne gidin
3. **Create** butonuna tıklayın
4. Domain bilgilerini girin:
   ```
   Domain name: yourdomain.com
   Document root: /var/www/yourdomain.com
   PHP version: Node.js
   Node.js version: 18.x
   ```
5. **Create** butonuna tıklayın

#### SSL Sertifikası
1. **SSL certificates** bölümüne gidin
2. **Create** butonuna tıklayın
3. **Let's Encrypt** seçin
4. Domain adını girin
5. **Create** butonuna tıklayın

#### Nginx Konfigürasyonu
1. **WWW-domains** > **yourdomain.com** > **Nginx** bölümüne gidin
2. `nginx.conf` dosyasının içeriğini kopyalayın
3. Domain adını `yourdomain.com` yerine kendi domain adınızla değiştirin
4. **Save** butonuna tıklayın

### Adım 5: Test ve Doğrulama

#### Backend Testi
```bash
# PM2 durumu kontrolü
pm2 status

# API testi
curl -X GET http://localhost:5000/api/health
```

#### Veritabanı Testi
```bash
# MySQL bağlantı testi
mysql -u smstk_user -p smstk_db -e "SELECT 1;"
```

#### Frontend Testi
1. Tarayıcıda `https://yourdomain.com` adresini ziyaret edin
2. Ana sayfa yükleniyor mu kontrol edin
3. Varsayılan giriş yapın: `admin` / `admin123`

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
2. `docs/ISPManager_KONTROL_LISTESI.md` dosyasını takip edin
3. Sistem yöneticinizle iletişime geçin

**Not**: Bu rehber genel bir kurulum sürecini açıklar. Sunucu konfigürasyonunuza göre bazı adımlar farklılık gösterebilir. 