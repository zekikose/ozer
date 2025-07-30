# 🚀 SMSTK Production Deployment

Bu klasör SMSTK uygulamasının production ortamında çalıştırılması için gerekli tüm dosyaları içerir.

## 📁 Klasör Yapısı

```
production/
├── index.js                 # Ana uygulama dosyası
├── package.json             # Dependencies
├── ecosystem.config.js      # PM2 konfigürasyonu
├── .env                     # Environment değişkenleri (oluşturulacak)
├── env.example              # Environment örneği
├── nginx.conf               # Nginx konfigürasyonu
├── deploy.sh                # Docker deployment scripti
├── deploy-pm2.sh            # PM2 deployment scripti
├── backup.sh                # Backup scripti (oluşturulacak)
├── public/                  # Frontend build dosyaları
├── routes/                  # API route'ları
├── middleware/              # Middleware'ler
├── config/                  # Konfigürasyon dosyaları
├── scripts/                 # Veritabanı scriptleri
├── logs/                    # Log dosyaları
├── uploads/                 # Yüklenen dosyalar
├── backups/                 # Backup dosyaları
└── ssl/                     # SSL sertifikaları
```

## 🚀 Hızlı Başlangıç

### 1. Environment Dosyasını Oluşturun
```bash
cp env.example .env
# .env dosyasını düzenleyin
```

### 2. Dependencies Yükleyin
```bash
npm install --production
```

### 3. PM2 ile Başlatın
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4. Nginx Yapılandırın
```bash
# nginx.conf dosyasını /etc/nginx/sites-available/smstk'ya kopyalayın
sudo cp nginx.conf /etc/nginx/sites-available/smstk
sudo ln -s /etc/nginx/sites-available/smstk /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔧 Konfigürasyon

### Environment Değişkenleri (.env)
```env
# Server Configuration
NODE_ENV=production
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_USER=smstk_user
DB_PASSWORD=your_secure_password
DB_NAME=smstk_db
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com
```

### PM2 Konfigürasyonu (ecosystem.config.js)
- Cluster modunda çalışır
- Otomatik restart
- Log yönetimi
- Memory limit: 1GB

### Nginx Konfigürasyonu (nginx.conf)
- Static dosya servisi
- API proxy
- SSL desteği
- Güvenlik header'ları

## 📊 Monitoring

### PM2 Monitoring
```bash
pm2 status          # Uygulama durumu
pm2 logs smstk      # Logları görüntüle
pm2 monit           # Real-time monitoring
```

### Log Dosyaları
- `logs/out.log` - Standart çıktı
- `logs/err.log` - Hata logları
- `logs/combined.log` - Tüm loglar

## 🔄 Backup

### Manuel Backup
```bash
./backup.sh
```

### Otomatik Backup
```bash
# Cron job ekleyin (her gün saat 2'de)
0 2 * * * /path/to/smstk/backup.sh
```

## 🛠️ Bakım

### Uygulama Güncelleme
```bash
# Uygulamayı durdur
pm2 stop smstk

# Yeni dosyaları kopyala
# Dependencies yükle
npm install --production

# Uygulamayı başlat
pm2 start smstk
```

### Log Temizleme
```bash
# Eski logları temizle
pm2 flush

# Log dosyalarını temizle
truncate -s 0 logs/*.log
```

## 🚨 Sorun Giderme

### Uygulama Başlamıyor
1. Logları kontrol edin: `pm2 logs smstk`
2. Environment değişkenlerini kontrol edin
3. Port kullanımını kontrol edin: `netstat -tlnp | grep :5000`

### Veritabanı Bağlantı Hatası
1. MySQL servisini kontrol edin: `systemctl status mysql`
2. Veritabanı bağlantısını test edin
3. .env dosyasındaki veritabanı bilgilerini kontrol edin

### Nginx Hatası
1. Konfigürasyonu test edin: `nginx -t`
2. Logları kontrol edin: `tail -f /var/log/nginx/error.log`

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Logları kontrol edin
2. Sunucu kaynaklarını kontrol edin
3. Konfigürasyon dosyalarını doğrulayın

---

**🎉 SMSTK Production Deployment Hazır!** 