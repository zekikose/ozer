# 🚀 SMSTK Sunucu Deployment Rehberi

## 📋 Ön Gereksinimler

### Sunucu Gereksinimleri:
- Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- Node.js 18+ 
- MySQL 8.0+
- Nginx
- PM2 (Process Manager)

### Minimum Sistem Gereksinimleri:
- CPU: 1 Core
- RAM: 2GB
- Disk: 20GB
- Port: 80, 443, 5000

## 🔧 Kurulum Adımları

### 1. Sunucu Hazırlığı

```bash
# Sistem güncellemesi
sudo apt update && sudo apt upgrade -y

# Gerekli paketler
sudo apt install -y curl wget git nginx mysql-server

# Node.js kurulumu
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 kurulumu
sudo npm install -g pm2
```

### 2. MySQL Kurulumu ve Yapılandırma

```bash
# MySQL güvenlik ayarları
sudo mysql_secure_installation

# Veritabanı oluşturma
sudo mysql -u root -p
CREATE DATABASE smstk_db;
CREATE USER 'smstk_user'@'localhost' IDENTIFIED BY 'güvenli_şifre';
GRANT ALL PRIVILEGES ON smstk_db.* TO 'smstk_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Proje Kurulumu

```bash
# Proje dizini
sudo mkdir -p /var/www/smstk
sudo chown $USER:$USER /var/www/smstk
cd /var/www/smstk

# Proje dosyalarını kopyala
git clone https://github.com/zekikose/smstk.git .
# veya dosyaları manuel kopyala

# Environment dosyası
cp deploy-config.env server/.env
nano server/.env  # Sunucu bilgilerini düzenle
```

### 4. Environment Dosyası Düzenleme

```bash
# server/.env dosyasını düzenle
nano server/.env
```

**Örnek .env içeriği:**
```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_USER=smstk_user
DB_PASSWORD=güvenli_şifre
DB_NAME=smstk_db
DB_PORT=3306

# JWT Configuration
JWT_SECRET=çok_güvenli_jwt_secret_key_buraya_yazın
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 5. Otomatik Kurulum Scripti

```bash
# Script'i çalıştır
chmod +x deploy-automated.sh
./deploy-automated.sh
```

### 6. Manuel Kurulum

```bash
# Bağımlılıkları yükle
npm run install:all

# Production build
npm run build

# Veritabanı tablolarını oluştur
NODE_PATH=server/node_modules node server-env-check.js

# PM2 ile başlat
pm2 start pm2-config.json
pm2 save
pm2 startup
```

## 🌐 Nginx Konfigürasyonu

### 1. Domain Ayarları

```bash
# nginx-config.conf dosyasını düzenle
nano nginx-config.conf
```

**Domain değiştirme:**
```nginx
server_name yourdomain.com www.yourdomain.com;
```

### 2. Nginx Kurulumu

```bash
# Konfigürasyonu kopyala
sudo cp nginx-config.conf /etc/nginx/sites-available/smstk
sudo ln -sf /etc/nginx/sites-available/smstk /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test ve yeniden başlat
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 SSL Sertifikası (Let's Encrypt)

```bash
# Certbot kurulumu
sudo apt install -y certbot python3-certbot-nginx

# SSL sertifikası
sudo certbot --nginx -d yourdomain.com --non-interactive --agree-tos --email admin@yourdomain.com

# Otomatik yenileme
sudo crontab -e
# Ekle: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔥 Firewall Ayarları

```bash
# UFW kurulumu
sudo apt install -y ufw

# Port ayarları
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw --force enable
```

## 🚀 API Sorun Giderme

### 1. Otomatik Sorun Giderme

```bash
# Sorun giderme scripti
chmod +x server-fix.sh
./server-fix.sh
```

### 2. Manuel Kontroller

```bash
# PM2 durumu
pm2 status
pm2 logs smstk-api

# API test
curl http://localhost:5000/api/health

# Veritabanı test
NODE_PATH=server/node_modules node server-env-check.js

# Port kontrolü
sudo netstat -tlnp | grep :5000
```

### 3. Yaygın Sorunlar ve Çözümler

#### ❌ Port 5000 Kullanımda
```bash
# Process'i bul ve sonlandır
lsof -ti:5000 | xargs kill -9
# veya
sudo fuser -k 5000/tcp
```

#### ❌ Veritabanı Bağlantı Hatası
```bash
# MySQL servisini kontrol et
sudo systemctl status mysql
sudo systemctl start mysql

# Kullanıcı yetkilerini kontrol et
sudo mysql -u root -p
SHOW GRANTS FOR 'smstk_user'@'localhost';
```

#### ❌ PM2 Process Çöktü
```bash
# PM2'yi yeniden başlat
pm2 delete smstk-api
pm2 start pm2-config.json
pm2 save
```

#### ❌ Nginx Hatası
```bash
# Konfigürasyon testi
sudo nginx -t

# Log dosyalarını kontrol et
sudo tail -f /var/log/nginx/error.log
```

## 📊 Monitoring ve Loglar

### PM2 Monitoring
```bash
# PM2 dashboard
pm2 monit

# Log görüntüleme
pm2 logs smstk-api --lines 100

# Process bilgileri
pm2 show smstk-api
```

### Nginx Logları
```bash
# Access log
sudo tail -f /var/log/nginx/access.log

# Error log
sudo tail -f /var/log/nginx/error.log
```

### Application Logları
```bash
# PM2 log dosyaları
tail -f /var/log/pm2/smstk-error.log
tail -f /var/log/pm2/smstk-out.log
```

## 🔄 Güncelleme ve Bakım

### 1. Kod Güncellemesi
```bash
# Yeni kodları çek
git pull origin main

# Bağımlılıkları güncelle
npm run install:all

# Production build
npm run build

# PM2'yi yeniden başlat
pm2 restart smstk-api
```

### 2. Veritabanı Yedekleme
```bash
# Yedekleme
mysqldump -u smstk_user -p smstk_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Geri yükleme
mysql -u smstk_user -p smstk_db < backup_file.sql
```

### 3. Sistem Bakımı
```bash
# Log dosyalarını temizle
sudo journalctl --vacuum-time=7d

# PM2 log temizleme
pm2 flush

# Disk kullanımı kontrolü
df -h
du -sh /var/www/smstk/*
```

## 📞 Destek ve İletişim

### Hızlı Test Komutları
```bash
# API sağlık kontrolü
curl -s http://localhost:5000/api/health | jq .

# Frontend kontrolü
curl -s http://localhost:3000 | head -10

# Veritabanı bağlantısı
NODE_PATH=server/node_modules node server-env-check.js

# Sistem durumu
pm2 status && sudo systemctl status nginx mysql
```

### Log Dosyaları Konumları
- **PM2 Logs**: `/var/log/pm2/`
- **Nginx Logs**: `/var/log/nginx/`
- **Application Logs**: `/var/www/smstk/api.log`

### Önemli Dosyalar
- **Environment**: `/var/www/smstk/server/.env`
- **PM2 Config**: `/var/www/smstk/pm2-config.json`
- **Nginx Config**: `/etc/nginx/sites-available/smstk`

---

## ✅ Başarılı Deployment Kontrol Listesi

- [ ] Node.js 18+ kurulu
- [ ] MySQL çalışıyor ve veritabanı oluşturuldu
- [ ] Environment dosyası düzenlendi
- [ ] Bağımlılıklar yüklendi
- [ ] Production build oluşturuldu
- [ ] PM2 ile API başlatıldı
- [ ] Nginx konfigürasyonu yapıldı
- [ ] SSL sertifikası eklendi
- [ ] Firewall ayarları yapıldı
- [ ] API endpoint'leri test edildi
- [ ] Frontend erişilebilir
- [ ] Veritabanı bağlantısı çalışıyor

**🎉 Tebrikler! SMSTK başarıyla deploy edildi!**
