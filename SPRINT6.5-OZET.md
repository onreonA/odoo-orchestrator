# 📋 SPRINT 6.5 ÖZET: DEPARTMENT & TASK MANAGEMENT

**Tarih:** 13 Kasım 2024  
**Durum:** Planlandı, implementasyon bekliyor

---

## 🎯 NEDEN SPRINT 6.5?

### **Tespit Edilen Eksiklik:**

Sprint 6'da Odoo integration ve template deployment tamamlandı. Ancak **Kick-off dokümanlarında** (AEKA, Şahbaz, FWA) olan kritik bir yapı eksik:

```
Kick-off Dokümanlarında:
✅ Departman Temsilcileri listesi var
✅ Her departman için görevler var
✅ 2 haftalık detaylı plan var
✅ Belge gereksinimleri var

Platform'da:
❌ Departman yapısı yok
❌ Görev ataması yok
❌ Bildirim sistemi yok
❌ Görev takibi yok
```

### **Gerçek Kullanım Senaryosu:**

```
Danışman → AEKA Kick-off template'i seç → Deploy et

Şu anki durum:
✅ Odoo instance oluşturuldu
✅ Modüller kuruldu
❌ Departman sorumluları manuel atanacak
❌ Görevler manuel girilecek
❌ Takvim manuel oluşturulacak

Olması gereken:
✅ Odoo instance oluşturuldu
✅ Modüller kuruldu
✅ 8 departman otomatik oluşturuldu
✅ Her departmana görevler atandı
✅ Sorumlulara davetiye gönderildi
✅ Takvim olayları oluşturuldu
✅ Bildirimler gönderildi
```

---

## 📊 KAPSAM

### **Database (11 Yeni Tablo)**

1. **`departments`** - Departman bilgileri
2. **`department_members`** - Departman üyeleri
3. **`department_contacts`** - Davet bekleyen kişiler
4. **`tasks`** - Görevler
5. **`task_dependencies`** - Görev bağımlılıkları
6. **`task_attachments`** - Görev dosyaları
7. **`task_collaborators`** - Görev işbirlikçileri
8. **`notifications`** - Bildirimler
9. **`notification_preferences`** - Bildirim tercihleri
10. **`project_phases`** - Proje fazları
11. **`project_milestones`** - Proje kilometre taşları

### **Core Services (5 Adet)**

1. **Department Service** - Departman CRUD
2. **Department Contact Service** - Davet sistemi
3. **Task Service** - Görev yönetimi
4. **Notification Service** - Bildirim gönderimi
5. **Project Phase Service** - Faz yönetimi

### **Template Genişletme**

**Yeni Interface Alanları:**
- `departments[]` - Departman listesi
- `tasks[]` - Her departman için görevler
- `calendar_events[]` - Her departman için takvim olayları
- `project_timeline` - Proje fazları ve milestone'lar
- `required_documents[]` - Belge gereksinimleri

**AEKA Template Güncelleme:**
- 8 departman tanımı
- Her departman için 5-10 görev
- Her departman için 2-3 takvim olayı
- 2 haftalık proje planı
- Belge şablonları

### **UI (6 Sayfa + 12 Component)**

**Sayfalar:**
1. Departman listesi
2. Departman detayı
3. Görev listesi (firma bazlı)
4. Görevlerim (kullanıcı bazlı)
5. Ekip yönetimi
6. Davetiye kabul sayfası

**Componentler:**
- Department card, list
- Task card, list, detail modal
- Task completion form
- File upload
- Notification bell, list
- Onboarding tour

---

## 🔄 AKIŞ

### **1. Template Deployment**

```
Danışman: AEKA template seç + Deploy

Sistem:
1. Odoo instance oluştur ✅
2. Modülleri kur ✅
3. Proje fazlarını oluştur ⭐ YENİ
4. Departmanları oluştur ⭐ YENİ
   - Platform'da department kayıt
   - Odoo'da hr.department oluştur
5. Görevleri oluştur ⭐ YENİ
   - Her departman için görevler
   - Bağımlılıkları ayarla
   - Belge gereksinimlerini ekle
6. Takvim olaylarını oluştur ⭐ YENİ
7. Bildirim gönder ⭐ YENİ
```

### **2. Departman Sorumlusu Davet Etme**

```
Danışman: Departman sayfası → Sorumlu ekle

Form:
- İsim: Mehmet Demir
- Email: mehmet@aeka.com
- Telefon: 555-1234
- Rol: Üretim Müdürü

Sistem:
1. department_contacts tablosuna kaydet
2. Davet token oluştur
3. Email gönder:
   "AEKA Mobilya ERP projesinde Üretim Departmanı 
    sorumlusu olarak atandınız. Size 8 görev atandı.
    [Davetiyeyi Kabul Et]"
```

### **3. Departman Sorumlusu Kayıt Olma**

```
Mehmet Demir: Email'deki linke tıkla

Sayfa: /invite/[token]
1. Email doğrulama (otomatik dolu)
2. Şifre oluşturma
3. Profil tamamlama

Sistem:
1. Supabase Auth'da kullanıcı oluştur
2. profiles tablosuna kaydet
3. department_contacts.user_id güncelle
4. department_members tablosuna ekle (manager)
5. Görevleri bu kullanıcıya ata
6. Hoş geldin bildirimi gönder
```

### **4. Departman Sorumlusu İlk Giriş**

```
Mehmet Demir: Platform'a giriş yap

Dashboard:
📋 BENİM GÖREVLER (8 adet)
├── ⏰ Bugün: Ürün BOM listesi hazırla
├── 📅 Bu Hafta: Üretim süreci dokümantasyonu
└── 🔔 Yaklaşan: Üretim ekibi toplantısı

📅 TAKVİMİM
├── 20 Kasım 10:00 - Üretim Ekibi Toplantısı
└── 22 Kasım 14:00 - BOM Review Toplantısı

👥 DEPARTMANIM: Üretim
├── Toplam Görevler: 8
├── Tamamlanan: 0
└── Ekip Üyeleri: 1 kişi (sen)
```

### **5. Görev Tamamlama**

```
Mehmet Demir: "Ürün BOM listesi hazırla" görevini aç

Görev Detayı:
- Açıklama: Tüm ürünler için malzeme listesi
- Teslim Tarihi: 22 Kasım
- Gerekli Belgeler:
  ✅ BOM Listesi (Excel - şablon indir)
  
[Tamamlandı İşaretle] butonu

Sistem:
1. Dosya yükleme formu göster
2. Dosyayı kontrol et (format, satır sayısı)
3. Görev durumu: "pending_review"
4. Danışmana bildirim gönder

Danışman:
1. Bildirim alır: "Mehmet Demir BOM listesini yükledi"
2. Dosyayı inceler
3. [Onayla] veya [Reddet] butonuna basar

Sistem:
1. Görev durumu: "completed" veya "pending"
2. Mehmet'e bildirim gönder
```

### **6. Danışman Takibi**

```
Danışman Dashboard:

TÜMSM FİRMALAR
├── AEKA: 50 görev (30 bekleyen, 15 tamamlandı, 5 gecikmiş)
├── Şahbaz: 60 görev (40 bekleyen, 20 tamamlandı)
└── FWA: 40 görev (25 bekleyen, 15 tamamlandı)

BUGÜN YAPILACAKLAR
├── AEKA: BOM dosyasını incele ve onayla
├── Şahbaz: Üretim toplantısı (14:00)
└── FWA: Kalite kontrol sürecini gözden geçir

GECİKENLER (ACİL!)
└── AEKA: "Ürün kataloğu" 2 gün gecikmiş
```

---

## ✅ BAŞARI KRİTERLERİ

### **Teknik:**
- ✅ 11 yeni tablo oluşturuldu
- ✅ 5 core service hazır
- ✅ 15 API endpoint çalışıyor
- ✅ 10+ UI component hazır
- ✅ RLS policies aktif
- ✅ Unit tests %80+ coverage
- ✅ E2E tests geçiyor

### **Fonksiyonel:**
- ✅ Template deploy edilince departmanlar otomatik oluşuyor
- ✅ Görevler departmanlara atanıyor
- ✅ Bildirimler gönderiliyor (Email + Platform)
- ✅ Davetiye sistemi çalışıyor
- ✅ Görev tamamlama ve onay süreci çalışıyor
- ✅ Dosya yükleme çalışıyor
- ✅ Danışman tüm firmaları tek ekrandan takip edebiliyor

### **Kullanıcı Deneyimi:**
- ✅ Departman sorumlusu davetiyeyi kabul edip platforma girebiliyor
- ✅ Görevlerini görebiliyor ve tamamlayabiliyor
- ✅ Dosya yükleyebiliyor
- ✅ Bildirim alıyor
- ✅ Onboarding tour çalışıyor
- ✅ Danışman onay verebiliyor/reddedebiliyor

---

## 📅 ZAMAN PLANI

**Toplam:** 4-5 gün (32-40 saat)

**Gün 1-2 (16 saat):** Database & Core Services
- Migrations yaz
- 5 service geliştir
- Unit testler

**Gün 3 (8 saat):** Template & Deployment
- KickoffTemplate interface güncelle
- AEKA template'ine departman/görev ekle
- Deployment engine güncelle

**Gün 4-5 (16 saat):** UI & Testing
- 15 API endpoint
- 6 sayfa + 12 component
- E2E testler

---

## 🔗 BAĞIMLILIKLAR

**Önce Tamamlanmalı:**
- ✅ Sprint 6 (Odoo Integration Core)

**Sonraki Sprint'lere Etkisi:**
- ✅ Sprint 7: AI departman yapısını kullanacak
- ✅ Sprint 9: Consultant calendar ile entegre olacak

---

## 💡 ÖNEMLİ NOTLAR

### **Neden Senaryo 1 (Sıfırdan Başlangıç)?**

İki senaryo vardı:
1. **Senaryo 1:** Platform'da departman oluştur → Odoo'ya gönder (tek yön)
2. **Senaryo 2:** Odoo'dan departman çek → Platform'a senkronize et (iki yön)

**Seçim: Senaryo 1**

**Nedenler:**
- ✅ %95 kullanım durumu (yeni firmalar)
- ✅ Temiz, kontrollü, tutarlı
- ✅ Hızlı geliştirme (3-4 gün)
- ✅ Minimal bakım
- ✅ Template-driven vizyon ile uyumlu

**Senaryo 2:** Sprint 9-10'da opsiyonel olarak eklenebilir (%5 özel durumlar için)

### **Kritik Özellikler (İlk 3 gün):**

1. ⭐⭐⭐⭐⭐ Bildirim sistemi (Email + Platform)
2. ⭐⭐⭐⭐⭐ Görev tamamlama doğrulama (Dosya + Onay)
3. ⭐⭐⭐⭐⭐ Belge gereksinimleri ve şablonları
4. ⭐⭐⭐⭐⭐ Rol bazlı yetkilendirme

### **İyileştirmeler (Sprint 7-8'e bırakılabilir):**

5. ⏳ Görev bağımlılıkları
6. ⏳ Onboarding sistemi (detaylı)
7. ⏳ Proje fazları ve milestone'lar (detaylı)
8. ⏳ Departmanlar arası işbirliği
9. ⏳ Dinamik görev süreleri

---

## 📄 DETAYLI DOKÜMANTASYON

**Ana Doküman:** `SPRINT6.5-DEPARTMENT-TASK-MANAGEMENT.md`

**İçerik:**
- Detaylı database schema (11 tablo)
- Service interface'leri
- Template yapısı
- API endpoint'ler
- UI component'ler
- Test senaryoları
- Risk analizi

---

**Hazırlayan:** AI Assistant  
**Tarih:** 13 Kasım 2024  
**Durum:** Onay Bekliyor

