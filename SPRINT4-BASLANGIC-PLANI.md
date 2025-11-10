# Sprint 4: Customer Portal & Multi-User System - Başlangıç Planı

**Tarih:** 2025-11-12  
**Durum:** 🚀 Başlangıç Aşaması

---

## 🎯 Sprint 4 Genel Bakış

### Amaç
Müşterilerin kendi projelerini görüntüleyebileceği, ilerlemeyi takip edebileceği ve destek alabileceği bir portal oluşturmak. Ayrıca multi-user sistem ile farklı roller ve izinler yönetmek.

### Odak Alanları
1. **Multi-User System** - Rol bazlı erişim kontrolü
2. **Customer Portal** - Müşteri self-service portalı
3. **Permissions Management** - İzin yönetimi
4. **Activity Logs** - Aktivite kayıtları

---

## 📊 Mevcut Durum Analizi

### ✅ Mevcutlar
- ✅ Database schema'da `user_role` enum mevcut (super_admin, company_admin, company_user, company_viewer)
- ✅ `profiles` tablosunda `role` kolonu var
- ✅ `companies` tablosu mevcut
- ✅ `projects` tablosu mevcut
- ✅ Authentication sistemi çalışıyor

### ⚠️ Eksikler
- ⚠️ Role-based access control (RLS policies eksik/eksik)
- ⚠️ Customer portal sayfaları
- ⚠️ Permissions management sistemi
- ⚠️ Activity logs sistemi
- ⚠️ Company admin portal
- ⚠️ Company user portal

---

## 🚀 İlk Adımlar

### Adım 1: Multi-User System & Permissions
**Süre:** 2-3 gün

**Yapılacaklar:**
1. RLS policies gözden geçir ve güncelle
2. Permissions service oluştur
3. Role-based access control helper'ları
4. Middleware ile route protection

**Çıktı:**
- Permissions service
- RLS policies güncellemeleri
- Route protection middleware

---

### Adım 2: Company Admin Portal
**Süre:** 2-3 gün

**Yapılacaklar:**
1. Company admin dashboard
2. Kullanıcı yönetimi (ekleme, çıkarma)
3. Proje takibi
4. Destek talepleri yönetimi
5. Raporlar

**Çıktı:**
- Company admin dashboard
- User management UI
- Project tracking UI

---

### Adım 3: Company User Portal
**Süre:** 2-3 gün

**Yapılacaklar:**
1. Company user dashboard
2. Sınırlı erişim (sadece kendi görevleri)
3. Eğitim materyalleri
4. Destek talepleri

**Çıktı:**
- Company user dashboard
- Limited access UI
- Training materials UI

---

### Adım 4: Customer Portal (Public)
**Süre:** 3-4 gün

**Yapılacaklar:**
1. Project dashboard (public)
2. Progress tracking
3. Document library
4. Training materials
5. Support ticket system
6. AI chatbot 7/24

**Çıktı:**
- Customer portal pages
- Project progress tracking
- Document library
- Support system

---

### Adım 5: Activity Logs
**Süre:** 1-2 gün

**Yapılacaklar:**
1. Activity log service
2. Activity log API
3. Activity log UI
4. Real-time activity updates

**Çıktı:**
- Activity log service
- Activity log API
- Activity log UI

---

## 📋 Öncelik Sırası

### Öncelik 1: Multi-User System (Hemen Başla)
1. RLS policies güncelle
2. Permissions service
3. Route protection

### Öncelik 2: Company Admin Portal (1. Hafta)
1. Admin dashboard
2. User management
3. Project tracking

### Öncelik 3: Company User Portal (1. Hafta)
1. User dashboard
2. Limited access
3. Training materials

### Öncelik 4: Customer Portal (2. Hafta)
1. Public project dashboard
2. Progress tracking
3. Support system

### Öncelik 5: Activity Logs (2. Hafta)
1. Activity logging
2. Activity UI
3. Real-time updates

---

## 🎯 İlk Sprint 4 Görevleri

### Görev 1: Permissions Service
- [ ] Permissions service oluştur
- [ ] Role-based permission check fonksiyonları
- [ ] Company-based permission check
- [ ] Project-based permission check

### Görev 2: RLS Policies Güncelleme
- [ ] Companies table RLS policies
- [ ] Projects table RLS policies
- [ ] Discoveries table RLS policies
- [ ] Support tickets RLS policies

### Görev 3: Route Protection Middleware
- [ ] Role-based route protection
- [ ] Company access check
- [ ] Project access check

---

## 💡 Notlar

1. **Mevcut Schema**: Database'de role yapısı mevcut, sadece RLS ve permissions eksik
2. **Incremental Approach**: Adım adım ilerlemek daha iyi
3. **Security First**: Permissions ve RLS öncelikli
4. **User Experience**: Her rol için uygun UI/UX

---

**Son Güncelleme:** 2025-11-12  
**Durum:** Planlama tamamlandı, başlangıç için hazır 🚀

