# 📋 ISPManager Kurulum Kontrol Listesi

Bu kontrol listesi SMSTK projesini ISPManager ile yayınlarken takip etmeniz gereken adımları içerir.

## ✅ Ön Hazırlık

### Sunucu Kontrolü
- [ ] Linux sunucu hazır (Ubuntu 20.04+ veya CentOS 7+)
- [ ] ISPManager 5.x kurulu
- [ ] Node.js 18+ kurulu
- [ ] MySQL 8.0+ kurulu
- [ ] Nginx kurulu
- [ ] Domain adı hazır
- [ ] SSH erişimi aktif

### Sistem Gereksinimleri
- [ ] CPU: 2+ çekirdek
- [ ] RAM: 4GB+
- [ ] Disk: 20GB+ boş alan
- [ ] İnternet bağlantısı stabil

## 🚀 Hızlı Kurulum (5 Dakika)

### Otomatik Script
- [ ] Sunucuya SSH ile bağlandım
- [ ] Projeyi indirdim: `wget https://github.com/yourusername/smstk/archive/main.zip`
- [ ] Script'i çalıştırdım: `./scripts/quick-deploy-ispmanager.sh`
- [ ] Domain adını girdim
- [ ] MySQL root şifresini girdim
- [ ] Veritabanı kullanıcı şifresini girdim
- [ ] JWT Secret Key girdim

### ISPManager Ayarları
- [ ] ISPManager paneline giriş yaptım
- [ ] **WWW-domains** > **Create** butonuna tıkladım
- [ ] Domain bilgilerini girdim:
  - [ ] Domain name: `yourdomain.com`
  - [ ] Document root: `/var/www/yourdomain.com`
  - [ ] PHP version: **Node.js** seçtim
  - [ ] Node.js version: **18.x** seçtim
- [ ] **Create** butonuna tıkladım

### SSL Sertifikası
- [ ] **SSL certificates** > **Create** butonuna tıkladım
- [ ] **Let's Encrypt** seçtim
- [ ] Domain adını girdim
- [ ] **Create** butonuna tıkladım

### Test
- [ ] Tarayıcıda `https://yourdomain.com` adresini ziyaret ettim
- [ ] Ana sayfa yüklendi
- [ ] Varsayılan giriş yaptım: `admin` / `admin123`

## 📋 Manuel Kurulum

### 🗄️ Adım 1: Domain ve Hosting

#### Domain Oluşturma
- [ ] ISPManager paneline giriş yaptım
- [ ] **WWW-domains** bölümüne gittim
- [ ] **Create** butonuna tıkladım
- [ ] Domain bilgilerini girdim:
  ```
  Domain name: yourdomain.com
  Document root: /var/www/yourdomain.com
  PHP version: Node.js
  Node.js version: 18.x
  ```
- [ ] **Create** butonuna tıkladım

#### SSL Sertifikası
- [ ] **SSL certificates** bölümüne gittim
- [ ] **Create** butonuna tıkladım
- [ ] **Let's Encrypt** seçtim
- [ ] Domain adını girdim
- [ ] **Create** butonuna tıkladım

### 🗄️ Adım 2: Veritabanı

#### Veritabanı Oluşturma
- [ ] **Databases** bölümüne gittim
- [ ] **Create** butonuna tıkladım
- [ ] Veritabanı bilgilerini girdim:
  ```
  Database name: smstk_db
  Database user: smstk_user
  Password: Smstk2024!Secure
  Host: localhost
  ```
- [ ] **Create** butonuna tıkladım

#### Yetkilendirme
- [ ] Oluşturulan veritabanına tıkladım
- [ ] **Privileges** sekmesine gittim
- [ ] Kullanıcıya **ALL PRIVILEGES** verdim
- [ ] **Save** butonuna tıkladım

### 📁 Adım 3: Dosya Yükleme

#### FTP/SFTP Bağlantısı
- [ ] FTP bilgilerini aldım:
  ```
  Host: yourdomain.com
  Username: yourdomain.com
  Password: [ISPManager'da belirlediğim şifre]
  Port: 21 (FTP) veya 22 (SFTP)
  ```
- [ ] FTP istemcisi ile bağlandım

#### Dosya Yapısı
- [ ] `/var/www/yourdomain.com/` dizinini oluşturdum
- [ ] `backend/` klasörünü oluşturdum
- [ ] `frontend/` klasörünü oluşturdum
- [ ] `uploads/` klasörünü oluşturdum
- [ ] `logs/` klasörünü oluşturdum

### 🔧 Adım 4: Backend Kurulumu

#### Dosya Yükleme
- [ ] `server/` klasöründeki dosyaları `backend/` klasörüne yükledim
- [ ] Dosya izinlerini ayarladım:
  ```bash
  chmod 755 /var/www/yourdomain.com/backend
  chmod 644 /var/www/yourdomain.com/backend/*.js
  chmod 644 /var/www/yourdomain.com/backend/config/*.js
  ```

#### Environment Dosyası
- [ ] `/var/www/yourdomain.com/backend/.env` dosyası oluşturdum:
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

#### Bağımlılıklar ve PM2
- [ ] `cd /var/www/yourdomain.com/backend` komutunu çalıştırdım
- [ ] `npm install --production` komutunu çalıştırdım
- [ ] `npm install -g pm2` komutunu çalıştırdım
- [ ] `pm2 start index.js --name "smstk-backend"` komutunu çalıştırdım
- [ ] `pm2 startup` komutunu çalıştırdım
- [ ] `pm2 save` komutunu çalıştırdım

### ⚛️ Adım 5: Frontend Kurulumu

#### Dosya Yükleme
- [ ] `client/` klasöründeki dosyaları `frontend/` klasörüne yükledim
- [ ] Dosya izinlerini ayarladım:
  ```bash
  chmod 755 /var/www/yourdomain.com/frontend
  chmod 644 /var/www/yourdomain.com/frontend/package.json
  ```

#### Environment Dosyası
- [ ] `/var/www/yourdomain.com/frontend/.env` dosyası oluşturdum:
  ```env
  REACT_APP_API_URL=https://yourdomain.com/api
  REACT_APP_VERSION=1.0.0
  GENERATE_SOURCEMAP=false
  ```

#### Build ve Deploy
- [ ] `cd /var/www/yourdomain.com/frontend` komutunu çalıştırdım
- [ ] `npm install` komutunu çalıştırdım
- [ ] `npm run build` komutunu çalıştırdım
- [ ] `cp -r build/* /var/www/yourdomain.com/` komutunu çalıştırdım
- [ ] `chown -R www-data:www-data /var/www/yourdomain.com/` komutunu çalıştırdım
- [ ] `chmod -R 755 /var/www/yourdomain.com/` komutunu çalıştırdım

### 🌐 Adım 6: Nginx Konfigürasyonu

#### ISPManager Ayarları
- [ ] **WWW-domains** > **yourdomain.com** > **Settings** bölümüne gittim
- [ ] **Apache** yerine **Nginx** seçtim
- [ ] **Node.js** desteğini aktif ettim

#### Nginx Konfigürasyonu
- [ ] **WWW-domains** > **yourdomain.com** > **Nginx** bölümüne gittim
- [ ] Aşağıdaki konfigürasyonu ekledim:
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

  # Uploads
  location /uploads/ {
      alias /var/www/yourdomain.com/uploads/;
      expires 30d;
      add_header Cache-Control "public, immutable";
  }

  # Security headers
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-XSS-Protection "1; mode=block" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "no-referrer-when-downgrade" always;
  add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

  # Gzip compression
  gzip on;
  gzip_vary on;
  gzip_min_length 1024;
  gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
  ```

### 🔒 Adım 7: Güvenlik

#### Firewall
- [ ] `ufw enable` komutunu çalıştırdım
- [ ] `ufw allow 22/tcp` komutunu çalıştırdım
- [ ] `ufw allow 80/tcp` komutunu çalıştırdım
- [ ] `ufw allow 443/tcp` komutunu çalıştırdım

#### Dosya İzinleri
- [ ] `chmod 600 /var/www/yourdomain.com/backend/.env` komutunu çalıştırdım
- [ ] `chmod 600 /var/www/yourdomain.com/frontend/.env` komutunu çalıştırdım
- [ ] `mkdir -p /var/www/yourdomain.com/uploads` komutunu çalıştırdım
- [ ] `chmod 755 /var/www/yourdomain.com/uploads` komutunu çalıştırdım
- [ ] `chown www-data:www-data /var/www/yourdomain.com/uploads` komutunu çalıştırdım

#### SSL/TLS
- [ ] **HSTS** aktif ettim
- [ ] **HTTP/2** desteğini aktif ettim
- [ ] **TLS 1.3** kullanımını aktif ettim

### 🚀 Adım 8: Test

#### Backend Testi
- [ ] `pm2 status` komutunu çalıştırdım
- [ ] Backend çalışıyor mu kontrol ettim
- [ ] `curl -X GET https://yourdomain.com/api/health` komutunu çalıştırdım
- [ ] API yanıt veriyor mu kontrol ettim

#### Veritabanı Testi
- [ ] `mysql -u smstk_user -p smstk_db -e "SELECT 1;"` komutunu çalıştırdım
- [ ] Veritabanı bağlantısı çalışıyor mu kontrol ettim

#### Frontend Testi
- [ ] Tarayıcıda `https://yourdomain.com` adresini ziyaret ettim
- [ ] Ana sayfa yüklendi mi kontrol ettim
- [ ] Varsayılan giriş yaptım: `admin` / `admin123`
- [ ] Giriş başarılı mı kontrol ettim

### 📊 Adım 9: Monitoring

#### PM2 Monitoring
- [ ] `pm2 monit` komutunu çalıştırdım
- [ ] `pm2 logs smstk-backend` komutunu çalıştırdım

#### Log Dosyaları
- [ ] Nginx access loglarını kontrol ettim: `tail -f /var/log/nginx/yourdomain.com.access.log`
- [ ] Nginx error loglarını kontrol ettim: `tail -f /var/log/nginx/yourdomain.com.error.log`
- [ ] MySQL loglarını kontrol ettim: `tail -f /var/log/mysql/slow.log`

### 🔄 Adım 10: Yedekleme

#### Yedekleme Scripti
- [ ] `/var/www/yourdomain.com/backup.sh` dosyası oluşturdum
- [ ] Script'i çalıştırılabilir yaptım: `chmod +x /var/www/yourdomain.com/backup.sh`
- [ ] Cron job ekledim: `crontab -e`
- [ ] Günlük yedekleme ekledim: `0 2 * * * /var/www/yourdomain.com/backup.sh >> /var/log/backup.log 2>&1`

## 🛠️ Sorun Giderme

### Yaygın Sorunlar
- [ ] Port 5000 kullanımda mı kontrol ettim: `netstat -tlnp | grep :5000`
- [ ] MySQL servis çalışıyor mu kontrol ettim: `systemctl status mysql`
- [ ] Nginx servis çalışıyor mu kontrol ettim: `systemctl status nginx`
- [ ] SSL sertifikası aktif mi kontrol ettim: `openssl s_client -connect yourdomain.com:443`

### Debug Komutları
- [ ] Sistem durumunu kontrol ettim: `systemctl status nginx mysql`
- [ ] Port dinlemelerini kontrol ettim: `netstat -tlnp`
- [ ] Disk kullanımını kontrol ettim: `df -h`
- [ ] Bellek kullanımını kontrol ettim: `free -h`
- [ ] CPU kullanımını kontrol ettim: `top`

## ✅ Kurulum Tamamlandı

### Son Kontroller
- [ ] Ana sayfa yükleniyor mu?
- [ ] Kullanıcı girişi çalışıyor mu?
- [ ] API endpoint'leri erişilebilir mi?
- [ ] Veritabanı işlemleri çalışıyor mu?
- [ ] Dosya yükleme çalışıyor mu?
- [ ] SSL sertifikası aktif mi?

### Güvenlik Kontrolleri
- [ ] Varsayılan admin şifresini değiştirdim
- [ ] JWT_SECRET'ı güçlü bir değerle değiştirdim
- [ ] Firewall kurallarını kontrol ettim
- [ ] Dosya izinlerini kontrol ettim

### Varsayılan Bilgiler
- **URL**: `https://yourdomain.com`
- **Kullanıcı**: `admin`
- **Şifre**: `admin123`

---

## 📞 Destek

Sorun yaşarsanız:
1. Log dosyalarını kontrol edin
2. ISPManager dokümantasyonunu inceleyin
3. Sistem yöneticinizle iletişime geçin

**Not**: Bu kontrol listesi genel bir kurulum sürecini takip eder. Sunucu konfigürasyonunuza göre bazı adımlar farklılık gösterebilir. 