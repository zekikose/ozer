# SMSTK cPanel Deployment Talimatları

## 📁 Dosya Yapısı
- `frontend/` - public_html klasörüne yüklenecek
- `backend/` - private klasöre yüklenecek

## 🚀 Yükleme Adımları

### 1. Frontend Yükleme
1. cPanel File Manager'ı açın
2. public_html klasörüne gidin
3. frontend/ klasöründeki tüm dosyaları yükleyin

### 2. Backend Yükleme
1. public_html dışında smstk-backend klasörü oluşturun
2. backend/ klasöründeki tüm dosyaları yükleyin

### 3. Veritabanı Kurulumu
1. cPanel'de MySQL veritabanı oluşturun
2. backend/config/database.js dosyasındaki tabloları import edin

### 4. Environment Konfigürasyonu
1. backend/.env dosyasını düzenleyin
2. Veritabanı bilgilerini güncelleyin
3. JWT_SECRET'ı değiştirin

### 5. Node.js Uygulaması Başlatma
1. cPanel Node.js Selector'da uygulama oluşturun
2. Application root: /home/username/smstk-backend
3. Startup file: index.js
4. Port: 5000

## ⚠️ Önemli Notlar
- JWT_SECRET'ı mutlaka değiştirin
- Veritabanı bilgilerini doğru girin
- SSL sertifikası aktifleştirin
- Admin şifresini değiştirin

## 🔗 Giriş Bilgileri
- Admin: admin / admin123
- Manager: manager / password
- Stock Keeper: stock_keeper / password
- Viewer: viewer / password
