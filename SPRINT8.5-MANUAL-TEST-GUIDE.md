# 🧪 SPRINT 8.5: MANUEL TEST REHBERİ

**Tarih:** 16 Kasım 2025  
**Durum:** ✅ Kod Tamamlandı - Manuel Test Bekleniyor

---

## 📋 TEST SENARYOSU: ODOO PROJECT AUTO-DEPLOYMENT

### **Hazırlık**

1. **Odoo Instance Hazır Olmalı:**
   - Odoo 19.0 kurulu olmalı
   - Project modülü aktif olmalı
   - Admin kullanıcı bilgileri mevcut olmalı

2. **Template Library'de Template Olmalı:**
   - Şahbaz template'i database'de olmalı (`template_id: sahbaz-manufacturing-kickoff-v1`)
   - Veya AEKA template'i (`template_id: aeka-mobilya-kickoff-v1`)

---

## 🎯 TEST ADIMLARI

### **Test 1: Şahbaz Template Deployment**

#### **1.1. Template'i Deploy Et**

**API Endpoint:**
```bash
POST /api/templates/library/deploy
```

**Request Body:**
```json
{
  "template_id": "sahbaz-manufacturing-kickoff-v1",
  "company_id": "your-company-id",
  "project_id": "your-project-id",
  "customizations": {
    "projectName": "Şahbaz ERP Kurulum Projesi",
    "startDate": "2025-11-17",
    "partnerId": 123  // Opsiyonel: Odoo'da company partner ID
  }
}
```

#### **1.2. Deployment Sonuçlarını Kontrol Et**

**API Endpoint:**
```bash
GET /api/odoo/deployments/{deployment_id}
```

**Kontrol Edilecekler:**
- ✅ Deployment status: `success`
- ✅ `result_data.odoo_project_id` var mı?
- ✅ `result_data.stage_ids` array'i var mı? (6 stage olmalı)
- ✅ `result_data.task_ids` array'i var mı?
- ✅ `result_data.milestone_ids` array'i var mı?

#### **1.3. Odoo'da Projeyi Kontrol Et**

**Odoo'da Kontrol:**
1. Project modülüne git
2. "Şahbaz ERP Kurulum Projesi" adlı projeyi bul
3. Projeyi aç

**Kontrol Edilecekler:**

**✅ Project Özellikleri:**
- Proje adı: "Şahbaz ERP Kurulum Projesi"
- `use_tasks: true`
- `use_subtasks: true`
- `allow_milestones: true`

**✅ Stages (Fazlar):**
- FAZ 0: Pre-Analiz (sequence: 0)
- FAZ 1: Detaylı Analiz (sequence: 1)
- FAZ 2: Blueprint & Tasarım (sequence: 2)
- FAZ 3: Uygulama (sequence: 3)
- FAZ 4: Go-Live & Destek (sequence: 4)
- Tamamlandı (sequence: 5)

**✅ Tasks (Görevler):**
- Tüm departmanlardan görevler oluşturulmuş mu?
- Görevler doğru stage'lere atanmış mı?
- Task açıklamaları belgeler ve işbirlikçi departmanları içeriyor mu?
- Deadline'lar doğru hesaplanmış mı?
- Priority'ler doğru map edilmiş mi?

**✅ Milestones:**
- Pre-Analiz Raporu Tamamlandı (deadline: 2025-11-25)
- Detaylı Analiz Raporu Tamamlandı (deadline: 2025-12-23)
- Blueprint Onaylandı (deadline: 2026-01-06)
- UAT Tamamlandı (deadline: 2026-02-17)
- Go-Live (deadline: 2026-03-03)

---

### **Test 2: AEKA Template Deployment**

Aynı adımları AEKA template'i ile tekrarlayın:

**Request Body:**
```json
{
  "template_id": "aeka-mobilya-kickoff-v1",
  "company_id": "aeka-company-id",
  "project_id": "aeka-project-id",
  "customizations": {
    "projectName": "AEKA Mobilya ERP Kurulum Projesi",
    "startDate": "2025-11-17"
  }
}
```

**Kontrol Edilecekler:**
- Proje adı: "AEKA Mobilya ERP Kurulum Projesi"
- 6 stage oluşturulmuş mu?
- Mobilya sektörüne özel görevler var mı?

---

## 🐛 SORUN GİDERME

### **Sorun 1: Project Oluşturulmadı**

**Kontrol:**
- Template'de `project_timeline` var mı?
- Template'de `departments` var mı?
- Deployment logs'u kontrol et: `GET /api/odoo/deployments/{id}/logs`

**Çözüm:**
- Template structure'ı kontrol et
- Deployment log'larında hata var mı bak

### **Sorun 2: Stages Oluşturulmadı**

**Kontrol:**
- Odoo'da Project modülü aktif mi?
- `project.task.type` modeli erişilebilir mi?

**Çözüm:**
- Odoo'da Project modülünü aktif et
- Admin kullanıcı ile bağlan

### **Sorun 3: Tasks Oluşturulmadı**

**Kontrol:**
- Template'de `departments[].tasks` var mı?
- Task'ların `phase` alanı doğru mu?

**Çözüm:**
- Template structure'ı kontrol et
- Task phase'lerini kontrol et

### **Sorun 4: Milestones Oluşturulmadı**

**Kontrol:**
- Template'de `project_timeline.milestones` var mı?
- Milestone deadline'ları geçerli tarih formatında mı?

**Çözüm:**
- Template'de milestones array'ini kontrol et
- Deadline formatını kontrol et (ISO date string)

---

## ✅ BAŞARI KRİTERLERİ

Manuel test başarılı sayılır eğer:

- ✅ Template deployment başarılı
- ✅ Odoo'da proje oluşturuldu
- ✅ 6 stage (faz) oluşturuldu
- ✅ Tüm görevler oluşturuldu ve doğru stage'lere atandı
- ✅ Milestones oluşturuldu
- ✅ Task açıklamaları belgeler ve işbirlikçi departmanları içeriyor
- ✅ Deadline'lar doğru hesaplanmış
- ✅ Priority'ler doğru map edilmiş

---

## 📝 TEST SONUÇ RAPORU

Test sonrası şu bilgileri kaydedin:

```markdown
## Test Sonuçları

**Test Tarihi:** [Tarih]
**Test Eden:** [İsim]
**Template:** [Şahbaz/AEKA]
**Odoo Instance:** [URL]

### Sonuçlar:
- [ ] Project oluşturuldu
- [ ] Stages oluşturuldu (6 adet)
- [ ] Tasks oluşturuldu ([X] adet)
- [ ] Milestones oluşturuldu ([X] adet)
- [ ] Task açıklamaları doğru
- [ ] Deadline'lar doğru
- [ ] Priority'ler doğru

### Sorunlar:
- [Sorun varsa buraya yaz]

### Notlar:
- [Ek notlar]
```

---

## 🚀 SONRAKI ADIMLAR

Manuel test başarılı olduktan sonra:

1. ✅ Integration testleri düzelt (mock sorunlarını çöz)
2. ✅ Production'a deploy et
3. ✅ Gerçek müşteri projelerinde kullan

---

**Hazırlayan:** AI Assistant  
**Versiyon:** 1.0  
**Tarih:** 16 Kasım 2025




