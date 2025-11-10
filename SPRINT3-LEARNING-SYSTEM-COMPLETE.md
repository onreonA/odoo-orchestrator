# Sprint 3 - Learning System & Decision Making ✅

**Tarih:** 2025-11-12  
**Durum:** ✅ Tamamlandı

---

## 🎯 Yapılanlar

### 1. Learning Service ✅

#### Oluşturulan Dosya:
- ✅ `lib/services/learning-service.ts`

#### Özellikler:
- **Karar Kaydetme**: Kullanıcı kararlarını kaydetme
- **Pattern Öğrenme**: Karar pattern'lerini öğrenme
- **İletişim Tarzı Analizi**: Email'lerden iletişim tarzını çıkarma
- **Öncelik Pattern'leri**: Görev önceliklendirme pattern'leri
- **Zaman Tercihleri**: Toplantı zamanlarından tercihleri öğrenme
- **Pattern Confidence**: Pattern güven skorları

#### Metodlar:
- `recordDecision()` - Karar kaydet
- `getDecisionPatterns()` - Karar pattern'lerini getir
- `suggestDecision()` - Benzer durumlar için öneri oluştur
- `learnCommunicationStyle()` - İletişim tarzını öğren
- `learnPriorityPattern()` - Öncelik pattern'lerini öğren
- `learnTimePreferences()` - Zaman tercihlerini öğren
- `getUserPatterns()` - Kullanıcının pattern'lerini getir
- `updatePatternConfidence()` - Pattern confidence'ını güncelle

---

### 2. Decision Making Service ✅

#### Oluşturulan Dosya:
- ✅ `lib/services/decision-making-service.ts`

#### Özellikler:
- **Karar Seviyeleri**: Automatic, Suggestion, Consultation
- **Otonom Karar Verme**: Yüksek güvenli rutin kararlar için otomatik karar
- **Öneri Oluşturma**: Orta güvenli durumlar için öneri
- **Kural Sistemi**: Esnek kural tabanlı karar verme
- **Varsayılan Kurallar**: Email ve Calendar için hazır kurallar

#### Karar Seviyeleri:
- **Automatic** (confidence > 0.8, rutin görevler): AI otomatik karar verir
- **Suggestion** (confidence > 0.6): AI önerir, kullanıcı onaylar
- **Consultation** (confidence < 0.6): AI analiz eder, kullanıcı karar verir

#### Metodlar:
- `makeDecision()` - Karar ver
- `executeAutomaticDecision()` - Otomatik kararı uygula
- `generateSuggestion()` - Öneri oluştur
- `addRule()` - Kural ekle
- `applyRules()` - Kuralları uygula
- `initializeDefaultRules()` - Varsayılan kuralları oluştur

---

### 3. Learning API ✅

#### Oluşturulan Dosya:
- ✅ `app/api/ai/learn/route.ts`

#### Endpoints:
- `POST /api/ai/learn` - Öğrenme işlemleri
  - `record-decision` - Karar kaydet
  - `learn-communication` - İletişim tarzını öğren
  - `learn-priority` - Öncelik pattern'lerini öğren
  - `learn-time-preferences` - Zaman tercihlerini öğren
- `GET /api/ai/learn/patterns` - Öğrenilmiş pattern'leri getir

---

### 4. Decision Making API ✅

#### Oluşturulan Dosya:
- ✅ `app/api/ai/decide/route.ts`

#### Endpoints:
- `POST /api/ai/decide` - Karar verme işlemleri
  - `make-decision` - Karar ver
  - `execute-automatic` - Otomatik kararı uygula
  - `generate-suggestion` - Öneri oluştur

---

## 📊 Öğrenme Kapsamı

### Karar Paternleri
- ✅ Context tipine göre karar pattern'leri
- ✅ Başarı oranına göre confidence hesaplama
- ✅ Benzer durumlar için öneri oluşturma

### İletişim Tarzı
- ✅ Formality analizi (formal, casual, mixed)
- ✅ Length analizi (short, medium, long)
- ✅ Tone analizi (professional, friendly, direct)
- ✅ Yaygın ifadeler çıkarma

### Öncelikler
- ✅ Yüksek öncelikli görev pattern'leri
- ✅ Orta öncelikli görev pattern'leri
- ✅ Düşük öncelikli görev pattern'leri

### Zaman Tercihleri
- ✅ Tercih edilen saatler
- ✅ Tercih edilen günler
- ✅ Ortalama toplantı süresi

---

## 🚀 Kullanım

### Karar Kaydetme

```bash
curl -X POST http://localhost:3001/api/ai/learn \
  -H "Content-Type: application/json" \
  -d '{
    "action": "record-decision",
    "data": {
      "context": {
        "type": "pricing",
        "data": { "discount": 15, "margin": 35 }
      },
      "decision": "accept-10-discount",
      "outcome": "success"
    }
  }'
```

### İletişim Tarzı Öğrenme

```bash
curl -X POST http://localhost:3001/api/ai/learn \
  -H "Content-Type: application/json" \
  -d '{
    "action": "learn-communication",
    "data": {
      "email": {
        "subject": "Proje Durumu",
        "body": "Sayın müşteri, proje durumu hakkında bilgi vermek istiyorum..."
      }
    }
  }'
```

### Karar Verme

```bash
curl -X POST http://localhost:3001/api/ai/decide \
  -H "Content-Type: application/json" \
  -d '{
    "action": "make-decision",
    "context": {
      "type": "pricing",
      "data": { "discount": 15, "margin": 35 }
    }
  }'
```

### Pattern'leri Getirme

```bash
curl http://localhost:3001/api/ai/learn/patterns?contextType=pricing
```

---

## 💡 Özellikler

### Sürekli Öğrenme
- Her karar pattern'i günceller
- Confidence skorları dinamik olarak güncellenir
- Başarılı kararlar pattern'i güçlendirir

### Akıllı Öneriler
- Geçmiş verilere dayalı öneriler
- Confidence skorları ile güvenilirlik
- Reasoning ile açıklama

### Esnek Sistem
- Kural tabanlı karar verme
- Context tipine göre özelleştirme
- Kolay genişletilebilir yapı

---

## 🎯 Sonraki Adımlar

### Pattern Recognition & Anomaly Detection
- [ ] Anomaly detection servisi
- [ ] Pattern recognition iyileştirmeleri
- [ ] Predictive analytics

### Dashboard & UI
- [ ] Learning dashboard
- [ ] Pattern görselleştirme
- [ ] Decision history

### Database Integration
- [ ] Pattern'leri database'e kaydetme
- [ ] Geçmiş kararları saklama
- [ ] Analytics ve raporlama

---

**Son Güncelleme:** 2025-11-12  
**Durum:** ✅ Learning System tamamlandı, Decision Making hazır!

