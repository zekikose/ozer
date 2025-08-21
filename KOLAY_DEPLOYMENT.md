# 🚀 SMSTK Kolay Deployment Rehberi

## 📋 Hızlı Başlangıç

### 🎯 En Kolay Yöntem: One-Click Deployment

```bash
# Tek komutla her şeyi yükleyin!
./one-click-deploy.sh
```

Bu script size 3 seçenek sunar:
1. 🐳 **Docker** (En Kolay - Önerilen)
2. 🔧 **Manuel Kurulum**
3. ☁️ **Cloud Deployment**

---

## 🐳 Docker ile Deployment (En Kolay)

### ✅ Avantajları:
- ✅ Tek komutla kurulum
- ✅ Otomatik bağımlılık yönetimi
- ✅ İzole ortam
- ✅ Kolay güncelleme
- ✅ Taşınabilir

### 🚀 Kurulum:

```bash
# 1. Docker kurulumu (otomatik)
./docker-deploy.sh

# 2. Manuel Docker kurulumu
docker-compose up -d --build
```

### 📊 Yönetim:

```bash
# Durumu kontrol et
docker-compose ps

# Log'ları görüntüle
docker-compose logs

# Yeniden başlat
docker-compose restart

# Durdur
docker-compose down
```

---

## ☁️ Cloud Deployment

### 🚀 AWS EC2
```bash
# AWS CLI ile otomatik deployment
./cloud-deploy.sh
# Seçenek 3'ü seçin
```

### 🌊 DigitalOcean
```bash
# DigitalOcean Droplet'e deployment
./cloud-deploy.sh
# Seçenek 4'ü seçin
```

### 🔧 Herhangi bir VPS
```bash
# SSH ile uzak sunucuya deployment
./cloud-deploy.sh
# Seçenek 1 veya 2'yi seçin
```

---

## 🔧 Manuel Kurulum (Gelişmiş)

### 📋 Gereksinimler:
- Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- Node.js 18+
- MySQL 8.0+
- Nginx
- PM2

### 🚀 Kurulum:

```bash
# Otomatik kurulum scripti
./deploy-automated.sh

# Manuel adımlar
npm run install:all
npm run build
pm2 start pm2-config.json
```

---

## 📊 Deployment Karşılaştırması

| Yöntem | Zorluk | Hız | Güvenlik | Özelleştirme |
|--------|--------|-----|----------|--------------|
| 🐳 Docker | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| ☁️ Cloud | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 🔧 Manuel | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🎯 Önerilen Yöntem

### 🥇 **Docker** (Yeni Başlayanlar İçin)
```bash
./docker-deploy.sh
```

### 🥈 **Cloud Deployment** (VPS Sahipleri İçin)
```bash
./cloud-deploy.sh
```

### 🥉 **Manuel Kurulum** (Gelişmiş Kullanıcılar İçin)
```bash
./deploy-automated.sh
```

---

## 🔧 Sorun Giderme

### ❌ Docker Sorunları
```bash
# Container'ları yeniden başlat
docker-compose down
docker-compose up -d --build

# Log'ları kontrol et
docker-compose logs api
docker-compose logs frontend
```

### ❌ Cloud Deployment Sorunları
```bash
# SSH bağlantısını test et
ssh user@server-ip

# Sunucuda manuel kontrol
pm2 status
sudo systemctl status nginx mysql
```

### ❌ Manuel Kurulum Sorunları
```bash
# Sorun giderme scripti
./server-fix.sh

# API test
curl http://localhost:5000/api/health
```

---

## 📞 Hızlı Test Komutları

```bash
# API sağlık kontrolü
curl http://localhost:5000/api/health

# Frontend kontrolü
curl http://localhost:3000

# Veritabanı bağlantısı
NODE_PATH=server/node_modules node server-env-check.js

# Sistem durumu
pm2 status && sudo systemctl status nginx mysql
```

---

## 🎉 Başarılı Deployment Kontrol Listesi

- [ ] API çalışıyor (`/api/health`)
- [ ] Frontend erişilebilir
- [ ] Veritabanı bağlantısı aktif
- [ ] Admin girişi çalışıyor (admin/admin123)
- [ ] SSL sertifikası aktif (production)
- [ ] Firewall ayarları yapıldı
- [ ] Monitoring aktif

---

## 📚 Ek Kaynaklar

- 📖 [Detaylı Kurulum Kılavuzu](DEPLOYMENT_ODETI.md)
- 🐳 [Docker Rehberi](https://docs.docker.com/)
- ☁️ [Cloud Deployment](https://aws.amazon.com/ec2/)
- 🔧 [PM2 Dokümantasyonu](https://pm2.keymetrics.io/)

---

**🎯 Hangi yöntemi seçeceğiniz konusunda kararsızsanız, Docker ile başlayın!**
