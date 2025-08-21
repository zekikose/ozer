# SUNUCU BİLGİLERİ - SMSTK PROJESİ

## SSH Bilgileri
- **IP Adresi**: 45.84.191.65
- **Şifre**: xogxer-rempo8-micmiS
- **Klasör**: /var/www/ztaak/data/www/test.ztaak.com/

## Veritabanı Bilgileri
- **Veritabanı Adı**: smstk_db
- **Kullanıcı**: smstk_user
- **Şifre**: oX6eM8aA9y
- **Host**: 127.0.0.1
- **Port**: 3306

## Hızlı Komutlar

### SSH Bağlantısı
```bash
ssh -o StrictHostKeyChecking=no root@45.84.191.65
```

### Dosya Kopyalama
```bash
scp dosya.js root@45.84.191.65:/var/www/ztaak/data/www/test.ztaak.com/server/routes/
```

### Server Yeniden Başlatma
```bash
ssh -o StrictHostKeyChecking=no root@45.84.191.65 "pm2 restart smstk-server"
```

### Veritabanı Bağlantısı
```bash
ssh -o StrictHostKeyChecking=no root@45.84.191.65 "mysql -u smstk_user -poX6eM8aA9y smstk_db"
```

### Log Kontrolü
```bash
ssh -o StrictHostKeyChecking=no root@45.84.191.65 "pm2 logs smstk-server --lines 10"
```

## Proje Yapısı
- **Frontend**: /var/www/ztaak/data/www/test.ztaak.com/client/
- **Backend**: /var/www/ztaak/data/www/test.ztaak.com/server/
- **PM2 Process**: smstk-server
- **Port**: 5000 (backend), 3000 (frontend)
- **Domain**: https://test.ztaak.com

## Notlar
- Sunucu OS: AlmaLinux 8.10
- Node.js: v18
- MySQL: MariaDB
- Nginx: ISPManager ile yönetiliyor
- PM2: Process manager
