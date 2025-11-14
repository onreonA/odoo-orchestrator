# Sprint 6 - Instance Detay Sayfası Test Senaryosu

## Test Senaryosu 1: Instance Detay Sayfası Görüntüleme

### Adımlar:
1. `/odoo/instances` sayfasına git
2. Bir instance'a tıkla (veya `/odoo/instances/[id]` URL'ine git)
3. Sayfanın yüklendiğini kontrol et

### Beklenen Sonuç:
- ✅ Instance bilgileri görüntülenir:
  - Instance adı
  - Instance URL
  - Status badge
  - Deployment method
  - Database adı
  - Version
- ✅ Active deployments gösterilir (varsa)
- ✅ Quick actions görüntülenir:
  - Health Check
  - Backups
  - Deployments

### Kontrol Edilecekler:
- [ ] Instance bilgileri doğru gösteriliyor mu?
- [ ] Status badge doğru renkte mi?
- [ ] Deployment method icon'u doğru mu?
- [ ] Active deployments gösteriliyor mu?
- [ ] Quick actions linkleri çalışıyor mu?
- [ ] Hata durumunda graceful handling var mı?

## Test Senaryosu 2: Olmayan Instance

### Adımlar:
1. `/odoo/instances/invalid-uuid` URL'ine git
2. Sayfanın yüklendiğini kontrol et

### Beklenen Sonuç:
- ✅ "Instance Bulunamadı" mesajı gösterilir
- ✅ "Instance Listesine Dön" butonu çalışır
- ✅ Hata sayfası kullanıcı dostu

## Test Senaryosu 3: Active Deployments

### Adımlar:
1. Bir instance detay sayfasına git
2. Eğer aktif deployment varsa gösterilir
3. Deployment progress component'i çalışır

### Beklenen Sonuç:
- ✅ Active deployments listelenir
- ✅ Deployment progress gösterilir
- ✅ Eğer deployment yoksa boş liste gösterilir (hata vermez)

## Tespit Edilen Sorunlar:

### Sorun 1: Quick Actions Linkleri
**Sorun:** Quick actions linkleri (`/odoo/instances/${id}/health`, `/odoo/instances/${id}/backups`) henüz oluşturulmamış olabilir.

**Çözüm:** 
- Bu sayfaları oluşturmalıyız veya
- Linkleri kaldırmalıyız veya
- Placeholder sayfaları oluşturmalıyız

### Sorun 2: Instance URL Validation
**Sorun:** Instance URL'in geçerli olup olmadığı kontrol edilmiyor.

**Çözüm:** URL validation eklenebilir.

