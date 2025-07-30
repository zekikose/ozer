#!/bin/bash

# SMSTK cPanel Deployment Script
echo "🚀 SMSTK cPanel Deployment Script başlatılıyor..."

# Production build oluştur
echo "📦 Production build oluşturuluyor..."
npm run build

# Deployment klasörleri oluştur
echo "📁 Deployment klasörleri oluşturuluyor..."
mkdir -p cpanel-deploy/frontend
mkdir -p cpanel-deploy/backend

# Frontend dosyalarını kopyala
echo "📋 Frontend dosyaları kopyalanıyor..."
cp -r client/build/* cpanel-deploy/frontend/

# Backend dosyalarını kopyala
echo "🔧 Backend dosyaları kopyalanıyor..."
cp -r server/* cpanel-deploy/backend/
rm -rf cpanel-deploy/backend/node_modules
rm -rf cpanel-deploy/backend/scripts

# Production .env dosyası oluştur
echo "⚙️  Production .env dosyası oluşturuluyor..."
cat > cpanel-deploy/backend/.env << EOF
PORT=5000
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
DB_PORT=3306
JWT_SECRET=your-very-secure-jwt-secret-key-change-this
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
EOF

# .htaccess dosyası oluştur
echo "🌐 .htaccess dosyası oluşturuluyor..."
cat > cpanel-deploy/frontend/.htaccess << EOF
RewriteEngine On

# API isteklerini backend'e yönlendir
RewriteCond %{REQUEST_URI} ^/api/(.*)$
RewriteRule ^api/(.*)$ http://localhost:5000/api/$1 [P,L]

# React Router için
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [QSA,L]

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
EOF

# package.json production için güncelle
echo "📦 package.json güncelleniyor..."
cat > cpanel-deploy/backend/package.json << EOF
{
  "name": "smstk-backend",
  "version": "1.0.0",
  "description": "SMSTK Backend API",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.5",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "express-validator": "^7.0.1",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "dotenv": "^16.3.1",
    "multer": "^1.4.5-lts.1"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Deployment rehberi oluştur
echo "📖 Deployment rehberi oluşturuluyor..."
cat > cpanel-deploy/DEPLOYMENT_INSTRUCTIONS.md << EOF
# SMSTK cPanel Deployment Talimatları

## 📁 Dosya Yapısı
- \`frontend/\` - public_html klasörüne yüklenecek
- \`backend/\` - private klasöre yüklenecek

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
EOF

# ZIP dosyaları oluştur
echo "📦 ZIP dosyaları oluşturuluyor..."
cd cpanel-deploy
zip -r smstk-frontend.zip frontend/
zip -r smstk-backend.zip backend/
zip -r smstk-complete.zip ./

echo "✅ Deployment dosyaları hazırlandı!"
echo ""
echo "📁 Oluşturulan dosyalar:"
echo "  - cpanel-deploy/frontend/ (Frontend dosyaları)"
echo "  - cpanel-deploy/backend/ (Backend dosyaları)"
echo "  - cpanel-deploy/smstk-frontend.zip"
echo "  - cpanel-deploy/smstk-backend.zip"
echo "  - cpanel-deploy/smstk-complete.zip"
echo "  - cpanel-deploy/DEPLOYMENT_INSTRUCTIONS.md"
echo ""
echo "🚀 cPanel'e yüklemeye hazır!" 