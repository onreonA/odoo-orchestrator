# 🔍 Vercel Logs Kontrol Rehberi

## MIDDLEWARE_INVOCATION_FAILED Hatası Devam Ediyorsa

### 1. Vercel Logs Kontrolü

1. [Vercel Dashboard](https://vercel.com/dashboard) → Projenizi seçin
2. **Deployments** → Son deployment'ı seçin
3. **Logs** sekmesine tıklayın
4. Şu mesajları arayın:

```
Missing Supabase environment variables
Error creating Supabase client:
Error getting user:
Middleware error:
```

### 2. Environment Variables Doğrulama

Vercel Dashboard > Settings > Environment Variables:

**Kontrol Edin:**
- ✅ `NEXT_PUBLIC_SUPABASE_URL` mevcut mu?
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` mevcut mu?
- ✅ Değerler doğru mu? (başında/sonunda boşluk yok)
- ✅ Tüm environment'larda mevcut mu? (Production, Preview, Development)

**Değer Formatı:**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Supabase Projesi Kontrolü

1. [Supabase Dashboard](https://app.supabase.com) → Projenizi seçin
2. **Settings** → **API**
3. Şu değerleri kontrol edin:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` ile eşleşmeli
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY` ile eşleşmeli

### 4. Test Endpoint

Middleware düzeltildikten sonra, test endpoint'i oluşturuldu:

```
GET https://your-app.vercel.app/api/test-supabase
```

Bu endpoint Supabase bağlantısını test eder.

---

## 🔧 Yaygın Sorunlar ve Çözümleri

### Sorun 1: Environment Variables Yanlış

**Belirtiler:**
- `Missing Supabase environment variables` logs'da görünüyor
- Veya hiçbir log yok ama hata devam ediyor

**Çözüm:**
1. Vercel Dashboard > Settings > Environment Variables
2. Değerleri silin ve yeniden ekleyin
3. Supabase Dashboard'dan kopyalayın (başında/sonunda boşluk olmamalı)
4. Redeploy yapın

### Sorun 2: Supabase Bağlantı Hatası

**Belirtiler:**
- `Error creating Supabase client:` logs'da görünüyor
- `Timeout` hatası

**Çözüm:**
1. Supabase projenizin aktif olduğunu kontrol edin
2. Supabase Dashboard'da proje durumunu kontrol edin
3. Network sorunları olabilir (geçici)

### Sorun 3: Middleware Çok Yavaş

**Belirtiler:**
- `Timeout` hatası
- Sayfa yavaş yükleniyor

**Çözüm:**
- Middleware'e timeout koruması eklendi (5 saniye)
- Static dosyalar için middleware skip edildi
- Optimize edildi

---

## 📊 Logs Örnekleri

### Başarılı Middleware:
```
[Middleware] Request: /dashboard
[Middleware] User authenticated
[Middleware] Response: 200
```

### Hata Durumu:
```
[Middleware] Request: /dashboard
[Middleware] Error creating Supabase client: ...
[Middleware] Fallback: allowing request
[Middleware] Response: 200
```

---

## 🚀 Test Senaryoları

### Test 1: Environment Variables Kontrolü
```bash
# Vercel CLI ile
vercel env ls

# Veya Dashboard'dan
Settings > Environment Variables
```

### Test 2: Supabase Bağlantısı
```bash
# Browser'da
https://your-app.vercel.app/api/test-supabase

# Beklenen response:
{
  "success": true,
  "message": "✅ Supabase bağlantısı başarılı!",
  "url": "https://xxxxx.supabase.co"
}
```

### Test 3: Middleware Çalışıyor mu?
```bash
# Login sayfasına git
https://your-app.vercel.app/login

# Dashboard'a git (login olmadan)
https://your-app.vercel.app/dashboard

# Beklenen: /login'e redirect olmalı
```

---

## 📝 Notlar

- Middleware deprecation uyarısı bir sorun değil, görmezden gelebilirsiniz
- Environment variables değiştirildikten sonra mutlaka redeploy yapın
- Logs'ları kontrol ederek sorunun kaynağını bulabilirsiniz

---

## 🆘 Hala Sorun Varsa

1. **Vercel Logs'ları kontrol edin** (en önemlisi)
2. **Environment variables'ları doğrulayın**
3. **Supabase projesinin aktif olduğunu kontrol edin**
4. **Test endpoint'i çalıştırın** (`/api/test-supabase`)
5. **Vercel Support'a başvurun** (gerekirse)

