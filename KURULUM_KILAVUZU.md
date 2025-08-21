# 🚀 SMSTK Sunucu Yükleme Kılavuzu

Bu kılavuz SMSTK Stok Yönetim Sistemini sunucunuza yüklemeniz için adım adım talimatları içerir.

## 📋 Gereksinimler

### Sunucu Gereksinimleri
- **İşletim Sistemi**: Ubuntu 20.04 LTS veya üzeri
- **RAM**: Minimum 2GB (Önerilen: 4GB+)
- **CPU**: 2 çekirdek (Önerilen: 4 çekirdek+)
- **Disk**: Minimum 20GB boş alan
- **Domain**: SSL sertifikası için geçerli bir domain adı

### Yazılım Gereksinimleri
- Node.js 18.x veya üzeri
- MySQL 8.0 veya üzeri
- Nginx
- PM2 (Process Manager)
- Certbot (SSL sertifikaları için)

## 🚀 Hızlı Kurulum (Otomatik)

### Adım 1: Projeyi Sunucuya Yükleyin
```bash
# Sunucunuza SSH ile bağlanın
ssh root@your-server-ip

# Proje dosyalarını sunucuya kopyalayın
git clone https://github.com/your-username/smstk.git
cd smstk

# Otomatik deployment script'ini çalıştırın
chmod +x deploy-automated.sh
./deploy-automated.sh
```

### Adım 2: Konfigürasyon Dosyalarını Düzenleyin

#### 2.1 Environment Dosyası
```bash
nano server/.env
```

Aşağıdaki değerleri kendi bilgilerinizle değiştirin:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_secure_password
DB_NAME=smstk_db
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com
```

#### 2.2 Nginx Konfigürasyonu
```bash
nano nginx-config.conf
```

Domain adınızı değiştirin:
```nginx
server_name yourdomain.com www.yourdomain.com;
```

#### 2.3 SSL Sertifikası
```bash
# Nginx konfigürasyonunu kopyalayın
sudo cp nginx-config.conf /etc/nginx/sites-available/smstk
sudo ln -sf /etc/nginx/sites-available/smstk /etc/nginx/sites-enabled/

# SSL sertifikası alın
sudo certbot --nginx -d yourdomain.com
```

## 🔧 Manuel Kurulum

### Adım 1: Sistem Güncellemeleri
```bash
sudo apt update && sudo apt upgrade -y
```

### Adım 2: Node.js Kurulumu
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Adım 3: MySQL Kurulumu
```bash
sudo apt install mysql-server -y
sudo mysql_secure_installation
```

### Adım 4: Nginx Kurulumu
```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Adım 5: PM2 Kurulumu
```bash
sudo npm install -g pm2
```

### Adım 6: Proje Kurulumu
```bash
# Proje dizinini oluştur
sudo mkdir -p /var/www/smstk
sudo chown $USER:$USER /var/www/smstk

# Proje dosyalarını kopyala
cp -r . /var/www/smstk/
cd /var/www/smstk

# Bağımlılıkları yükle
npm run install:all

# Production build oluştur
npm run build
```

### Adım 7: Veritabanı Kurulumu
```bash
# MySQL'e bağlan
sudo mysql -u root -p

# Veritabanını oluştur
CREATE DATABASE smstk_db;
CREATE USER 'smstk_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON smstk_db.* TO 'smstk_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Adım 8: Environment Konfigürasyonu
```bash
cd /var/www/smstk/server
cp env.example .env
nano .env
```

### Adım 9: PM2 ile Uygulamayı Başlat
```bash
cd /var/www/smstk
pm2 start pm2-config.json
pm2 save
pm2 startup
```

### Adım 10: Nginx Konfigürasyonu
```bash
sudo cp nginx-config.conf /etc/nginx/sites-available/smstk
sudo ln -sf /etc/nginx/sites-available/smstk /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 Güvenlik Ayarları

### Firewall Konfigürasyonu
```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw --force enable
```

### SSL Sertifikası
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

## 📊 Monitoring ve Loglar

### PM2 Monitoring
```bash
pm2 status          # Uygulama durumu
pm2 logs smstk-api  # Logları görüntüle
pm2 monit           # Gerçek zamanlı monitoring
```

### Nginx Logları
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### MySQL Logları
```bash
sudo tail -f /var/log/mysql/error.log
```

## 🔄 Güncelleme

### Uygulama Güncelleme
```bash
cd /var/www/smstk
git pull origin main
npm run install:all
npm run build
pm2 restart smstk-api
```

### SSL Sertifikası Yenileme
```bash
sudo certbot renew --dry-run
```

## 🛠️ Sorun Giderme

### Uygulama Başlamıyor
```bash
pm2 logs smstk-api
pm2 restart smstk-api
```

### Veritabanı Bağlantı Hatası
```bash
# MySQL servisini kontrol et
sudo systemctl status mysql

# Bağlantıyı test et
mysql -u smstk_user -p smstk_db
```

### Nginx Hatası
```bash
sudo nginx -t
sudo systemctl status nginx
sudo systemctl restart nginx
```

### Port Çakışması
```bash
# Hangi portların kullanıldığını kontrol et
sudo netstat -tlnp | grep :5000
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

## 📞 Destek

Sorun yaşarsanız:
1. Logları kontrol edin
2. Konfigürasyon dosyalarını gözden geçirin
3. GitHub Issues'da sorun bildirin

## 🎯 Başarı Kriterleri

Kurulum başarılı olduğunda:
- ✅ https://yourdomain.com adresinden uygulamaya erişebilmelisiniz
- ✅ API health check: https://yourdomain.com/api/health
- ✅ Admin girişi: admin/admin123
- ✅ PM2'de uygulama çalışıyor olmalı
- ✅ Nginx servisi aktif olmalı
- ✅ SSL sertifikası geçerli olmalı

---

**Not**: Bu kılavuz Ubuntu 20.04 LTS için hazırlanmıştır. Farklı işletim sistemleri için komutlar değişebilir.
