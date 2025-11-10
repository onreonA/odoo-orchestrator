# Sprint 2 - Test Planı (Küçük Gruplar Halinde)

**Tarih:** 2025-11-12  
**Durum:** 📋 Planlama Aşaması

---

## 📋 Test Grupları

Testleri **4 ana grup** halinde planladım. Her grup bağımsız çalışabilir ve küçük adımlarla ilerleyebilir.

---

## 🎯 Grup 1: Calendar Sync Tests

### Hedef
Calendar Sync Service ve Google Calendar entegrasyonunu test etmek.

### Test Dosyaları

#### Unit Tests
1. **`test/lib/services/calendar-sync-service.test.ts`** (YENİ)
   - `getSyncs()` - Sync listesi getirme
   - `getSyncById()` - Tek sync getirme
   - `createSync()` - Yeni sync oluşturma
   - `updateSync()` - Sync güncelleme
   - `deleteSync()` - Sync silme
   - `syncEventsFromExternal()` - Dış takvimden senkronizasyon
   - `syncEventsToExternal()` - Dış takvime senkronizasyon

2. **`test/lib/integrations/google-calendar.test.ts`** (YENİ)
   - OAuth token yönetimi
   - Event CRUD operations
   - Calendar listesi getirme

#### E2E Tests
3. **`e2e/calendar-sync.spec.ts`** (YENİ)
   - Sync sayfasına navigasyon
   - Yeni sync oluşturma formu
   - Google Calendar OAuth flow (mock)
   - Sync listesi görüntüleme
   - Sync durumu kontrolü

### Tahmini Süre
- Unit Tests: 2-3 saat
- E2E Tests: 1-2 saat
- **Toplam: 3-5 saat**

### Bağımlılıklar
- Google Calendar API mock'ları
- OAuth flow mock'ları

---

## 🎯 Grup 2: Email Service Tests

### Hedef
Email Service ve AI Email Handler'ı test etmek.

### Test Dosyaları

#### Unit Tests
1. **`test/lib/ai/agents/email-handler-agent.test.ts`** (YENİ)
   - `categorizeEmail()` - Email kategorizasyonu
   - `generateResponse()` - Otomatik cevap üretme
   - `detectUrgency()` - Aciliyet tespiti
   - `batchProcessEmails()` - Toplu email işleme

2. **`test/api/emails/accounts/route.test.ts`** (YENİ)
   - Email account listesi GET
   - Email account oluşturma POST
   - Email account güncelleme PUT
   - Email account silme DELETE

3. **`test/api/emails/route.test.ts`** (YENİ)
   - Email listesi GET (filtreleme ile)
   - Email oluşturma POST
   - Email güncelleme PUT
   - Email silme DELETE

#### E2E Tests
4. **`e2e/email-accounts.spec.ts`** (YENİ)
   - Email accounts sayfasına navigasyon
   - Yeni email account ekleme
   - Email account ayarları
   - Email account silme

5. **`e2e/emails-compose.spec.ts`** (YENİ - mevcut emails.spec.ts'e eklenebilir)
   - Email compose sayfası
   - Email gönderme
   - Draft kaydetme

### Tahmini Süre
- Unit Tests: 3-4 saat
- E2E Tests: 2-3 saat
- **Toplam: 5-7 saat**

### Bağımlılıklar
- OpenAI API mock'ları
- Email provider mock'ları

---

## 🎯 Grup 3: Messaging Tests (Attachments + AI Chat)

### Hedef
File attachments ve AI chat entegrasyonunu test etmek.

### Test Dosyaları

#### Unit Tests
1. **`test/api/messages/threads/route.test.ts`** (YENİ)
   - Thread listesi GET
   - Thread oluşturma POST
   - Thread güncelleme PUT

2. **`test/api/messages/threads/[id]/messages/route.test.ts`** (YENİ)
   - Mesaj listesi GET
   - Mesaj gönderme POST (text)
   - Mesaj gönderme POST (with attachments)
   - AI mesaj gönderme POST (@AI command)

3. **`test/api/messages/upload/route.test.ts`** (MEVCUT - genişletilebilir)
   - Dosya yükleme
   - Dosya boyutu kontrolü
   - Dosya tipi kontrolü
   - RLS policy kontrolü

4. **`test/api/messages/ai/route.test.ts`** (MEVCUT - genişletilebilir)
   - @AI komut algılama
   - AI cevap üretme
   - Thread context'i
   - Hata yönetimi

#### E2E Tests
5. **`e2e/messages-attachments.spec.ts`** (YENİ)
   - Dosya seçme
   - Dosya yükleme
   - Dosya önizleme
   - Dosya silme (yüklenmeden önce)
   - Attachment görüntüleme (mesajlarda)
   - Dosya indirme

6. **`e2e/messages-ai-chat.spec.ts`** (YENİ)
   - @AI komut algılama
   - AI modu göstergesi
   - AI cevap üretme
   - AI mesaj görüntüleme
   - Thread context'i
   - Real-time AI mesaj güncellemesi

### Tahmini Süre
- Unit Tests: 3-4 saat
- E2E Tests: 3-4 saat
- **Toplam: 6-8 saat**

### Bağımlılıklar
- Supabase Storage mock'ları
- OpenAI API mock'ları
- File upload mock'ları

---

## 🎯 Grup 4: Notifications Tests

### Hedef
Notification sistemini test etmek.

### Test Dosyaları

#### Unit Tests
1. **`test/lib/services/notifications-service.test.ts`** (YENİ - eğer ayrı service varsa)
   - Notification oluşturma
   - Notification listesi getirme
   - Notification okundu işaretleme
   - Tümünü okundu işaretleme

2. **`test/api/notifications/route.test.ts`** (YENİ)
   - Notification listesi GET
   - Tümünü okundu işaretleme POST

3. **`test/api/notifications/[id]/read/route.test.ts`** (YENİ)
   - Tek notification okundu işaretleme POST

#### E2E Tests
4. **`e2e/notifications.spec.ts`** (YENİ)
   - Notifications sayfasına navigasyon
   - Notification listesi görüntüleme
   - Notification okundu işaretleme
   - Tümünü okundu işaretleme
   - Notification bell (header'da)
   - Real-time notification güncellemesi

### Tahmini Süre
- Unit Tests: 2-3 saat
- E2E Tests: 2-3 saat
- **Toplam: 4-6 saat**

### Bağımlılıklar
- Supabase Realtime mock'ları

---

## 📊 Toplam Süre Tahmini

| Grup | Unit Tests | E2E Tests | Toplam |
|------|------------|-----------|--------|
| Grup 1: Calendar Sync | 2-3 saat | 1-2 saat | 3-5 saat |
| Grup 2: Email Service | 3-4 saat | 2-3 saat | 5-7 saat |
| Grup 3: Messaging | 3-4 saat | 3-4 saat | 6-8 saat |
| Grup 4: Notifications | 2-3 saat | 2-3 saat | 4-6 saat |
| **TOPLAM** | **10-14 saat** | **8-12 saat** | **18-26 saat** |

---

## 🚀 İlerleme Stratejisi

### Önerilen Sıralama
1. **Grup 1** (Calendar Sync) - En basit, bağımsız
2. **Grup 4** (Notifications) - Kısa ve net
3. **Grup 2** (Email Service) - Orta karmaşıklık
4. **Grup 3** (Messaging) - En karmaşık (attachments + AI)

### Her Grup İçin Adımlar
1. ✅ Unit test dosyalarını oluştur
2. ✅ Mock'ları hazırla
3. ✅ Test senaryolarını yaz
4. ✅ Testleri çalıştır ve düzelt
5. ✅ E2E test dosyalarını oluştur
6. ✅ E2E test senaryolarını yaz
7. ✅ E2E testleri çalıştır ve düzelt
8. ✅ Grup tamamlandı işaretle

---

## 📝 Test Standartları

### Unit Test Formatı
```typescript
describe('ServiceName', () => {
  describe('methodName', () => {
    it('should do something when condition', async () => {
      // Arrange
      // Act
      // Assert
    })
  })
})
```

### E2E Test Formatı
```typescript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)
  })

  test('should do something', async ({ page }) => {
    // Test steps
  })
})
```

### Mock Standartları
- Supabase client mock'ları: `test/utils/mock-factories.ts`
- API mock'ları: Her test dosyasında
- External service mock'ları: `vi.mock()` ile

---

## ✅ Kontrol Listesi

### Grup 1: Calendar Sync
- [ ] `test/lib/services/calendar-sync-service.test.ts`
- [ ] `test/lib/integrations/google-calendar.test.ts`
- [ ] `e2e/calendar-sync.spec.ts`

### Grup 2: Email Service
- [ ] `test/lib/ai/agents/email-handler-agent.test.ts`
- [ ] `test/api/emails/accounts/route.test.ts`
- [ ] `test/api/emails/route.test.ts`
- [ ] `e2e/email-accounts.spec.ts`
- [ ] `e2e/emails-compose.spec.ts`

### Grup 3: Messaging
- [ ] `test/api/messages/threads/route.test.ts`
- [ ] `test/api/messages/threads/[id]/messages/route.test.ts`
- [ ] `test/api/messages/upload/route.test.ts` (genişlet)
- [ ] `test/api/messages/ai/route.test.ts` (genişlet)
- [ ] `e2e/messages-attachments.spec.ts`
- [ ] `e2e/messages-ai-chat.spec.ts`

### Grup 4: Notifications
- [ ] `test/api/notifications/route.test.ts`
- [ ] `test/api/notifications/[id]/read/route.test.ts`
- [ ] `e2e/notifications.spec.ts`

---

## 🎯 Sonraki Adım

**Grup 1 ile başlayalım mı?** (Calendar Sync Tests)

Bu grup:
- ✅ En basit ve bağımsız
- ✅ Hızlı tamamlanabilir (3-5 saat)
- ✅ Diğer gruplara örnek olur

---

**Hazırlayan:** AI Assistant  
**Tarih:** 2025-11-12  
**Versiyon:** 1.0

