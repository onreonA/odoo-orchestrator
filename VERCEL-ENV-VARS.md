# 🔧 Vercel Environment Variables

## ⚠️ Önemli: Middleware Hatası Düzeltildi

Middleware'deki hata düzeltildi ve push edildi. Şimdi Vercel'de environment variables'ları kontrol etmeniz gerekiyor.

---

## 📋 Gerekli Environment Variables

Vercel Dashboard > Project Settings > Environment Variables bölümüne şu değişkenleri ekleyin:

### 🔴 Zorunlu (Middleware için)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 🟡 Önerilen (Uygulama için)

```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
```

---

## 🔍 Environment Variables Kontrolü

### 1. Vercel Dashboard'da Kontrol

1. [Vercel Dashboard](https://vercel.com/dashboard) → Projenizi seçin
2. **Settings** → **Environment Variables**
3. Şu değişkenlerin olduğundan emin olun:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Deploy Sonrası Kontrol

Deploy sonrası Vercel logs'ları kontrol edin:

```bash
# Vercel CLI ile
vercel logs

# Veya Dashboard'dan
# Deployments > Son deployment > Logs
```

Eğer hala hata varsa, logs'da şu mesajları arayın:
- `Missing Supabase environment variables`
- `Error getting user:`
- `Middleware error:`

---

## 🚀 Hızlı Çözüm

### Adım 1: Environment Variables Ekle

Vercel Dashboard > Settings > Environment Variables:

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Value: Supabase projenizin URL'i
   - Environment: Production, Preview, Development (hepsini seçin)

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Value: Supabase anon key'iniz
   - Environment: Production, Preview, Development (hepsini seçin)

### Adım 2: Redeploy

1. Vercel Dashboard > Deployments
2. Son deployment'ın yanındaki **"..."** menüsünden **"Redeploy"** seçin
3. Veya yeni bir commit push edin (otomatik deploy)

---

## ✅ Kontrol Listesi

- [ ] `NEXT_PUBLIC_SUPABASE_URL` eklendi
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` eklendi
- [ ] Environment variables tüm environment'larda mevcut (Production, Preview, Development)
- [ ] Redeploy yapıldı
- [ ] Logs kontrol edildi
- [ ] Sayfa açılıyor mu kontrol edildi

---

## 🆘 Sorun Giderme

### Hata: `MIDDLEWARE_INVOCATION_FAILED`

**Çözüm:**
1. Environment variables'ları kontrol edin
2. Redeploy yapın
3. Logs'u kontrol edin

### Hata: `Missing Supabase environment variables`

**Çözüm:**
- Vercel Dashboard'da environment variables'ları ekleyin
- Tüm environment'larda (Production, Preview, Development) olduğundan emin olun

### Hata: `Error getting user`

**Çözüm:**
- Supabase URL ve key'lerin doğru olduğundan emin olun
- Supabase projenizin aktif olduğunu kontrol edin

---

## 📝 Notlar

- Environment variables değiştirildikten sonra **mutlaka redeploy** yapın
- Production ve Preview environment'ları için ayrı ayrı ekleyin
- `.env.local` dosyasındaki değerleri Vercel'e kopyalayın

