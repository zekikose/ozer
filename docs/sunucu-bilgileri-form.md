# 📋 Sunucu Bilgileri Formu

Bu formu doldurarak projenizi sunucuya yükleyebiliriz.

## 🌐 Domain Bilgileri

```
Domain Adı: _________________
www subdomain: _________________
```

## 🔑 Sunucu Erişim Bilgileri

```
SSH Kullanıcı: _________________ (genellikle root)
SSH Şifre: _________________
SSH Port: _________________ (genellikle 22)
```

## 🗄️ Veritabanı Bilgileri

```
MySQL Root Şifre: _________________
Veritabanı Adı: _________________ (smstk_db önerilir)
Veritabanı Kullanıcı: _________________ (smstk_user önerilir)
Veritabanı Şifre: _________________
```

## 🔐 Güvenlik Bilgileri

```
JWT Secret Key: _________________ (güçlü bir şifre)
```

## 📝 Örnek Doldurulmuş Form

```
Domain Adı: ornek.com
www subdomain: www.ornek.com

SSH Kullanıcı: root
SSH Şifre: mypassword123
SSH Port: 22

MySQL Root Şifre: mysqlroot123
Veritabanı Adı: smstk_db
Veritabanı Kullanıcı: smstk_user
Veritabanı Şifre: dbpassword123

JWT Secret Key: my-super-secret-jwt-key-2024
```

## 🚀 Hızlı Yükleme Komutları

Bilgileri doldurduktan sonra:

```bash
# 1. Deployment paketini yükleyin
scp deployment/smstk-clean-deployment.tar.gz root@yourdomain.com:/tmp/

# 2. Sunucuya bağlanın
ssh root@yourdomain.com

# 3. Otomatik kurulum
cd /tmp
tar -xzf smstk-clean-deployment.tar.gz
cd smstk-clean-deployment
chmod +x scripts/quick-deploy-ispmanager.sh
./scripts/quick-deploy-ispmanager.sh
```

## ❓ Yardım

Bilgileri nasıl bulacağınız:

1. **Domain:** Hosting sağlayıcınızdan aldığınız domain
2. **SSH Bilgileri:** Hosting sağlayıcınızın size verdiği sunucu bilgileri
3. **MySQL:** Hosting panelinizden veya sunucudan alabilirsiniz
4. **JWT Secret:** Kendiniz oluşturabilirsiniz (güçlü bir şifre)

---

**Not:** Bu bilgileri güvenli bir yerde saklayın! 