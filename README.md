# SMSTK - Modern Stok Yönetim Sistemi

Modern ve kullanıcı dostu bir stok yönetim sistemi. React, Node.js ve MySQL kullanılarak geliştirilmiştir.

## 🚀 Özellikler

### 📊 Dashboard
- Gerçek zamanlı stok durumu
- Hızlı giriş/çıkış menüleri
- Güncel istatistikler
- Son aktiviteler

### 📦 Ürün Yönetimi
- Ürün ekleme, düzenleme, silme
- Otomatik SKU oluşturma
- Kategori ve tedarikçi yönetimi
- Depo yönetimi
- Stok seviyesi takibi

### 📈 Stok Hareketleri
- Stok giriş/çıkış işlemleri
- Detaylı hareket geçmişi
- Filtreleme ve arama
- Toplam hesaplamaları
- Tedarikçi ve müşteri takibi

### 👥 Kullanıcı Yönetimi
- Rol tabanlı yetkilendirme
- Kullanıcı ekleme/düzenleme
- Güvenli giriş sistemi
- Yetki kontrolü

### 🏢 Temel Yönetim
- Kategori yönetimi
- Tedarikçi yönetimi
- Müşteri yönetimi
- Depo yönetimi

## 🛠️ Teknolojiler

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Tip güvenliği
- **Tailwind CSS** - Styling
- **React Query** - State management
- **React Hook Form** - Form yönetimi
- **React Router** - Navigation
- **Axios** - HTTP client
- **Lucide React** - İkonlar
- **Recharts** - Grafikler

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Veritabanı
- **JWT** - Authentication
- **bcryptjs** - Şifre hashleme
- **express-validator** - Input validation
- **multer** - File uploads
- **helmet** - Security
- **express-rate-limit** - Rate limiting

## 📋 Gereksinimler

- Node.js 18+
- MySQL 8.0+
- MAMP (veya benzeri local server)

## 🚀 Kurulum

### 1. Repository'yi klonlayın
```bash
git clone https://github.com/KULLANICI_ADINIZ/smstk.git
cd smstk
```

### 2. Bağımlılıkları yükleyin
```bash
# Root dizinde
npm install

# Server bağımlılıkları
cd server
npm install

# Client bağımlılıkları
cd ../client
npm install
```

### 3. Veritabanını kurun
```bash
# MySQL'e bağlanın
mysql -u root -p

# Veritabanını oluşturun
CREATE DATABASE smstk_db;
USE smstk_db;

# Tablolar otomatik oluşturulacak
```

### 4. Environment değişkenlerini ayarlayın
```bash
# server/.env dosyası oluşturun
cp server/.env.example server/.env

# Gerekli değerleri düzenleyin
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=smstk_db
DB_PORT=8889
JWT_SECRET=your-secret-key
```

### 5. Uygulamayı başlatın
```bash
# Root dizinde
npm run dev

# Veya ayrı ayrı
npm run server  # Backend (port 5000)
npm run client  # Frontend (port 3000)
```

## 🔐 Varsayılan Kullanıcılar

Sistem ilk çalıştırıldığında otomatik olarak demo kullanıcılar oluşturulur:

### Admin Kullanıcı
- **Kullanıcı Adı:** admin
- **Şifre:** admin123
- **Rol:** Admin (Tüm yetkiler)

### Demo Kullanıcı
- **Kullanıcı Adı:** demo
- **Şifre:** demo123
- **Rol:** Manager (Sınırlı yetkiler)

## 📱 Kullanım

### Giriş Yapma
1. Tarayıcıda `http://localhost:3000` adresine gidin
2. Kullanıcı adı ve şifrenizi girin
3. Dashboard'a yönlendirileceksiniz

### Ürün Ekleme
1. "Ürünler" menüsüne gidin
2. "Yeni Ürün" butonuna tıklayın
3. Formu doldurun (SKU otomatik oluşturulur)
4. "Ürün Ekle" butonuna tıklayın

### Stok Girişi
1. "Stok Girişi" menüsüne gidin
2. Tedarikçi seçin (zorunlu)
3. Ürün seçin
4. Miktar ve fiyat bilgilerini girin
5. "Stok Girişi Yap" butonuna tıklayın

### Stok Çıkışı
1. "Stok Çıkışı" menüsüne gidin
2. Müşteri seçin
3. Ürün seçin
4. Miktar bilgisini girin
5. "Stok Çıkışı Yap" butonuna tıklayın

## 🔧 Geliştirme

### Proje Yapısı
```
smstk/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Yeniden kullanılabilir bileşenler
│   │   ├── pages/         # Sayfa bileşenleri
│   │   ├── contexts/      # React context'leri
│   │   ├── utils/         # Yardımcı fonksiyonlar
│   │   └── types/         # TypeScript tipleri
│   └── public/            # Statik dosyalar
├── server/                # Node.js backend
│   ├── routes/            # API route'ları
│   ├── middleware/        # Express middleware'leri
│   ├── config/            # Konfigürasyon dosyaları
│   └── utils/             # Yardımcı fonksiyonlar
└── docs/                  # Dokümantasyon
```

### API Endpoints

#### Authentication
- `POST /api/auth/login` - Giriş yapma
- `POST /api/auth/register` - Kayıt olma
- `GET /api/auth/me` - Kullanıcı bilgileri

#### Products
- `GET /api/products` - Ürün listesi
- `POST /api/products` - Yeni ürün ekleme
- `PUT /api/products/:id` - Ürün güncelleme
- `DELETE /api/products/:id` - Ürün silme

#### Stock
- `GET /api/stock/movements` - Stok hareketleri
- `POST /api/stock/in` - Stok girişi
- `POST /api/stock/out` - Stok çıkışı

#### Dashboard
- `GET /api/dashboard` - Dashboard verileri

## 🔒 Güvenlik

- JWT tabanlı authentication
- Rol tabanlı yetkilendirme (RBAC)
- Input validation
- SQL injection koruması
- XSS koruması
- Rate limiting

## 📊 Veritabanı Şeması

### Ana Tablolar
- `users` - Kullanıcılar
- `products` - Ürünler
- `categories` - Kategoriler
- `suppliers` - Tedarikçiler
- `customers` - Müşteriler
- `warehouses` - Depolar
- `stock_movements` - Stok hareketleri

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

- **Proje Linki:** https://github.com/KULLANICI_ADINIZ/smstk
- **E-posta:** your-email@example.com

## 🙏 Teşekkürler

Bu proje aşağıdaki açık kaynak projelerin kullanımı ile geliştirilmiştir:
- React
- Node.js
- Express.js
- MySQL
- Tailwind CSS
- Ve diğer tüm bağımlılıklar

---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın! 