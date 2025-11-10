# 🔧 Vercel Troubleshooting Guide

## ⚠️ MIDDLEWARE_INVOCATION_FAILED Hatası

### Sorun

Vercel'de deploy sonrası `500: INTERNAL_SERVER_ERROR` ve `MIDDLEWARE_INVOCATION_FAILED` hatası alıyorsunuz.

### Çözüm Adımları

#### 1. Environment Variables Kontrolü (EN ÖNEMLİSİ)

Vercel Dashboard > Project Settings > Environment Variables:

**Zorunlu Değişkenler:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Önemli:** 
- Her iki environment variable'ı da ekleyin
- Production, Preview ve Development için ayrı ayrı ekleyin
- Değerlerin doğru olduğundan emin olun (başında/sonunda boşluk olmamalı)

#### 2. Environment Variables Ekleme

1. [Vercel Dashboard](https://vercel.com/dashboard) → Projenizi seçin
2. **Settings** → **Environment Variables**
3. **Add New** butonuna tıklayın
4. Her değişken için:
   - **Key:** `NEXT_PUBLIC_SUPABASE_URL` (veya `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **Value:** Değerinizi yapıştırın
   - **Environment:** Production, Preview, Development (hepsini seçin)
5. **Save** butonuna tıklayın

#### 3. Redeploy

Environment variables ekledikten sonra **mutlaka redeploy yapın:**

1. Vercel Dashboard > **Deployments**
2. Son deployment'ın yanındaki **"..."** menüsünden **"Redeploy"** seçin
3. Veya yeni bir commit push edin (otomatik deploy)

---

## ⚠️ Middleware Deprecation Uyarısı

### Uyarı Mesajı

```
⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
```

### Açıklama

Bu bir **uyarı**, hata değil. Next.js'in gelecek versiyonları için bir deprecation uyarısı. Şu anda `middleware.ts` hala çalışıyor.

### Çözüm

Middleware'e `export const runtime = 'edge'` eklendi. Bu uyarıyı azaltır ama tamamen kaldırmaz.

**Not:** Next.js 16'da middleware.ts hala geçerli ve çalışıyor. Bu uyarıyı görmezden gelebilirsiniz.

---

## 🔍 Hata Ayıklama

### 1. Vercel Logs Kontrolü

1. Vercel Dashboard > **Deployments**
2. Son deployment'ı seçin
3. **Logs** sekmesine tıklayın
4. Şu mesajları arayın:
   - `Missing Supabase environment variables`
   - `Error getting user:`
   - `Middleware error:`

### 2. Environment Variables Doğrulama

Vercel CLI ile kontrol edin:

```bash
# Vercel CLI yüklü değilse
npm i -g vercel

# Environment variables'ları listele
vercel env ls
```

### 3. Local Test

Local'de test edin:

```bash
# .env.local dosyasını kontrol edin
cat .env.local

# Development server'ı çalıştırın
npm run dev

# Tarayıcıda http://localhost:3001 açın
# Hata varsa console'da görünecektir
```

---

## ✅ Kontrol Listesi

- [ ] `NEXT_PUBLIC_SUPABASE_URL` Vercel'de mevcut
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` Vercel'de mevcut
- [ ] Her iki değişken de Production, Preview, Development için ekli
- [ ] Değerler doğru (Supabase Dashboard'dan kopyalandı)
- [ ] Redeploy yapıldı
- [ ] Logs kontrol edildi
- [ ] Sayfa açılıyor mu test edildi

---

## 🆘 Yaygın Sorunlar

### Sorun: Environment Variables ekledim ama hala hata alıyorum

**Çözüm:**
1. Redeploy yaptığınızdan emin olun (environment variables değişiklikleri otomatik deploy tetiklemez)
2. Değerlerin doğru olduğunu kontrol edin (başında/sonunda boşluk yok)
3. Tüm environment'larda (Production, Preview, Development) ekli olduğundan emin olun

### Sorun: Local'de çalışıyor ama Vercel'de çalışmıyor

**Çözüm:**
1. `.env.local` dosyasındaki değerleri Vercel'e kopyalayın
2. Vercel'de environment variables'ların doğru olduğunu kontrol edin
3. Redeploy yapın

### Sorun: Middleware uyarısı görüyorum

**Çözüm:**
- Bu bir uyarı, hata değil
- Middleware çalışıyor
- Gelecek Next.js versiyonlarında proxy kullanılacak
- Şimdilik görmezden gelebilirsiniz

---

## 📞 Destek

Sorun devam ederse:

1. Vercel logs'larını kontrol edin
2. GitHub Issues'da benzer sorunları arayın
3. Vercel Support'a başvurun

---

## 📚 İlgili Dokümantasyon

- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Supabase Environment Variables](https://supabase.com/docs/guides/getting-started/local-development#environment-variables)

