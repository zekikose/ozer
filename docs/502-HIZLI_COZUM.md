# ⚡ 502 Bad Gateway Hızlı Çözüm

## 🚨 Acil Durum Çözümü

### 1. Otomatik Düzeltme Scripti
```bash
# Sunucuda çalıştırın
chmod +x fix-502-error.sh
./fix-502-error.sh yourdomain.com
```

### 2. Manuel Hızlı Çözüm
```bash
# 1. Backend'i yeniden başlat
cd /var/www/yourdomain.com/backend
pm2 restart smstk-backend

# 2. Durumu kontrol et
pm2 status

# 3. Test et
curl http://localhost:5000/api/health
```

## 🔍 Hızlı Teşhis

### Backend Durumu
```bash
# PM2 durumu
pm2 status

# Port kontrolü
lsof -i :5000

# Process kontrolü
ps aux | grep node | grep -v grep
```

### Log Kontrolü
```bash
# PM2 logları
pm2 logs smstk-backend --lines 20

# Manuel loglar
tail -20 /var/www/yourdomain.com/logs/err.log
tail -20 /var/www/yourdomain.com/logs/out.log
```

### Nginx Kontrolü
```bash
# Nginx durumu
systemctl status nginx

# Nginx logları
tail -20 /var/log/nginx/yourdomain.com.error.log
```

## 🔧 Yaygın Çözümler

### 1. Backend Çalışmıyor
```bash
# PM2 ile yeniden başlat
pm2 restart smstk-backend

# Veya manuel başlat
cd /var/www/yourdomain.com/backend
node index.js &
```

### 2. Port 5000 Kullanımda
```bash
# Port kullanımını kontrol et
lsof -i :5000

# Process'i sonlandır
kill -9 [PID]

# PM2'yi yeniden başlat
pm2 restart smstk-backend
```

### 3. Veritabanı Bağlantı Hatası
```bash
# MySQL durumu
systemctl status mysql

# Bağlantı testi
mysql -u smstk_user -p smstk_db -e "SELECT 1;"
```

### 4. Dosya İzinleri
```bash
# İzinleri düzelt
chown -R www-data:www-data /var/www/yourdomain.com/
chmod -R 755 /var/www/yourdomain.com/
chmod 600 /var/www/yourdomain.com/backend/.env
```

### 5. Nginx Konfigürasyonu
```bash
# Konfigürasyon testi
nginx -t

# Nginx'i yeniden yükle
systemctl reload nginx
```

## 📊 Test Komutları

### Backend Testi
```bash
# Localhost testi
curl http://localhost:5000/api/health

# Nginx proxy testi
curl http://localhost/api/health

# Domain testi
curl https://yourdomain.com/api/health
```

### Sistem Durumu
```bash
# Tüm servisler
systemctl status nginx mysql

# Port durumları
netstat -tlnp | grep -E ":5000|:80|:443"

# Disk ve bellek
df -h && free -h
```

## 🚨 Acil Durum Komutları

### Tam Yeniden Başlatma
```bash
# 1. Tüm servisleri durdur
pm2 stop all
systemctl stop nginx

# 2. Servisleri başlat
systemctl start nginx
cd /var/www/yourdomain.com/backend
pm2 start ecosystem.config.js

# 3. Test et
curl http://localhost:5000/api/health
```

### Manuel Başlatma
```bash
# Backend'i manuel başlat
cd /var/www/yourdomain.com/backend
pkill -f "node.*index.js"
nohup node index.js > ../logs/out.log 2> ../logs/err.log &

# Test et
sleep 3 && curl http://localhost:5000/api/health
```

## 📞 Destek

### Log Dosyaları
- **PM2**: `pm2 logs smstk-backend`
- **Backend**: `/var/www/yourdomain.com/logs/`
- **Nginx**: `/var/log/nginx/`
- **MySQL**: `/var/log/mysql/`

### Faydalı Komutlar
```bash
# Sistem durumu
htop
df -h
free -h

# Servis durumları
systemctl status nginx mysql

# Port dinleme
netstat -tlnp
lsof -i :5000 -i :3000 -i :80 -i :443
```

---

## ✅ Çözüm Kontrol Listesi

- [ ] PM2 durumu kontrol edildi
- [ ] Backend logları incelendi
- [ ] Port 5000 kontrol edildi
- [ ] Veritabanı bağlantısı test edildi
- [ ] Nginx konfigürasyonu kontrol edildi
- [ ] Dosya izinleri düzeltildi
- [ ] Backend test edildi

## 🎯 En Hızlı Çözüm

```bash
# 1. Otomatik düzeltme
./fix-502-error.sh yourdomain.com

# 2. Veya manuel
pm2 restart smstk-backend && curl http://localhost:5000/api/health
``` 