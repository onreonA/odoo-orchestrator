# 🚀 Production Deployment - Hızlı Başlangıç

## ⚡ En Hızlı Yol (Vercel - Önerilen)

### Adım 1: Pre-Deployment Kontrolü

```bash
./scripts/pre-deployment-check.sh
```

Bu script şunları kontrol eder:
- ✅ Environment variables
- ✅ Build başarılı mı
- ✅ Type check
- ✅ Migration dosyaları
- ✅ Health check endpoint

### Adım 2: Vercel'e Deploy

**Seçenek A: Otomatik Script**
```bash
./scripts/vercel-deploy.sh
```

**Seçenek B: Manuel**
```bash
# Vercel CLI kurulumu (ilk kez)
npm install -g vercel

# Giriş yap
vercel login

# Deploy
vercel --prod
```

### Adım 3: Environment Variables Ayarla

1. Vercel Dashboard > Project > Settings > Environment Variables
2. Şu değişkenleri ekle:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   OPENAI_API_KEY=your-openai-api-key
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_REDIRECT_URI=https://your-domain.vercel.app/api/calendar/syncs/google/oauth/callback
   ```

### Adım 4: Database Migration'ları Çalıştır

1. Supabase Dashboard > SQL Editor
2. Migration dosyalarını sırayla çalıştır:
   - `supabase/migrations/20251112000001_create_documents_table.sql`
   - `supabase/migrations/20251112000002_create_documents_bucket.sql`
   - `supabase/migrations/20251112000003_create_training_materials_table.sql`
   - `supabase/migrations/20251112000004_create_activity_logs_table.sql`
   - `supabase/migrations/20251112000005_create_modules_system.sql`
   - `supabase/migrations/20251112000006_create_api_system.sql`
   - `supabase/migrations/20251112000007_performance_optimization.sql`

### Adım 5: Health Check Testi

```bash
curl https://your-domain.vercel.app/api/health
```

Beklenen response:
```json
{
  "status": "healthy",
  "database": "connected",
  "responseTime": 50,
  "timestamp": "2024-11-12T10:00:00.000Z",
  "version": "0.1.0",
  "environment": "production"
}
```

---

## 🐳 Docker ile Deploy (Alternatif)

### Adım 1: Dockerfile Oluştur

`Dockerfile` dosyası zaten hazır (DEPLOYMENT-GUIDE.md'de var).

### Adım 2: Build ve Run

```bash
docker build -t odoo-orchestrator .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=... \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  -e SUPABASE_SERVICE_ROLE_KEY=... \
  -e NEXT_PUBLIC_APP_URL=http://localhost:3000 \
  odoo-orchestrator
```

---

## 📋 Deployment Checklist

- [ ] Pre-deployment check çalıştırıldı (`./scripts/pre-deployment-check.sh`)
- [ ] Environment variables ayarlandı
- [ ] Build başarılı (`npm run build`)
- [ ] Deploy edildi (Vercel/Docker/PM2)
- [ ] Health check test edildi (`/api/health`)
- [ ] Database migration'ları çalıştırıldı
- [ ] İlk login test edildi
- [ ] Temel akışlar test edildi (firma ekleme, vb.)

---

## 🆘 Sorun Giderme

### Build Hatası
```bash
rm -rf .next
npm run build
```

### Environment Variables Çalışmıyor
- Vercel: Settings > Environment Variables'da Production için ekli mi?
- Docker: `-e` flag'leri doğru mu?
- PM2: `.env.local` dosyası doğru yerde mi?

### Database Bağlantı Hatası
- Supabase URL ve keys doğru mu?
- Network firewall ayarları kontrol edildi mi?
- Connection pooling aktif mi?

---

## 📞 Yardım

Detaylı rehber: `DEPLOYMENT-GUIDE.md`

