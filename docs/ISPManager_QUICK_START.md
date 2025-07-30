# 🚀 SMSTK ISPManager Hızlı Başlangıç Rehberi

Bu rehber SMSTK projesini ISPManager kullanarak Linux sunucuda hızlıca yayınlamanızı sağlar.

## ⚡ Hızlı Kurulum (5 Dakika)

### 1. Sunucuya Bağlanın
```bash
ssh root@your-server-ip
```

### 2. Projeyi İndirin
```bash
cd /tmp
wget https://github.com/yourusername/smstk/archive/main.zip
unzip main.zip
cd smstk-main
```

### 3. Otomatik Kurulum Scriptini Çalıştırın
```bash
chmod +x quick-deploy-ispmanager.sh
./quick-deploy-ispmanager.sh
```

Script size şu bilgileri soracak:
- Domain adı (örn: example.com)
- MySQL root şifresi
- Veritabanı kullanıcı şifresi
- JWT Secret Key

### 4. ISPManager'da Domain Oluşturun
1. ISPManager paneline giriş yapın
2. **WWW-domains** > **Create**
3. Domain bilgilerini girin
4. **Node.js** seçin
5. **Create** butonuna tıklayın

### 5. SSL Sertifikası Ekleyin
1. **SSL certificates** > **Create**
2. **Let's Encrypt** seçin
3. Domain adını girin
4. **Create** butonuna tıklayın

### 6. Test Edin
Tarayıcıda `https://yourdomain.com` adresini ziyaret edin.

**Varsayılan giriş:** `admin` / `admin123`

## 📋 Manuel Kurulum Adımları

### Adım 1: ISPManager'da Domain Oluşturma

#### 1.1 Domain Ekleme
```
ISPManager > WWW-domains > Create
├── Domain name: yourdomain.com
├── Document root: /var/www/yourdomain.com
├── PHP version: Node.js
└── Node.js version: 18.x
```

#### 1.2 SSL Sertifikası
```
ISPManager > SSL certificates > Create
├── Type: Let's Encrypt
└── Domain: yourdomain.com
```

### Adım 2: Veritabanı Oluşturma

#### 2.1 MySQL Veritabanı
```
ISPManager > Databases > Create
├── Database name: smstk_db
├── Database user: smstk_user
├── Password: [güçlü şifre]
└── Host: localhost
```

#### 2.2 Yetkilendirme
```
Databases > smstk_db > Privileges
└── ALL PRIVILEGES: ✓
```

### Adım 3: Dosya Yükleme

#### 3.1 FTP/SFTP ile Bağlantı
```bash
# FTP bilgileri
Host: yourdomain.com
Username: yourdomain.com
Password: [ISPManager'da belirlediğiniz şifre]
Port: 21 (FTP) veya 22 (SFTP)
```

#### 3.2 Dosya Yapısı
```
/var/www/yourdomain.com/
├── backend/          # Node.js API
├── frontend/         # React uygulaması
├── uploads/          # Yüklenen dosyalar
├── logs/            # Log dosyaları
└── index.html       # React build dosyası
```

### Adım 4: Backend Kurulumu

#### 4.1 Environment Dosyası
`/var/www/yourdomain.com/backend/.env`:
```env
PORT=5000
DB_HOST=localhost
DB_USER=smstk_user
DB_PASSWORD=your_secure_password
DB_NAME=smstk_db
DB_PORT=3306
JWT_SECRET=your-super-secure-jwt-secret-key-2024
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

#### 4.2 PM2 ile Başlatma
```bash
cd /var/www/yourdomain.com/backend
npm install --production
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Adım 5: Frontend Kurulumu

#### 5.1 Environment Dosyası
`/var/www/yourdomain.com/frontend/.env`:
```env
REACT_APP_API_URL=https://yourdomain.com/api
REACT_APP_VERSION=1.0.0
GENERATE_SOURCEMAP=false
```

#### 5.2 Build ve Deploy
```bash
cd /var/www/yourdomain.com/frontend
npm install
npm run build
cp -r build/* /var/www/yourdomain.com/
```

### Adım 6: Nginx Konfigürasyonu

#### 6.1 ISPManager'da Nginx Ayarları
```
WWW-domains > yourdomain.com > Nginx
└── [ispmanager-config/nginx.conf içeriğini yapıştırın]
```

#### 6.2 Domain Değiştirme
Nginx konfigürasyonunda `yourdomain.com` yerine kendi domain adınızı yazın.

## 🔧 Konfigürasyon Dosyaları

### Nginx Konfigürasyonu
`ispmanager-config/nginx.conf` dosyasını ISPManager'da kullanın.

### PM2 Ecosystem
`ispmanager-config/ecosystem.config.js` dosyasını backend klasörüne kopyalayın.

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

## 📞 Destek

### Log Dosyaları
- **PM2 Logları**: `/var/www/yourdomain.com/logs/`
- **Nginx Logları**: `/var/log/nginx/`
- **MySQL Logları**: `/var/log/mysql/`

### ISPManager Dokümantasyonu
- [ISPManager Resmi Dokümantasyonu](https://www.ispsystem.com/software/ispmanager)
- [ISPManager Node.js Desteği](https://www.ispsystem.com/software/ispmanager/nodejs)

### Topluluk Desteği
- GitHub Issues
- Stack Overflow
- ISPManager Forum

---

## ✅ Kurulum Tamamlandı!

🎉 Tebrikler! SMSTK projeniz başarıyla ISPManager ile yayınlandı.

**Sonraki adımlar:**
1. Admin şifresini değiştirin
2. İlk verileri girin
3. Kullanıcıları ekleyin
4. Düzenli yedekleme kontrolü yapın

**URL:** `https://yourdomain.com`
**Admin:** `admin` / `admin123` 