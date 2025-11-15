# Sprint 6 - Instance Oluşturma Test Senaryosu

## Test Senaryosu 1: Odoo.com Instance Oluşturma

### Adımlar:

1. `/odoo/instances/new` sayfasına git
2. Form alanlarını doldur:
   - Firma: AEKA Mobilya (veya mevcut bir firma)
   - Instance Adı: `AEKA Mobilya Production`
   - Instance URL: `https://aeka-mobilya.odoo.com` (veya gerçek URL)
   - Database Adı: `aeka_mobilya_db`
   - Deployment Method: `Odoo.com`
   - Version: `19.0`
   - Admin Username: `admin`
   - Admin Password: `[şifre]`
3. "Instance Oluştur" butonuna tıkla

### Beklenen Sonuç:

- ✅ Form submit edilir
- ✅ API'ye POST isteği gider (`/api/odoo/instances`)
- ✅ Instance database'e kaydedilir
- ✅ Instance detay sayfasına yönlendirilir (`/odoo/instances/[id]`)
- ✅ Instance listesinde görünür

### Kontrol Edilecekler:

- [ ] Form validasyonu çalışıyor mu?
- [ ] API endpoint doğru çalışıyor mu?
- [ ] Credentials şifreleniyor mu?
- [ ] Database'e kayıt başarılı mı?
- [ ] Redirect doğru çalışıyor mu?
- [ ] Hata mesajları kullanıcı dostu mu?

## Test Senaryosu 2: Odoo.sh Instance Oluşturma

### Adımlar:

1. `/odoo/instances/new` sayfasına git
2. Form alanlarını doldur:
   - Deployment Method: `Odoo.sh`
   - Diğer alanlar aynı
3. "Instance Oluştur" butonuna tıkla

### Beklenen Sonuç:

- ⚠️ Eğer `ODOO_SH_API_TOKEN` yoksa hata vermeli
- ✅ Eğer token varsa Odoo.sh API'ye istek gitmeli
- ✅ Instance oluşturulmalı

## Test Senaryosu 3: Hata Senaryoları

### 3.1: Eksik Alanlar

- Form boş submit edilirse hata mesajı gösterilmeli

### 3.2: Geçersiz URL

- Geçersiz URL formatı kontrol edilmeli

### 3.3: Yetkisiz Erişim

- Company admin başka firma için instance oluşturamamalı

## Tespit Edilen Sorunlar:

### Sorun 1: Form-API Tutarsızlığı

**Sorun:** Form'da `instance_url` gönderiliyor ama API'de `instanceUrl` bekleniyor. Ayrıca `odoo_com` için URL otomatik oluşturuluyor ama form'da manuel URL giriliyor.

**Çözüm:**

- Form'dan `instance_url` gönderilmeli
- API'de `instanceUrl` yerine `instanceUrl` veya `instance_url` kabul edilmeli
- `odoo_com` için URL formatı kontrol edilmeli

### Sorun 2: Odoo.com URL Formatı

**Sorun:** `odoo_com` için URL otomatik oluşturuluyor (`https://${subdomain}.odoo.com`) ama form'da manuel URL giriliyor.

**Çözüm:**

- Form'da `odoo_com` seçildiğinde URL alanı otomatik doldurulmalı veya
- API'de manuel URL kabul edilmeli ve subdomain çıkarılmalı
