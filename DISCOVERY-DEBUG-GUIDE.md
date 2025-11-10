# 🔍 Discovery Debug Rehberi

## Sorun Giderme

### Console Logları

Discovery işlemi sırasında detaylı loglar console'a yazılır:

#### **Frontend (Browser Console)**
- `[Discovery UI] Starting upload...` - Dosya yükleme başladı
- `[Discovery UI] Response status:` - API response durumu
- `[Discovery UI] Response data:` - API'den dönen veri
- `[Discovery UI] Error:` - Hata mesajları

#### **Backend (Server Console)**
- `[Discovery API] Request started` - API isteği başladı
- `[Discovery API] File info:` - Dosya bilgileri
- `[Discovery API] Starting Discovery Agent...` - Agent başlatıldı
- `[Discovery Agent] Step 1/4: Transcribing audio...` - Adım 1: Transkript
- `[Discovery Agent] Step 2/4: Extracting information...` - Adım 2: Bilgi çıkarma
- `[Discovery Agent] Step 3/4: Mapping processes...` - Adım 3: Modül önerileri
- `[Discovery Agent] Step 4/4: Generating report...` - Adım 4: Rapor
- `[Whisper] Starting transcription:` - Whisper API çağrısı
- `[Discovery API] Success! Duration: Xms` - Başarılı tamamlanma

### Yaygın Sorunlar

#### 1. **Uzun Süre Bekleme Sonrası Discoveries Sayfasına Dönme**

**Olası Nedenler:**
- Whisper API timeout (çok uzun ses dosyası)
- OpenAI API rate limit
- Network timeout
- Database kayıt hatası

**Kontrol:**
1. Server console'da hangi adımda takıldığını kontrol edin
2. `[Whisper] Transcription error:` logunu kontrol edin
3. Network tab'da API response'u kontrol edin

**Çözüm:**
- Dosya boyutunu kontrol edin (max 100MB)
- Ses dosyası süresini kontrol edin (çok uzun dosyalar timeout verebilir)
- OpenAI API key'inin geçerli olduğundan emin olun

#### 2. **404 Hatası**

**Olası Nedenler:**
- Discovery ID dönmüyor
- Database kayıt başarısız

**Kontrol:**
- `[Discovery UI] Response data:` logunda `hasId: false` kontrol edin
- `[Discovery API] Database error:` logunu kontrol edin

**Çözüm:**
- Database bağlantısını kontrol edin
- RLS policies'i kontrol edin

#### 3. **m4a Dosyası Desteklenmiyor**

**Olası Nedenler:**
- MIME type yanlış
- Dosya encoding sorunu

**Kontrol:**
- `[Discovery API] File info:` logunda `fileType` kontrol edin
- `[Whisper] Starting transcription:` logunda `fileType` kontrol edin

**Çözüm:**
- Dosya `.m4a` uzantılı olmalı
- MIME type `audio/mp4` veya `audio/x-m4a` olmalı
- Sistem otomatik olarak düzeltir, ama logları kontrol edin

### Test Senaryoları

#### Başarılı Senaryo
```
[Discovery UI] Starting upload...
[Discovery API] Request started
[Discovery API] File info: { fileName: 'test.m4a', fileSize: 12345, ... }
[Discovery Agent] Step 1/4: Transcribing audio...
[Whisper] Starting transcription: { fileName: 'test.m4a', ... }
[Whisper] Transcription completed: { textLength: 500 }
[Discovery Agent] Step 2/4: Extracting information...
[Discovery Agent] Step 3/4: Mapping processes...
[Discovery Agent] Step 4/4: Generating report...
[Discovery API] Success! Duration: 15000ms, Discovery ID: xxx
[Discovery UI] Redirecting to discovery: xxx
```

#### Hata Senaryosu
```
[Discovery UI] Starting upload...
[Discovery API] Request started
[Discovery Agent] Step 1/4: Transcribing audio...
[Whisper] Transcription error: { message: '...', status: 400 }
[Discovery API] Error after 5000ms: { message: '...' }
[Discovery UI] Error: Whisper transcription failed: ...
```

### Debug Checklist

- [ ] Browser console'da loglar görünüyor mu?
- [ ] Server console'da loglar görünüyor mu?
- [ ] Hangi adımda takılıyor?
- [ ] API response status nedir?
- [ ] Discovery ID dönüyor mu?
- [ ] Database kayıt başarılı mı?
- [ ] Dosya formatı destekleniyor mu?
- [ ] Dosya boyutu uygun mu?

### İletişim

Sorun devam ederse, şu bilgileri paylaşın:
1. Browser console logları
2. Server console logları
3. Network tab'dan API response
4. Dosya bilgileri (format, boyut, süre)




