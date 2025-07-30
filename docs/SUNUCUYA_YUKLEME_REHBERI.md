# 🚀 Sunucuya Yükleme Rehberi

Bu rehber ile projenizi Linux sunucuya kolayca yükleyebilirsiniz.

## 📋 Gereksinimler

### Sunucu Gereksinimleri
- ✅ Linux sunucu (Ubuntu 20.04+ önerilir)
- ✅ SSH erişimi
- ✅ Root veya sudo yetkisi
- ✅ ISPManager veya cPanel (opsiyonel)

### Bilmeniz Gerekenler
- 🌐 Domain adınız
- 🔑 Sunucu SSH bilgileri
- 🗄️ MySQL root şifresi

## 🎯 Hızlı Yükleme (5 Dakika)

### 1️⃣ Sunucu Bilgilerini Hazırlayın

Aşağıdaki bilgileri not edin:

```
🌐 Domain: yourdomain.com
🔑 SSH Kullanıcı: root
🔑 SSH Şifre: your_password
🗄️ MySQL Root Şifre: your_mysql_password
🔐 JWT Secret: your_jwt_secret_key
```

### 2️⃣ Deployment Paketini Yükleyin

**Yerel bilgisayarınızda:**

```bash
# 1. Deployment paketini sunucuya kopyalayın
scp deployment/smstk-clean-deployment.tar.gz root@yourdomain.com:/tmp/

# 2. Sunucuya bağlanın
ssh root@yourdomain.com
```

### 3️⃣ Otomatik Kurulum

**Sunucuda:**

```bash
# 1. Paketi açın
cd /tmp
tar -xzf smstk-clean-deployment.tar.gz

# 2. Kurulum klasörüne gidin
cd smstk-clean-deployment

# 3. Otomatik kurulum scriptini çalıştırın
chmod +x scripts/quick-deploy-ispmanager.sh
./scripts/quick-deploy-ispmanager.sh
```

**Script size soracak:**
- Domain adınızı girin
- MySQL root şifrenizi girin  
- Veritabanı şifresi oluşturun
- JWT secret key girin

### 4️⃣ Kurulum Tamamlandı!

```
✅ Backend kuruldu ve çalışıyor
✅ Frontend build edildi
✅ Veritabanı oluşturuldu
✅ Nginx konfigürasyonu yapıldı
✅ SSL sertifikası alındı
```

**Siteniz hazır:** `https://yourdomain.com`

## 🔧 Manuel Yükleme (Detaylı)

### 1️⃣ Sunucu Hazırlığı

```bash
# Sistem güncellemesi
apt update && apt upgrade -y

# Gerekli paketler
apt install -y curl wget git nginx mysql-server
```

### 2️⃣ Node.js Kurulumu

```bash
# Node.js 18.x kurulumu
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# PM2 kurulumu
npm install -g pm2
```

### 3️⃣ MySQL Kurulumu

```bash
# MySQL güvenlik ayarları
mysql_secure_installation

# Veritabanı oluşturma
mysql -u root -p
```

```sql
CREATE DATABASE smstk_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'smstk_user'@'localhost' IDENTIFIED BY 'your_db_password';
GRANT ALL PRIVILEGES ON smstk_db.* TO 'smstk_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4️⃣ Proje Kurulumu

```bash
# Web dizinine gidin
cd /var/www

# Proje klasörü oluşturun
mkdir yourdomain.com
cd yourdomain.com

# Deployment paketini açın
tar -xzf /tmp/smstk-clean-deployment.tar.gz
```

### 5️⃣ Backend Kurulumu

```bash
# Backend klasörüne gidin
cd server

# Bağımlılıkları yükleyin
npm install

# Environment dosyası oluşturun
cp env.example .env
nano .env
```

**.env dosyası içeriği:**
```env
PORT=5000
DB_HOST=localhost
DB_USER=smstk_user
DB_PASSWORD=your_db_password
DB_NAME=smstk_db
DB_PORT=3306
JWT_SECRET=your_jwt_secret_key
NODE_ENV=production
```

```bash
# Backend'i başlatın
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 6️⃣ Frontend Kurulumu

```bash
# Frontend klasörüne gidin
cd ../client

# Bağımlılıkları yükleyin
npm install

# Production build
npm run build

# Build dosyalarını web dizinine kopyalayın
cp -r build/* ../public/
```

### 7️⃣ Nginx Konfigürasyonu

```bash
# Nginx config dosyası oluşturun
nano /etc/nginx/sites-available/yourdomain.com
```

**Nginx konfigürasyonu:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # HTTP'den HTTPS'e yönlendirme
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL sertifikaları
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Güvenlik ayarları
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Root dizin
    root /var/www/yourdomain.com/public;
    index index.html;
    
    # API proxy
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
    }
    
    # Upload dosyaları
    location /uploads/ {
        alias /var/www/yourdomain.com/server/uploads/;
    }
    
    # Static dosyalar
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Güvenlik başlıkları
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

```bash
# Nginx config'i etkinleştirin
ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Nginx'i test edin ve yeniden başlatın
nginx -t
systemctl restart nginx
```

### 8️⃣ SSL Sertifikası

```bash
# Certbot kurulumu
apt install -y certbot python3-certbot-nginx

# SSL sertifikası alın
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Otomatik yenileme
crontab -e
# Aşağıdaki satırı ekleyin:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### 9️⃣ Firewall Ayarları

```bash
# UFW kurulumu
apt install -y ufw

# Firewall ayarları
ufw allow ssh
ufw allow 'Nginx Full'
ufw enable
```

## 🚨 Sorun Giderme

### 502 Bad Gateway Hatası

```bash
# Backend durumunu kontrol edin
pm2 status
pm2 logs smstk-backend

# Port kontrolü
netstat -tlnp | grep :5000

# Otomatik düzeltme
./scripts/fix-502-error.sh yourdomain.com
```

### Veritabanı Bağlantı Hatası

```bash
# MySQL durumu
systemctl status mysql

# Bağlantı testi
mysql -u smstk_user -p smstk_db -e "SELECT 1;"
```

### Dosya İzinleri

```bash
# İzinleri düzeltin
chown -R www-data:www-data /var/www/yourdomain.com/
chmod -R 755 /var/www/yourdomain.com/
```

## 📊 Kurulum Sonrası

### Varsayılan Giriş Bilgileri
- **Kullanıcı:** `admin`
- **Şifre:** `admin123`

### Önemli URL'ler
- **Ana Site:** `https://yourdomain.com`
- **API:** `https://yourdomain.com/api/`
- **Admin Panel:** `https://yourdomain.com/admin`

### Faydalı Komutlar

```bash
# Backend durumu
pm2 status
pm2 logs smstk-backend

# Nginx durumu
systemctl status nginx
nginx -t

# MySQL durumu
systemctl status mysql

# Disk kullanımı
df -h
du -sh /var/www/yourdomain.com/
```

## 🔒 Güvenlik Önerileri

1. **Admin şifresini değiştirin**
2. **Düzenli yedekleme yapın**
3. **Sistem güncellemelerini takip edin**
4. **Firewall kurallarını kontrol edin**
5. **SSL sertifikasının geçerliliğini kontrol edin**

## 📞 Destek

Sorun yaşarsanız:
1. Log dosyalarını kontrol edin
2. `docs/502-sorun-giderme.md` dosyasını inceleyin
3. Otomatik düzeltme scriptini çalıştırın

---

## 🎉 Başarılı Kurulum!

Projeniz başarıyla sunucuya yüklendi! 

**Sonraki adımlar:**
1. Admin paneline giriş yapın
2. Şifrenizi değiştirin
3. İlk ürünlerinizi ekleyin
4. Kategorileri oluşturun

İyi çalışmalar! 🚀 