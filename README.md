# 🚀 SMSTK - Modern Stok Yönetim Sistemi

Modern ve kullanıcı dostu stok yönetim sistemi. React.js + Node.js ile geliştirilmiştir.

## 📋 Özellikler

### ✅ Kullanıcı Yönetimi
- JWT tabanlı kimlik doğrulama
- Rol tabanlı yetkilendirme (admin, manager, stock_keeper, viewer)
- Güvenli şifre hashleme

### ✅ Stok Yönetimi
- Ürün ekleme/düzenleme/silme
- Kategori yönetimi
- Stok giriş/çıkış işlemleri
- Gerçek zamanlı stok takibi
- Minimum/maksimum stok seviyesi uyarıları

### ✅ Tedarikçi ve Müşteri Yönetimi
- Tedarikçi bilgileri ve iletişim
- Müşteri bilgileri ve kredi limiti
- Adres ve iletişim bilgileri

### ✅ Depo Yönetimi
- Çoklu depo desteği
- Depo kapasitesi takibi
- Depo yöneticisi atama

### ✅ Raporlama
- Dashboard istatistikleri
- Stok hareket raporları
- Gerçek zamanlı veriler
- Grafik ve tablolar

## 🛠️ Teknolojiler

### Frontend
- **React 18** - UI framework
- **TypeScript** - Tip güvenliği
- **React Router** - Sayfa yönlendirme
- **React Query** - Veri yönetimi
- **React Hook Form** - Form yönetimi
- **Tailwind CSS** - Styling
- **Lucide React** - İkonlar
- **Recharts** - Grafikler

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MySQL** - Veritabanı
- **JWT** - Kimlik doğrulama
- **bcryptjs** - Şifre hashleme
- **CORS** - Cross-origin desteği
- **Helmet** - Güvenlik
- **Rate Limiting** - API koruması

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+
- MySQL 8.0+ veya MariaDB 10.5+
- npm veya yarn

### Adım 1: Projeyi İndirin
```bash
git clone <repository-url>
cd smstk
```

### Adım 2: Backend Kurulumu
```bash
cd server
npm install
```

### Adım 3: Frontend Kurulumu
```bash
cd ../client
npm install
```

### Adım 4: Environment Ayarları

#### Backend (.env)
```bash
cd ../server
cp env.example .env
```

`.env` dosyasını düzenleyin:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=smstk_db
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:3000
```

#### Frontend
Frontend otomatik olarak `http://localhost:5000` API'sine bağlanır.

### Adım 5: Veritabanını Oluşturun
```sql
CREATE DATABASE smstk_db;
```

### Adım 6: Uygulamayı Başlatın

#### Geliştirme Modu (Her iki servisi aynı anda)
```bash
npm run dev
```

#### Ayrı Ayrı Başlatma
```bash
# Backend
cd server && npm run dev

# Frontend (yeni terminal)
cd client && npm start
```

## 📁 Proje Yapısı

```
smstk/
├── client/                 # React.js Frontend
│   ├── src/
│   │   ├── components/     # Yeniden kullanılabilir bileşenler
│   │   ├── pages/         # Sayfa bileşenleri
│   │   ├── contexts/      # React Context'leri
│   │   └── utils/         # Yardımcı fonksiyonlar
│   └── public/            # Statik dosyalar
├── server/                # Node.js Backend
│   ├── routes/           # API route'ları
│   ├── middleware/       # Middleware'ler
│   ├── config/          # Konfigürasyon dosyaları
│   └── scripts/         # Yardımcı scriptler
└── README.md            # Bu dosya
```

## 🌐 Erişim

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## 🔧 API Endpoints

### Kimlik Doğrulama
- `POST /api/auth/login` - Giriş
- `POST /api/auth/register` - Kayıt
- `POST /api/auth/logout` - Çıkış

### Ürünler
- `GET /api/products` - Ürün listesi
- `POST /api/products` - Yeni ürün
- `PUT /api/products/:id` - Ürün güncelle
- `DELETE /api/products/:id` - Ürün sil

### Kategoriler
- `GET /api/categories` - Kategori listesi
- `POST /api/categories` - Yeni kategori
- `PUT /api/categories/:id` - Kategori güncelle
- `DELETE /api/categories/:id` - Kategori sil

### Stok İşlemleri
- `GET /api/stock/movements` - Stok hareketleri
- `POST /api/stock/in` - Stok girişi
- `POST /api/stock/out` - Stok çıkışı

## 🚀 Production Deployment

### Build
```bash
# Frontend build
cd client && npm run build

# Backend (production modu)
cd server && npm start
```

### Environment Variables
Production ortamında güvenlik için:
- Güçlü JWT_SECRET kullanın
- CORS_ORIGIN'i production URL'inize ayarlayın
- Rate limiting ayarlarını optimize edin

## 📝 Lisans

MIT License

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📞 İletişim

Proje Linki: [https://github.com/your-username/smstk](https://github.com/your-username/smstk) 