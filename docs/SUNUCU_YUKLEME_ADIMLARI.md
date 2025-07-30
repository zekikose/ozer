# 🚀 SMSTK Projesi Sunucuya Yükleme Adımları

## 📋 Ön Gereksinimler

### Sunucu Gereksinimleri
- ✅ Linux sunucu (Ubuntu 20.04+ veya CentOS 7+)
- ✅ ISPManager 5.x veya üzeri
- ✅ Node.js 18+ desteği
- ✅ MySQL 8.0+ veya MariaDB 10.5+
- ✅ Nginx web sunucusu

### Hazırlanan Dosyalar
- ✅ **Deployment Paketi**: `smstk-production-ready.tar.gz` (97MB)
- ✅ **Otomatik Scriptler**: `deploy-ispmanager.sh`, `quick-deploy-ispmanager.sh`
- ✅ **Konfigürasyon Dosyaları**: `ispmanager-config/`
- ✅ **Dokümantasyon**: `ISPManager_*.md`

## 🔧 Adım 1: Sunucu Bilgilerini Hazırlama

### 1.1 Bilgi Formunu Doldurun
`sunucu-bilgileri-form.md` dosyasını açın ve gerekli bilgileri doldurun:

```bash
# Yerel bilgisayarınızda
open sunucu-bilgileri-form.md
```

**Gerekli bilgiler:**
- Sunucu IP adresi
- SSH erişim bilgileri
- Domain adı
- ISPManager bilgileri
- MySQL root şifresi
- JWT Secret Key

### 1.2 Güvenli Şifreler Oluşturun
```bash
# JWT Secret Key oluşturma (örnek)
echo "smstk-$(date +%s)-$(openssl rand -hex 16)-secure-key-2024"

# Veritabanı şifresi oluşturma (örnek)
echo "Smstk$(date +%Y)Secure$(openssl rand -hex 8)!"
```

## 📦 Adım 2: Proje Dosyalarını Sunucuya Yükleme

### 2.1 SCP ile Yükleme (Önerilen)
```bash
# Yerel bilgisayarınızda (Terminal)
scp smstk-production-ready.tar.gz root@YOUR_SERVER_IP:/tmp/

# Örnek:
scp smstk-production-ready.tar.gz root@192.168.1.100:/tmp/
```

### 2.2 FTP/SFTP ile Yükleme (Alternatif)
- FileZilla veya başka FTP istemcisi kullanın
- Dosyayı sunucunun `/tmp/` klasörüne yükleyin

## 🌐 Adım 3: Sunucuya Bağlanma ve Kurulum

### 3.1 SSH ile Bağlanma
```bash
# Sunucuya SSH ile bağlanın
ssh root@YOUR_SERVER_IP

# Örnek:
ssh root@192.168.1.100
```

### 3.2 Sunucu Durumunu Kontrol Etme
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

### 3.3 Dosyaları Hazırlama
```bash
# Sunucuda dosyaları açın
cd /tmp
tar -xzf smstk-production-ready.tar.gz
cd smstk-production-ready

# Dosya yapısını kontrol edin
ls -la
```

## 🚀 Adım 4: Otomatik Kurulum

### 4.1 Hızlı Kurulum (Önerilen)
```bash
# Hızlı deployment scriptini çalıştırın
chmod +x quick-deploy-ispmanager.sh
./quick-deploy-ispmanager.sh
```

Script size şu bilgileri soracak:
- Domain adı (örn: example.com)
- MySQL root şifresi
- Veritabanı kullanıcı şifresi
- JWT Secret Key

### 4.2 Manuel Kurulum (Alternatif)
```bash
# Manuel deployment scriptini çalıştırın
chmod +x deploy-ispmanager.sh
./deploy-ispmanager.sh yourdomain.com your_db_password your_jwt_secret

# Örnek:
./deploy-ispmanager.sh smstk.example.com Smstk2024!Secure smstk-super-secure-jwt-key-2024
```

## 🌐 Adım 5: ISPManager'da Domain Oluşturma

### 5.1 ISPManager Paneline Erişim
```bash
# ISPManager URL'sini açın
# Genellikle: https://YOUR_SERVER_IP:1500/ispmgr
# Veya: https://YOUR_SERVER_IP:8080/ispmgr
```

### 5.2 Domain Ekleme
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

### 5.3 SSL Sertifikası Ekleme
1. **SSL certificates** bölümüne gidin
2. **Create** butonuna tıklayın
3. **Let's Encrypt** seçin
4. Domain adını girin: `yourdomain.com`
5. **Create** butonuna tıklayın

## 🗄️ Adım 6: MySQL Veritabanı Oluşturma

### 6.1 ISPManager'da Veritabanı Oluşturma
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

### 6.2 Veritabanı Yetkilendirme
1. Oluşturulan veritabanına tıklayın
2. **Privileges** sekmesine gidin
3. Kullanıcıya **ALL PRIVILEGES** verin
4. **Save** butonuna tıklayın

## ⚙️ Adım 7: Konfigürasyon Dosyalarını Ayarlama

### 7.1 Nginx Konfigürasyonu
```bash
# ISPManager'da WWW-domains > yourdomain.com > Nginx bölümüne gidin
# ispmanager-config/nginx.conf dosyasının içeriğini kopyalayın
# yourdomain.com yerine kendi domain adınızı yazın
```

### 7.2 PM2 Ecosystem Dosyası
```bash
# Backend dizinine ecosystem dosyasını kopyala
cp ispmanager-config/ecosystem.config.js /var/www/yourdomain.com/backend/

# Domain adını güncelle
sed -i 's/yourdomain.com/YOUR_ACTUAL_DOMAIN/g' /var/www/yourdomain.com/backend/ecosystem.config.js
```

## 🚀 Adım 8: Uygulamayı Başlatma

### 8.1 Backend Başlatma
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

### 8.2 Frontend Build
```bash
# Frontend dizinine git
cd /var/www/yourdomain.com/frontend

# Bağımlılıkları yükle ve build et
npm install
npm run build

# Build dosyalarını web root'a kopyala
cp -r build/* /var/www/yourdomain.com/
```

### 8.3 Dosya İzinlerini Ayarlama
```bash
# Dosya sahipliğini ayarla
chown -R www-data:www-data /var/www/yourdomain.com/

# İzinleri ayarla
chmod -R 755 /var/www/yourdomain.com/
chmod 600 /var/www/yourdomain.com/backend/.env
chmod 600 /var/www/yourdomain.com/frontend/.env
```

## 🔒 Adım 9: Güvenlik Ayarları

### 9.1 Firewall Ayarları
```bash
# UFW firewall aktif et (Ubuntu)
ufw enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS

# Firewall durumunu kontrol et
ufw status
```

### 9.2 SSL/TLS Güvenlik Ayarları
ISPManager'da SSL sertifikası ayarlarında:
- **HSTS** aktif edin
- **HTTP/2** desteğini aktif edin
- **TLS 1.3** kullanın

## 🧪 Adım 10: Test ve Doğrulama

### 10.1 Backend API Testi
```bash
# API endpoint testi
curl -X GET http://localhost:5000/api/health

# Veya tarayıcıda test et
# http://YOUR_SERVER_IP:5000/api/health
```

### 10.2 Frontend Testi
```bash
# Tarayıcıda domain adresini ziyaret et
# https://yourdomain.com
```

### 10.3 Veritabanı Testi
```bash
# Veritabanı bağlantı testi
mysql -u smstk_user -p smstk_db -e "SELECT COUNT(*) as user_count FROM users;"
```

### 10.4 SSL Sertifikası Testi
```bash
# SSL sertifikası kontrolü
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

## 📊 Adım 11: Monitoring ve Logging

### 11.1 PM2 Monitoring
```bash
# PM2 monitoring
pm2 monit

# Logları görüntüleme
pm2 logs smstk-backend
```

### 11.2 Nginx Logları
```bash
# Nginx access logları
tail -f /var/log/nginx/yourdomain.com.access.log

# Nginx error logları
tail -f /var/log/nginx/yourdomain.com.error.log
```

### 11.3 Sistem Monitoring
```bash
# Sistem kaynakları
htop
df -h
free -h
```

## 🔄 Adım 12: Yedekleme Kurulumu

### 12.1 Otomatik Yedekleme
```bash
# Yedekleme scripti otomatik olarak oluşturuldu
# Günlük yedekleme cron job'ı eklendi

# Yedekleme dizinini kontrol et
ls -la /var/www/backups/
```

### 12.2 Manuel Yedekleme Testi
```bash
# Manuel yedekleme testi
/var/www/yourdomain.com/backup.sh

# Yedekleme dosyalarını kontrol et
ls -la /var/www/backups/
```

## ✅ Adım 13: Kurulum Tamamlandı!

### 13.1 Final Kontrol Listesi
- [ ] Domain erişilebilir: `https://yourdomain.com`
- [ ] SSL sertifikası aktif
- [ ] API çalışıyor: `/api/health`
- [ ] Admin girişi çalışıyor: `admin` / `admin123`
- [ ] Veritabanı bağlantısı çalışıyor
- [ ] PM2 process'leri çalışıyor
- [ ] Nginx konfigürasyonu doğru
- [ ] Yedekleme sistemi aktif

### 13.2 Güvenlik Kontrol Listesi
- [ ] Varsayılan admin şifresini değiştirin
- [ ] JWT_SECRET'ı güçlü bir değerle değiştirin
- [ ] Firewall kurallarını kontrol edin
- [ ] Düzenli güvenlik güncellemeleri planlayın

### 13.3 Sonraki Adımlar
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