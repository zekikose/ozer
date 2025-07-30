# ⚡ SMSTK Hızlı Başlangıç Rehberi

## 🚀 5 Dakikada Sunucuya Yükleme

### 1. Sunucu Bilgilerini Hazırlayın
```bash
# sunucu-bilgileri-form.md dosyasını doldurun
open sunucu-bilgileri-form.md
```

### 2. Projeyi Sunucuya Yükleyin
```bash
# SCP ile yükleme
scp smstk-production-ready.tar.gz root@YOUR_SERVER_IP:/tmp/

# Örnek:
scp smstk-production-ready.tar.gz root@192.168.1.100:/tmp/
```

### 3. Sunucuya Bağlanın
```bash
ssh root@YOUR_SERVER_IP
```

### 4. Otomatik Kurulum
```bash
# Sunucuda
cd /tmp
tar -xzf smstk-production-ready.tar.gz
cd smstk-production-ready
chmod +x quick-deploy-ispmanager.sh
./quick-deploy-ispmanager.sh
```

### 5. ISPManager'da Domain Oluşturun
- ISPManager paneline giriş yapın
- WWW-domains > Create
- Domain: `yourdomain.com`
- PHP: Node.js
- SSL: Let's Encrypt

### 6. Test Edin
- URL: `https://yourdomain.com`
- Admin: `admin` / `admin123`

## 📋 Gerekli Bilgiler

### Sunucu Bilgileri
- **IP Adresi**: ________________
- **SSH Port**: ________________
- **Root Şifresi**: ________________

### Domain Bilgileri
- **Domain**: ________________
- **ISPManager URL**: ________________

### Veritabanı Bilgileri
- **MySQL Root Şifresi**: ________________
- **DB Şifresi**: ________________
- **JWT Secret**: ________________

## 🔧 Hızlı Komutlar

### Sunucuya Yükleme
```bash
# 1. Dosyayı yükle
scp smstk-production-ready.tar.gz root@IP:/tmp/

# 2. Sunucuya bağlan
ssh root@IP

# 3. Dosyaları aç
cd /tmp && tar -xzf smstk-production-ready.tar.gz

# 4. Kurulumu başlat
cd smstk-production-ready && ./quick-deploy-ispmanager.sh
```

### Test Komutları
```bash
# Backend testi
curl http://localhost:5000/api/health

# Frontend testi
curl http://localhost:3000

# Veritabanı testi
mysql -u smstk_user -p smstk_db -e "SELECT 1;"
```

### Yönetim Komutları
```bash
# PM2 durumu
pm2 status

# Logları görüntüle
pm2 logs smstk-backend

# Yeniden başlat
pm2 restart smstk-backend
```

## 🚨 Yaygın Sorunlar

### 502 Bad Gateway
```bash
pm2 status
pm2 logs smstk-backend
```

### Veritabanı Hatası
```bash
systemctl status mysql
mysql -u smstk_user -p smstk_db
```

### SSL Sorunu
```bash
openssl s_client -connect yourdomain.com:443
```

## 📞 Destek

### Log Dosyaları
- PM2: `/var/www/yourdomain.com/logs/`
- Nginx: `/var/log/nginx/`
- MySQL: `/var/log/mysql/`

### Faydalı Komutlar
```bash
# Sistem durumu
htop
df -h
free -h

# Port durumu
netstat -tlnp | grep :5000
lsof -i :3000
```

---

## ✅ Kurulum Tamamlandı!

**URL**: `https://yourdomain.com`
**Admin**: `admin` / `admin123`

**Sonraki Adımlar:**
1. Admin şifresini değiştirin
2. İlk verileri girin
3. Kullanıcıları ekleyin
4. Yedekleme kontrolü yapın 