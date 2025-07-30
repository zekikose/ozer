# 🚨 502 Bad Gateway Sorun Giderme Rehberi

## 🔍 Sorun Analizi

502 Bad Gateway hatası genellikle şu nedenlerden kaynaklanır:
1. Backend servisi çalışmıyor
2. Port 5000'de servis yok
3. Nginx konfigürasyonu yanlış
4. Firewall engellemesi
5. Dosya izinleri sorunu

## 🔧 Adım Adım Çözüm

### 1. Backend Durumunu Kontrol Etme

```bash
# PM2 durumunu kontrol et
pm2 status

# Eğer PM2 yoksa, Node.js process'lerini kontrol et
ps aux | grep node | grep -v grep

# Port 5000'de ne çalışıyor kontrol et
netstat -tlnp | grep :5000
lsof -i :5000
```

### 2. Backend'i Yeniden Başlatma

```bash
# Backend dizinine git
cd /var/www/yourdomain.com/backend

# PM2 ile yeniden başlat
pm2 restart smstk-backend

# Veya PM2 yoksa manuel başlat
node index.js &

# Durumu kontrol et
pm2 status
```

### 3. Backend Loglarını Kontrol Etme

```bash
# PM2 loglarını görüntüle
pm2 logs smstk-backend

# Manuel log dosyalarını kontrol et
tail -f /var/www/yourdomain.com/logs/err.log
tail -f /var/www/yourdomain.com/logs/out.log
tail -f /var/www/yourdomain.com/logs/combined.log
```

### 4. Veritabanı Bağlantısını Test Etme

```bash
# MySQL servis durumu
systemctl status mysql

# Veritabanı bağlantı testi
mysql -u smstk_user -p smstk_db -e "SELECT 1;"

# Backend'de veritabanı testi
cd /var/www/yourdomain.com/backend
node -e "
const mysql = require('mysql2');
const pool = mysql.createPool({
  host: 'localhost',
  user: 'smstk_user',
  password: 'YOUR_DB_PASSWORD',
  database: 'smstk_db',
  port: 3306
});
pool.query('SELECT 1', (err, results) => {
  if (err) {
    console.error('DB Error:', err);
  } else {
    console.log('DB OK:', results);
  }
  process.exit();
});
"
```

### 5. Environment Dosyasını Kontrol Etme

```bash
# Environment dosyasını kontrol et
cat /var/www/yourdomain.com/backend/.env

# Beklenen içerik:
# PORT=5000
# DB_HOST=localhost
# DB_USER=smstk_user
# DB_PASSWORD=your_password
# DB_NAME=smstk_db
# DB_PORT=3306
# JWT_SECRET=your_jwt_secret
# NODE_ENV=production
# CORS_ORIGIN=https://yourdomain.com
```

### 6. Nginx Konfigürasyonunu Kontrol Etme

```bash
# Nginx konfigürasyonunu test et
nginx -t

# Nginx error loglarını kontrol et
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/yourdomain.com.error.log

# Nginx'i yeniden yükle
systemctl reload nginx
```

### 7. Firewall Kontrolü

```bash
# Firewall durumu
ufw status

# Port 5000'ü aç (gerekirse)
ufw allow 5000/tcp

# Sistem firewall'u
iptables -L | grep 5000
```

### 8. Dosya İzinlerini Düzeltme

```bash
# Dosya sahipliğini düzelt
chown -R www-data:www-data /var/www/yourdomain.com/

# İzinleri düzelt
chmod -R 755 /var/www/yourdomain.com/
chmod 600 /var/www/yourdomain.com/backend/.env
chmod 600 /var/www/yourdomain.com/frontend/.env

# Uploads klasörü izinleri
chmod 755 /var/www/yourdomain.com/uploads
chown www-data:www-data /var/www/yourdomain.com/uploads
```

### 9. Backend'i Manuel Test Etme

```bash
# Backend dizinine git
cd /var/www/yourdomain.com/backend

# Manuel olarak başlat ve logları gör
node index.js

# Veya başka bir terminal'de test et
curl -X GET http://localhost:5000/api/health
```

### 10. PM2 Konfigürasyonunu Kontrol Etme

```bash
# PM2 ecosystem dosyasını kontrol et
cat /var/www/yourdomain.com/backend/ecosystem.config.js

# PM2'yi yeniden başlat
pm2 delete smstk-backend
pm2 start ecosystem.config.js
pm2 save
```

## 🚨 Yaygın Hata Mesajları ve Çözümleri

### 1. "Cannot find module"
```bash
# Bağımlılıkları yeniden yükle
cd /var/www/yourdomain.com/backend
rm -rf node_modules package-lock.json
npm install --production
```

### 2. "ECONNREFUSED"
```bash
# MySQL servisini kontrol et
systemctl status mysql
systemctl start mysql

# MySQL bağlantı ayarlarını kontrol et
mysql -u root -p -e "SHOW GRANTS FOR 'smstk_user'@'localhost';"
```

### 3. "EACCES: permission denied"
```bash
# Dosya izinlerini düzelt
chown -R www-data:www-data /var/www/yourdomain.com/
chmod -R 755 /var/www/yourdomain.com/
```

### 4. "Port 5000 is already in use"
```bash
# Port kullanımını kontrol et
lsof -i :5000

# Process'i sonlandır
kill -9 [PID]

# PM2'yi yeniden başlat
pm2 restart smstk-backend
```

## 🔍 Debug Komutları

### Sistem Durumu
```bash
# Sistem kaynakları
htop
df -h
free -h

# Servis durumları
systemctl status nginx mysql

# Port durumları
netstat -tlnp
lsof -i :5000 -i :3000 -i :80 -i :443
```

### Log Analizi
```bash
# Tüm logları kontrol et
tail -f /var/log/nginx/error.log
tail -f /var/log/mysql/error.log
pm2 logs smstk-backend --lines 50
```

### Network Testi
```bash
# Localhost testi
curl -v http://localhost:5000/api/health

# Nginx proxy testi
curl -v http://localhost/api/health

# DNS testi
nslookup yourdomain.com
ping yourdomain.com
```

## ✅ Çözüm Kontrol Listesi

- [ ] PM2 durumu kontrol edildi
- [ ] Backend logları incelendi
- [ ] Veritabanı bağlantısı test edildi
- [ ] Environment dosyası kontrol edildi
- [ ] Nginx konfigürasyonu test edildi
- [ ] Firewall ayarları kontrol edildi
- [ ] Dosya izinleri düzeltildi
- [ ] Backend manuel test edildi

## 📞 Ek Destek

### Log Dosyaları Konumları
- **PM2 Logları**: `/var/www/yourdomain.com/logs/`
- **Nginx Logları**: `/var/log/nginx/`
- **MySQL Logları**: `/var/log/mysql/`
- **Sistem Logları**: `/var/log/syslog`

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

## 🎯 Hızlı Çözüm

En hızlı çözüm için şu komutları sırayla çalıştırın:

```bash
# 1. Backend'i yeniden başlat
cd /var/www/yourdomain.com/backend
pm2 restart smstk-backend

# 2. Durumu kontrol et
pm2 status

# 3. Logları kontrol et
pm2 logs smstk-backend --lines 20

# 4. Test et
curl http://localhost:5000/api/health
``` 