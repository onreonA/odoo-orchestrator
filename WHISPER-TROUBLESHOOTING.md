# 🎤 Whisper API Transkript Sorun Giderme

## Sorun
Ses kaydı ile ekrandaki transkript alakasız görünüyor. Örneğin: "Ses sinema, bu ses kaydına benzetmenizi istiyorum." gibi genel bir metin görünüyor.

## Olası Nedenler

### 1. **Müzik Dosyası Yüklenmiş**
- Whisper API müzik dosyalarını transkript edemez
- Sadece konuşma içeren ses kayıtları çalışır
- **Çözüm**: Gerçek bir toplantı ses kaydı yükleyin

### 2. **Ses Dosyası Çok Kısa veya Boş**
- Çok kısa ses dosyaları (1-2 saniye) düzgün işlenmeyebilir
- Boş veya sadece gürültü içeren dosyalar hatalı sonuç verebilir
- **Çözüm**: En az 10-15 saniyelik, net konuşma içeren dosya kullanın

### 3. **Dosya Formatı Sorunu**
- m4a dosyaları bazen düzgün decode edilemeyebilir
- **Çözüm**: Dosyayı mp3 veya wav formatına çevirip tekrar deneyin

### 4. **Whisper API Yanıtı Yanlış**
- API bazen yanlış transkript döndürebilir
- **Kontrol**: Server console'da `[Whisper] Transcription completed:` logunu kontrol edin

## Debug Adımları

### 1. Server Console Loglarını Kontrol Edin

Terminal'de şu logları arayın:

```
[Whisper] Starting transcription: { fileName: '...', fileSize: ..., fileType: '...' }
[Whisper] Transcription completed: { textLength: ..., preview: '...', fullText: '...' }
[Discovery Agent] Transcription completed: { length: ..., preview: '...', fullTranscript: '...' }
[Discovery API] Transcript validation: { length: ..., preview: '...', fullTranscript: '...' }
```

**Kontrol Edilecekler:**
- `fullText` veya `fullTranscript` alanında gerçek transkript var mı?
- Transkript ses kaydınızla uyumlu mu?
- Eğer uyumsuzsa, Whisper API yanlış sonuç döndürüyor demektir

### 2. Test Dosyası Oluşturun

Küçük bir test ses kaydı hazırlayın:
- 10-15 saniye
- Net Türkçe konuşma
- Müzik veya gürültü yok
- Örnek: "Merhaba, ben Ömer. Bugün Odoo ERP sistemi hakkında konuşacağız."

### 3. Whisper Debug Script'i Çalıştırın

```bash
# Test dosyanızı hazırlayın
npx tsx test/whisper-debug.ts test-audio.m4a
```

Bu script:
- Dosyayı Whisper API'ye gönderir
- Dönen transkripti gösterir
- Sorunları tespit eder

## Çözümler

### Çözüm 1: Doğru Dosya Formatı Kullanın
- ✅ mp3 (önerilen)
- ✅ wav
- ✅ m4a (Mac sesli notları - bazen sorunlu olabilir)
- ❌ Müzik dosyaları
- ❌ Çok kısa dosyalar (< 5 saniye)

### Çözüm 2: Dosya Boyutunu Kontrol Edin
- Minimum: 10 KB
- Maksimum: 100 MB
- Önerilen: 1-10 MB

### Çözüm 3: Ses Kalitesini Kontrol Edin
- Net konuşma olmalı
- Arka plan gürültüsü minimum olmalı
- Konuşmacılar net duyulmalı

### Çözüm 4: Language Parameter'ı Kontrol Edin
- Türkçe için: `language: 'tr'`
- İngilizce için: `language: 'en'`
- Otomatik tespit için: `language` parametresini kaldırın

## Test Senaryosu

1. **Küçük bir test dosyası hazırlayın:**
   - iPhone/iPad'de Sesli Notlar uygulamasını açın
   - 10 saniye konuşun: "Merhaba, bu bir test kaydıdır. Odoo ERP sistemi hakkında konuşuyoruz."
   - Kaydı durdurun ve paylaşın

2. **Dosyayı yükleyin ve logları kontrol edin:**
   - Browser console: `[Discovery UI] Response data:`
   - Server console: `[Whisper] Transcription completed:`
   - Server console: `[Discovery API] Transcript validation:`

3. **Transkripti kontrol edin:**
   - Ekranda görünen metin, söylediğiniz metinle uyumlu mu?
   - Eğer uyumsuzsa, server console'daki `fullTranscript` değerini kontrol edin

## Hala Sorun Varsa

1. Server console loglarını paylaşın (özellikle `[Whisper]` ve `[Discovery API]` logları)
2. Kullandığınız ses dosyasının:
   - Formatı
   - Boyutu
   - Süresi
   - İçeriği (müzik mi, konuşma mı?)
3. Browser console'daki `[Discovery UI] Response data:` logunu paylaşın



