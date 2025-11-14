# Test Checklist - Sprint 6

## ✅ Tamamlanan Düzeltmeler

- [x] `lib/supabase/server.ts` - Server-side Supabase client
- [x] `lib/supabase/client.ts` - Client-side Supabase client  
- [x] `components/ui/button.tsx` - Button component
- [x] `lib/utils.ts` - cn utility function
- [x] `ENCRYPTION_MASTER_KEY` - Environment variable
- [x] `app/(dashboard)/layout.tsx` - Dashboard layout
- [x] `app/(dashboard)/odoo/instances/[id]/page.tsx` - "new" route kontrolü

## 🔍 Test Edilmesi Gerekenler

### 1. Temel Sayfalar
- [ ] `/login` - Giriş sayfası
- [ ] `/dashboard` - Ana dashboard
- [ ] `/companies` - Firma listesi
- [ ] `/calendar` - Takvim
- [ ] `/emails` - Email
- [ ] `/messages` - Mesajlar

### 2. Odoo Modülü (Sprint 6)
- [ ] `/odoo/instances` - Instance listesi
- [ ] `/odoo/instances/[id]` - Instance detay (gerçek UUID ile)
- [ ] `/odoo/deployments` - Deployment listesi
- [ ] `/odoo/deployments/[id]` - Deployment detay

### 3. API Endpoints
- [ ] `GET /api/odoo/instances` - Instance listesi
- [ ] `GET /api/odoo/instances/[id]` - Instance detay
- [ ] `GET /api/odoo/deployments` - Deployment listesi
- [ ] `GET /api/health` - Health check

### 4. Component'ler
- [ ] `InstanceList` - Instance listesi component'i
- [ ] `DeploymentProgress` - Deployment progress component'i
- [ ] `LogViewer` - Log viewer component'i
- [ ] `RollbackButton` - Rollback button component'i

## 🐛 Bilinen Sorunlar

1. **Environment Variables**: Tüm gerekli env var'lar kontrol edilmeli
2. **Database Migrations**: Migration'ların çalıştığından emin olunmalı
3. **Authentication**: Login/logout akışı test edilmeli
4. **Route Conflicts**: Dynamic route'ların çakışmadığından emin olunmalı

## 📝 Test Senaryoları

### Senaryo 1: Instance Listesi Görüntüleme
1. `/odoo/instances` sayfasına git
2. Instance listesi görüntülenmeli
3. Eğer instance yoksa, boş durum mesajı gösterilmeli

### Senaryo 2: Instance Detay Görüntüleme
1. `/odoo/instances` sayfasından bir instance'a tıkla
2. Instance detay sayfası açılmalı
3. Instance bilgileri görüntülenmeli

### Senaryo 3: "new" Route Koruması
1. `/odoo/instances/new` sayfasına git
2. `/odoo/instances` sayfasına redirect edilmeli
3. Hata vermemeli

## 🚀 Sonraki Adımlar

1. **Manuel Test**: Her sayfayı tek tek test et
2. **E2E Test**: Playwright ile otomatik test yaz
3. **Error Handling**: Tüm error durumlarını handle et
4. **Loading States**: Loading state'leri ekle
5. **Empty States**: Boş durum mesajları ekle


