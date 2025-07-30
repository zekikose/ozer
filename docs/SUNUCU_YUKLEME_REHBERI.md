# 🚀 SMSTK Projesi Sunucuya Yükleme Rehberi

Bu rehber SMSTK projesini ISPManager kullanarak Linux sunucuya adım adım yüklemenizi sağlar.

## 📋 Ön Gereksinimler

### Sunucu Gereksinimleri
- ✅ Linux sunucu (Ubuntu 20.04+ veya CentOS 7+)
- ✅ ISPManager 5.x veya üzeri
- ✅ Node.js 18+ desteği
- ✅ MySQL 8.0+ veya MariaDB 10.5+
- ✅ Nginx web sunucusu

### Minimum Sistem Gereksinimleri
- CPU: 2 çekirdek
- RAM: 4GB
- Disk: 20GB boş alan
- İnternet bağlantısı

## 🔧 Adım 1: Sunucuya Bağlanma

### 1.1 SSH ile Bağlanma
```bash
# Terminal veya SSH istemcisi açın
ssh root@YOUR_SERVER_IP

# Örnek:
ssh root@192.168.1.100
```

### 1.2 Sunucu Durumunu Kontrol Etme
```bash
# Sistem bilgilerini kontrol et
uname -a
cat /etc/os-release

# Disk alanını kontrol et
df -h

# Bellek kullanımını kontrol et
free -h

# CPU bilgilerini kontrol et
lscpu
```

## 📦 Adım 2: Proje Dosyalarını Sunucuya Yükleme

### 2.1 Proje Dosyalarını Hazırlama (Yerel Bilgisayarınızda)

#### Seçenek 1: Git ile Yükleme (Önerilen)
```bash
# Sunucuda proje dizinini oluştur
mkdir -p /tmp/smstk-deployment
cd /tmp/smstk-deployment

# Git repository'den klonla (eğer GitHub'da ise)
git clone https://github.com/yourusername/smstk.git
cd smstk
```

#### Seçenek 2: Dosya Transferi ile Yükleme
```bash
# Yerel bilgisayarınızda (Terminal/Mac/Linux)
# Proje klasörünü sıkıştır
tar -czf smstk-deployment.tar.gz server/ client/ deploy-ispmanager.sh quick-deploy-ispmanager.sh ispmanager-config/ ISPManager_*.md

# SCP ile sunucuya yükle
scp smstk-deployment.tar.gz root@YOUR_SERVER_IP:/tmp/

# Sunucuda aç
ssh root@YOUR_SERVER_IP
cd /tmp
tar -xzf smstk-deployment.tar.gz
cd smstk-deployment
```

#### Seçenek 3: FTP/SFTP ile Yükleme
```bash
# FileZilla veya başka FTP istemcisi kullanarak
# Dosyaları /tmp/smstk-deployment/ klasörüne yükleyin
```

### 2.2 Dosya Yapısını Kontrol Etme
```bash
# Sunucuda dosya yapısını kontrol et
ls -la /tmp/smstk-deployment/

# Beklenen yapı:
# ├── server/                    # Backend dosyaları
# ├── client/                    # Frontend dosyaları
# ├── deploy-ispmanager.sh       # Ana deployment scripti
# ├── quick-deploy-ispmanager.sh # Hızlı deployment scripti
# ├── ispmanager-config/         # Konfigürasyon dosyaları
# └── ISPManager_*.md           # Dokümantasyon
```

## 🌐 Adım 3: ISPManager'da Domain Oluşturma

### 3.1 ISPManager Paneline Erişim
```bash
# ISPManager URL'sini açın
# Genellikle: https://YOUR_SERVER_IP:1500/ispmgr
# Veya: https://YOUR_SERVER_IP:8080/ispmgr
```

### 3.2 Domain Ekleme
1. **ISPManager paneline giriş yapın**
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

### 3.3 SSL Sertifikası Ekleme
1. **SSL certificates** bölümüne gidin
2. **Create** butonuna tıklayın
3. **Let's Encrypt** seçin
4. Domain adını girin: `yourdomain.com`
5. **Create** butonuna tıklayın

## 🗄️ Adım 4: MySQL Veritabanı Oluşturma

### 4.1 ISPManager'da Veritabanı Oluşturma
1. **Databases** bölümüne gidin
2. **Create** butonuna tıklayın
3. Veritabanı bilgilerini girin:
   ```
   Database name: smstk_db
   Database user: smstk_user
   Password: [güçlü şifre oluşturun]
   Host: localhost
   ```
4. **Create** butonuna tıklayın

### 4.2 Veritabanı Yetkilendirme
1. Oluşturulan veritabanına tıklayın
2. **Privileges** sekmesine gidin
3. Kullanıcıya **ALL PRIVILEGES** verin
4. **Save** butonuna tıklayın

### 4.3 Veritabanı Bağlantı Testi
```bash
# Sunucuda MySQL bağlantısını test et
mysql -u smstk_user -p smstk_db -e "SELECT 1;"
```

## 🔧 Adım 5: Otomatik Deployment Scriptini Çalıştırma

### 5.1 Script Hazırlığı
```bash
# Sunucuda deployment dizinine git
cd /tmp/smstk-deployment

# Script dosyalarını çalıştırılabilir yap
chmod +x deploy-ispmanager.sh
chmod +x quick-deploy-ispmanager.sh

# Script dosyalarının varlığını kontrol et
ls -la *.sh
```

### 5.2 Hızlı Deployment (Önerilen)
```bash
# Hızlı deployment scriptini çalıştır
./quick-deploy-ispmanager.sh

# Script size şu bilgileri soracak:
# - Domain adı (örn: example.com)
# - MySQL root şifresi
# - Veritabanı kullanıcı şifresi
# - JWT Secret Key
```

### 5.3 Manuel Deployment (Alternatif)
```bash
# Manuel deployment scriptini çalıştır
./deploy-ispmanager.sh yourdomain.com your_db_password your_jwt_secret

# Örnek:
./deploy-ispmanager.sh smstk.example.com Smstk2024!Secure smstk-super-secure-jwt-key-2024
```

## ⚙️ Adım 6: Konfigürasyon Dosyalarını Ayarlama

### 6.1 Nginx Konfigürasyonu
```bash
# ISPManager'da WWW-domains > yourdomain.com > Nginx bölümüne gidin
# ispmanager-config/nginx.conf dosyasının içeriğini kopyalayın
# yourdomain.com yerine kendi domain adınızı yazın
```

### 6.2 PM2 Ecosystem Dosyası
```bash
# Backend dizinine ecosystem dosyasını kopyala
cp ispmanager-config/ecosystem.config.js /var/www/yourdomain.com/backend/

# Domain adını güncelle
sed -i 's/yourdomain.com/YOUR_ACTUAL_DOMAIN/g' /var/www/yourdomain.com/backend/ecosystem.config.js
```

## 🚀 Adım 7: Uygulamayı Başlatma

### 7.1 Backend Başlatma
```bash
# Backend dizinine git
cd /var/www/yourdomain.com/backend

# PM2 ile uygulamayı başlat
pm2 start ecosystem.config.js

# PM2 durumunu kontrol et
pm2 status

# PM2'yi sistem başlangıcında otomatik başlat
pm2 save
pm2 startup
```

### 7.2 Frontend Build
```bash
# Frontend dizinine git
cd /var/www/yourdomain.com/frontend

# Bağımlılıkları yükle ve build et
npm install
npm run build

# Build dosyalarını web root'a kopyala
cp -r build/* /var/www/yourdomain.com/
```

### 7.3 Dosya İzinlerini Ayarlama
```bash
# Dosya sahipliğini ayarla
chown -R www-data:www-data /var/www/yourdomain.com/

# İzinleri ayarla
chmod -R 755 /var/www/yourdomain.com/
chmod 600 /var/www/yourdomain.com/backend/.env
chmod 600 /var/www/yourdomain.com/frontend/.env
```

## 🔒 Adım 8: Güvenlik Ayarları

### 8.1 Firewall Ayarları
```bash
# UFW firewall aktif et (Ubuntu)
ufw enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS

# Firewall durumunu kontrol et
ufw status
```

### 8.2 SSL/TLS Güvenlik Ayarları
ISPManager'da SSL sertifikası ayarlarında:
- **HSTS** aktif edin
- **HTTP/2** desteğini aktif edin
- **TLS 1.3** kullanın

## 🧪 Adım 9: Test ve Doğrulama

### 9.1 Backend API Testi
```bash
# API endpoint testi
curl -X GET http://localhost:5000/api/health

# Veya tarayıcıda test et
# http://YOUR_SERVER_IP:5000/api/health
```

### 9.2 Frontend Testi
```bash
# Tarayıcıda domain adresini ziyaret et
# https://yourdomain.com
```

### 9.3 Veritabanı Testi
```bash
# Veritabanı bağlantı testi
mysql -u smstk_user -p smstk_db -e "SELECT COUNT(*) as user_count FROM users;"
```

### 9.4 SSL Sertifikası Testi
```bash
# SSL sertifikası kontrolü
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

## 📊 Adım 10: Monitoring ve Logging

### 10.1 PM2 Monitoring
```bash
# PM2 monitoring
pm2 monit

# Logları görüntüleme
pm2 logs smstk-backend
```

### 10.2 Nginx Logları
```bash
# Nginx access logları
tail -f /var/log/nginx/yourdomain.com.access.log

# Nginx error logları
tail -f /var/log/nginx/yourdomain.com.error.log
```

### 10.3 Sistem Monitoring
```bash
# Sistem kaynakları
htop
df -h
free -h
```

## 🔄 Adım 11: Yedekleme Kurulumu

### 11.1 Otomatik Yedekleme
```bash
# Yedekleme scripti otomatik olarak oluşturuldu
# Günlük yedekleme cron job'ı eklendi

# Yedekleme dizinini kontrol et
ls -la /var/www/backups/
```

### 11.2 Manuel Yedekleme Testi
```bash
# Manuel yedekleme testi
/var/www/yourdomain.com/backup.sh

# Yedekleme dosyalarını kontrol et
ls -la /var/www/backups/
```

## ✅ Adım 12: Kurulum Tamamlandı!

### 12.1 Final Kontrol Listesi
- [ ] Domain erişilebilir: `https://yourdomain.com`
- [ ] SSL sertifikası aktif
- [ ] API çalışıyor: `/api/health`
- [ ] Admin girişi çalışıyor: `admin` / `admin123`
- [ ] Veritabanı bağlantısı çalışıyor
- [ ] PM2 process'leri çalışıyor
- [ ] Nginx konfigürasyonu doğru
- [ ] Yedekleme sistemi aktif

### 12.2 Güvenlik Kontrol Listesi
- [ ] Varsayılan admin şifresini değiştirin
- [ ] JWT_SECRET'ı güçlü bir değerle değiştirin
- [ ] Firewall kurallarını kontrol edin
- [ ] Düzenli güvenlik güncellemeleri planlayın

### 12.3 Sonraki Adımlar
1. **Admin şifresini değiştirin**
2. **İlk verileri girin** (kategoriler, tedarikçiler, depolar)
3. **Kullanıcıları ekleyin**
4. **Düzenli yedekleme kontrolü yapın**
5. **Monitoring sistemini kurun**

## 🚨 Sorun Giderme

### Yaygın Sorunlar ve Çözümleri

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

## 📞 Destek

### Log Dosyaları
- **PM2 Logları**: `/var/www/yourdomain.com/logs/`
- **Nginx Logları**: `/var/log/nginx/`
- **MySQL Logları**: `/var/log/mysql/`

### Faydalı Komutlar
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

---

## 🎉 Tebrikler!

SMSTK projeniz başarıyla sunucuya yüklendi!

**Erişim Bilgileri:**
- **URL**: `https://yourdomain.com`
- **Admin**: `admin` / `admin123`

**Önemli Notlar:**
- Güvenlik için admin şifresini değiştirin
- Düzenli yedekleme yapın
- Sistem güncellemelerini takip edin
- Monitoring sistemini aktif tutun 