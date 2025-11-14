# Sprint 6 - Test Sonuçları ve Düzeltilen Sorunlar

## ✅ Düzeltilen Sorunlar

### 1. UNIQUE(company_id) Constraint Hata Mesajı
**Sorun:** Bir firma için zaten instance varsa, hata mesajı kullanıcı dostu değildi.

**Çözüm:**
- `odoo-instance-service.ts` içinde `23505` error code kontrolü eklendi
- Türkçe hata mesajı: "Bu firma için zaten bir instance mevcut. Bir firma için sadece bir instance oluşturulabilir."

**Dosya:** `lib/services/odoo-instance-service.ts:243-248`

### 2. Form Hata Mesajları İyileştirildi
**Sorun:** API'den gelen hata mesajları kullanıcı dostu değildi.

**Çözüm:**
- Form'da hata mesajları iyileştirildi
- Özel hata durumları için Türkçe mesajlar eklendi:
  - `company_id` hatası → "Bu firma için zaten bir instance mevcut..."
  - `Missing required fields` → "Lütfen tüm zorunlu alanları doldurun."
  - `Forbidden` → "Bu işlem için yetkiniz bulunmamaktadır."

**Dosya:** `app/(dashboard)/odoo/instances/new/page.tsx:94-108`

### 3. Instance URL Placeholder ve Validasyon
**Sorun:** Instance URL zorunlu ama `odoo_com` için otomatik oluşturulabiliyordu.

**Çözüm:**
- `odoo_com` için URL `required` değil (otomatik oluşturulabilir)
- Diğer deployment method'lar için URL zorunlu
- Placeholder ve yardımcı metin eklendi
- API'de `odoo_com` dışındaki method'lar için URL validasyonu eklendi

**Dosyalar:**
- `app/(dashboard)/odoo/instances/new/page.tsx:178-195`
- `app/api/odoo/instances/route.ts:115-120`

## 📝 Test Script'leri

### 1. Instance Oluşturma Test Script'i
**Dosya:** `scripts/test-instance-create.js`

**Kullanım:**
1. Browser'da `/odoo/instances/new` sayfasına gidin
2. F12 ile Developer Tools'u açın
3. Console sekmesine geçin
4. Script'i yapıştırın ve Enter'a basın

**Test Edilenler:**
- Company listesi alma
- Instance oluşturma
- Hata handling
- Redirect kontrolü

### 2. Instance Detay Sayfası Test Script'i
**Dosya:** `scripts/test-instance-detail.js`

**Kullanım:**
1. Browser'da `/odoo/instances/[id]` sayfasına gidin
2. F12 ile Developer Tools'u açın
3. Console sekmesine geçin
4. Script'i yapıştırın ve Enter'a basın

**Test Edilenler:**
- Instance bilgileri alma
- Active deployments kontrolü
- Health check (opsiyonel)

## 🔍 Tespit Edilen Ancak Düzeltilmeyen Sorunlar

### 1. UNIQUE(company_id) Constraint
**Durum:** Bir firma için sadece bir instance oluşturulabilir.

**Not:** Bu bir tasarım kararı. Eğer bir firma için birden fazla instance gerekirse (örneğin test ve production), constraint kaldırılabilir veya `instance_name` ile birlikte unique yapılabilir.

**Öneri:** Şimdilik bu şekilde bırakıldı çünkü:
- Çoğu durumda bir firma için bir instance yeterli
- Test ve production için ayrı firmalar oluşturulabilir
- Gerekirse ileride değiştirilebilir

## 📊 Test Senaryoları

### Senaryo 1: Başarılı Instance Oluşturma
1. `/odoo/instances/new` sayfasına git
2. Form alanlarını doldur
3. "Instance Oluştur" butonuna tıkla
4. ✅ Instance oluşturulur ve detay sayfasına yönlendirilir

### Senaryo 2: Aynı Firma İçin İkinci Instance
1. Bir firma için instance oluştur
2. Aynı firma için tekrar instance oluşturmayı dene
3. ✅ Kullanıcı dostu hata mesajı gösterilir

### Senaryo 3: Odoo.com Instance URL Otomatik Oluşturma
1. `/odoo/instances/new` sayfasına git
2. Deployment method: `Odoo.com` seç
3. Instance URL'i boş bırak
4. Diğer alanları doldur ve gönder
5. ✅ URL otomatik oluşturulur

### Senaryo 4: Diğer Deployment Method'larda URL Zorunlu
1. `/odoo/instances/new` sayfasına git
2. Deployment method: `Docker` veya `Manual` seç
3. Instance URL'i boş bırak
4. Form submit et
5. ✅ Hata mesajı gösterilir (URL zorunlu)

## 🎯 Sonraki Adımlar

1. ✅ Gerçek testler çalıştırıldı
2. ✅ Sorunlar tespit edildi ve düzeltildi
3. ⏳ Browser'da manuel testler yapılabilir (test script'leri hazır)
4. ⏳ Sprint 6 tamamlama (Git-based deployment entegrasyonu)
5. ⏳ Sprint 7'ye geçiş hazırlığı

