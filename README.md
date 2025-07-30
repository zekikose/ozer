# 🚀 SMSTK - Stok Yönetim Sistemi

Modern ve kullanıcı dostu stok yönetim sistemi. React frontend ve Node.js backend ile geliştirilmiştir.

## 📁 Proje Yapısı

```
smstk/
├── 📁 client/                 # React Frontend
├── 📁 server/                 # Node.js Backend
├── 📁 docs/                   # Dokümantasyon
├── 📁 deployment/             # Deployment Dosyaları
├── 📁 scripts/                # Otomatik Scriptler
├── 📁 node_modules/           # Node.js Bağımlılıkları
├── package.json               # Proje Konfigürasyonu
└── README.md                  # Bu Dosya
```

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js 18+
- MySQL 8.0+ veya MariaDB 10.5+
- npm veya yarn

### Kurulum

#### 1. Bağımlılıkları Yükleyin
```bash
# Ana bağımlılıklar
npm install

# Backend bağımlılıkları
cd server && npm install

# Frontend bağımlılıkları
cd client && npm install
```

#### 2. Veritabanını Kurun
```bash
# MySQL'de veritabanı oluşturun
CREATE DATABASE smstk_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 3. Environment Dosyalarını Ayarlayın
```bash
# Backend (.env)
cd server
cp env.example .env
# .env dosyasını düzenleyin
```

#### 4. Uygulamayı Başlatın
```bash
# Backend (Terminal 1)
cd server && npm start

# Frontend (Terminal 2)
cd client && npm start
```

## 📚 Dokümantasyon

### 📁 docs/ Klasörü
- **README.md** - Ana proje dokümantasyonu
- **HIZLI_BASLANGIC.md** - 5 dakikada kurulum rehberi
- **ISPManager_DEPLOYMENT_GUIDE.md** - ISPManager deployment rehberi
- **ISPManager_QUICK_START.md** - ISPManager hızlı başlangıç
- **SUNUCU_YUKLEME_REHBERI.md** - Sunucuya yükleme rehberi
- **SUNUCU_YUKLEME_ADIMLARI.md** - Detaylı yükleme adımları
- **SUNUCU_DEPLOYMENT_REHBERI.md** - Sunucu deployment rehberi
- **502-HIZLI_COZUM.md** - 502 Bad Gateway hızlı çözüm
- **502-sorun-giderme.md** - 502 hatası detaylı sorun giderme
- **sunucu-bilgileri-form.md** - Sunucu bilgileri toplama formu

## 🚀 Deployment

### 📁 deployment/ Klasörü
- **smstk-final-deployment.tar.gz** - Final deployment paketi
- **cpanel-deploy/** - cPanel deployment dosyaları
- **ispmanager-config/** - ISPManager konfigürasyon dosyaları
- **production/** - Production ortam dosyaları

### Sunucuya Yükleme
```bash
# 1. Deployment paketini sunucuya yükleyin
scp deployment/smstk-final-deployment.tar.gz root@your-server:/tmp/

# 2. Sunucuda açın
ssh root@your-server
cd /tmp && tar -xzf smstk-final-deployment.tar.gz

# 3. Otomatik kurulum
cd smstk-final-deployment
chmod +x scripts/quick-deploy-ispmanager.sh
./scripts/quick-deploy-ispmanager.sh
```

## 🔧 Scriptler

### 📁 scripts/ Klasörü
- **build.sh** - Proje build scripti
- **deploy-ispmanager.sh** - ISPManager deployment scripti
- **quick-deploy-ispmanager.sh** - Hızlı deployment scripti
- **fix-502-error.sh** - 502 Bad Gateway düzeltme scripti
- **cpanel-deploy.sh** - cPanel deployment scripti

### Script Kullanımı
```bash
# Hızlı deployment
./scripts/quick-deploy-ispmanager.sh

# Manuel deployment
./scripts/deploy-ispmanager.sh yourdomain.com your_password your_jwt_secret

# 502 hatası düzeltme
./scripts/fix-502-error.sh yourdomain.com
```

## 🌐 Özellikler

### Kullanıcı Yönetimi
- ✅ Kullanıcı kaydı ve girişi
- ✅ Rol tabanlı yetkilendirme
- ✅ Güvenli JWT authentication

### Stok Yönetimi
- ✅ Ürün ekleme/düzenleme/silme
- ✅ Kategori yönetimi
- ✅ Stok giriş/çıkış işlemleri
- ✅ Stok seviyesi takibi

### Tedarikçi ve Müşteri Yönetimi
- ✅ Tedarikçi bilgileri
- ✅ Müşteri bilgileri
- ✅ İletişim bilgileri

### Raporlama
- ✅ Stok raporları
- ✅ Hareket raporları
- ✅ Dashboard istatistikleri

### Dosya Yönetimi
- ✅ Ürün resimleri
- ✅ Dosya yükleme
- ✅ Güvenli dosya saklama

## 🔒 Güvenlik

- ✅ JWT token authentication
- ✅ Şifre hashleme (bcrypt)
- ✅ CORS koruması
- ✅ Rate limiting
- ✅ Input validation
- ✅ SQL injection koruması

## 🛠️ Teknolojiler

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP client
- **React Query** - Data fetching
- **React Hook Form** - Form management
- **Lucide React** - Icons
- **Recharts** - Charts

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MySQL2** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **multer** - File upload
- **cors** - CORS handling
- **helmet** - Security headers
- **express-validator** - Input validation

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `GET /api/auth/profile` - Profil bilgileri

### Products
- `GET /api/products` - Ürün listesi
- `POST /api/products` - Yeni ürün
- `PUT /api/products/:id` - Ürün güncelleme
- `DELETE /api/products/:id` - Ürün silme

### Categories
- `GET /api/categories` - Kategori listesi
- `POST /api/categories` - Yeni kategori
- `PUT /api/categories/:id` - Kategori güncelleme
- `DELETE /api/categories/:id` - Kategori silme

### Stock Movements
- `GET /api/stock` - Stok hareketleri
- `POST /api/stock/in` - Stok girişi
- `POST /api/stock/out` - Stok çıkışı

## 🚨 Sorun Giderme

### 502 Bad Gateway Hatası
```bash
# Otomatik düzeltme
./scripts/fix-502-error.sh yourdomain.com

# Manuel düzeltme
pm2 restart smstk-backend
curl http://localhost:5000/api/health
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
# İzinleri düzelt
chown -R www-data:www-data /var/www/yourdomain.com/
chmod -R 755 /var/www/yourdomain.com/
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
lsof -i :5000 -i :3000
```

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

---

## 🎉 Başarıyla Kuruldu!

**Varsayılan Giriş Bilgileri:**
- **Kullanıcı**: `admin`
- **Şifre**: `admin123`

**Önemli Notlar:**
- Güvenlik için admin şifresini değiştirin
- Düzenli yedekleme yapın
- Sistem güncellemelerini takip edin 