# Sprint 6 - Template Deployment Test Senaryosu

## Test Senaryosu 1: Kickoff Template Deployment

### Önkoşullar:

- ✅ Bir Odoo instance'ı oluşturulmuş olmalı
- ✅ Template deployment engine çalışıyor olmalı
- ✅ Odoo instance'a bağlanabiliyor olmalı

### Adımlar:

1. `/api/odoo/deployments` endpoint'ine POST isteği gönder:

```json
{
  "instanceId": "[instance-id]",
  "templateId": "kickoff-mobilya-v1",
  "templateType": "kickoff",
  "customizations": {
    "modules": ["mrp", "stock", "sale_management"],
    "customFields": []
  }
}
```

2. Deployment başlatılır
3. Deployment progress takip edilir
4. Deployment tamamlanır

### Beklenen Sonuç:

- ✅ Deployment kaydı oluşturulur (`template_deployments` tablosuna)
- ✅ Deployment status: `pending` → `in_progress` → `success`
- ✅ Progress: 0% → 100%
- ✅ Log kayıtları oluşturulur (`deployment_logs` tablosuna)
- ✅ Odoo instance'a modüller kurulur
- ✅ Custom fields oluşturulur (varsa)
- ✅ Workflows oluşturulur (varsa)

### Kontrol Edilecekler:

- [ ] Deployment API endpoint çalışıyor mu?
- [ ] Deployment kaydı database'e kaydediliyor mu?
- [ ] Progress tracking çalışıyor mu?
- [ ] Log kayıtları oluşturuluyor mu?
- [ ] Odoo bağlantısı başarılı mı?
- [ ] Modül kurulumu başarılı mı?
- [ ] Hata durumunda rollback çalışıyor mu?

## Test Senaryosu 2: Deployment Progress Tracking

### Adımlar:

1. Bir deployment başlat
2. `/api/odoo/deployments/[id]` endpoint'ine GET isteği gönder
3. Progress'i kontrol et

### Beklenen Sonuç:

- ✅ Deployment status döndürülür
- ✅ Progress percentage döndürülür
- ✅ Current step bilgisi döndürülür
- ✅ Error message varsa döndürülür

## Test Senaryosu 3: Deployment Logs

### Adımlar:

1. Bir deployment başlat
2. `/api/odoo/deployments/[id]/logs` endpoint'ine GET isteği gönder
3. Log kayıtlarını kontrol et

### Beklenen Sonuç:

- ✅ Log kayıtları döndürülür
- ✅ Log level'ları doğru (debug, info, warning, error)
- ✅ Log mesajları anlamlı
- ✅ Timestamp'ler doğru

## Test Senaryosu 4: Deployment Rollback

### Adımlar:

1. Bir deployment başlat ve tamamla
2. `/api/odoo/deployments/[id]/rollback` endpoint'ine POST isteği gönder
3. Rollback işlemini kontrol et

### Beklenen Sonuç:

- ✅ Rollback başlatılır
- ✅ Deployment status: `rolled_back`
- ✅ Odoo instance önceki duruma döner
- ✅ Backup'tan restore edilir (varsa)

## Test Senaryosu 5: Hata Senaryoları

### 5.1: Geçersiz Instance ID

- Geçersiz instance ID ile deployment başlatılırsa hata vermeli

### 5.2: Geçersiz Template ID

- Geçersiz template ID ile deployment başlatılırsa hata vermeli

### 5.3: Odoo Bağlantı Hatası

- Odoo instance'a bağlanılamazsa hata vermeli ve rollback yapılmalı

### 5.4: Modül Kurulum Hatası

- Modül kurulumu başarısız olursa hata vermeli ve rollback yapılmalı

## Tespit Edilen Sorunlar:

### Sorun 1: Template ID Validation

**Sorun:** Template ID'nin geçerli olup olmadığı kontrol edilmiyor.

**Çözüm:** Template validation eklenebilir.

### Sorun 2: Deployment UI Eksik

**Sorun:** Deployment başlatmak için UI sayfası yok.

**Çözüm:** Deployment UI sayfası oluşturulmalı.

### Sorun 3: Real-time Progress Updates

**Sorun:** Deployment progress real-time güncellenmiyor.

**Çözüm:** WebSocket veya polling ile real-time updates eklenebilir.
