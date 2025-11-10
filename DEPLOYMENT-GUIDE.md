# 🚀 Production Deployment Guide

## 📋 Pre-Deployment Checklist

Deployment öncesi `PRODUCTION-CHECKLIST.md` dosyasındaki tüm maddeleri kontrol edin.

## 🎯 Deployment Options

### Option 1: Vercel (Önerilen - En Kolay)

Vercel Next.js için optimize edilmiş ve kolay deployment sağlar.

#### Adımlar:

1. **Vercel hesabı oluştur:**
   - [Vercel](https://vercel.com) hesabı oluştur
   - GitHub hesabını bağla

2. **Projeyi Vercel'e bağla:**
   ```bash
   npm i -g vercel
   vercel login
   vercel
   ```
   
   Veya GitHub üzerinden:
   - Vercel Dashboard > Add New Project
   - GitHub repo'yu seç
   - Import Project

3. **Environment Variables ekle:**
   - Vercel Dashboard > Project > Settings > Environment Variables
   - `.env.example` dosyasındaki tüm değişkenleri ekle
   - **ÖNEMLİ:** Production, Preview, Development için ayrı ayrı ekle

4. **Build Settings:**
   - Framework Preset: Next.js (otomatik algılanır)
   - Build Command: `npm run build` (varsayılan)
   - Output Directory: `.next` (varsayılan)
   - Install Command: `npm install` (varsayılan)

5. **Deploy:**
   ```bash
   vercel --prod
   ```
   
   Veya GitHub'a push yapınca otomatik deploy olur.

6. **Custom Domain (Opsiyonel):**
   - Vercel Dashboard > Project > Settings > Domains
   - Custom domain ekle
   - DNS ayarlarını yap

#### Vercel Avantajları:
- ✅ Otomatik HTTPS
- ✅ CDN dahil
- ✅ Analytics dahil
- ✅ Preview deployments
- ✅ Rollback kolay
- ✅ Environment variables yönetimi kolay

---

### Option 2: Docker + Self-Hosted

Kendi sunucunuzda çalıştırmak için.

#### Dockerfile:

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

**Not:** `next.config.ts`'e `output: 'standalone'` eklemeniz gerekebilir.

#### Docker Compose:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - GOOGLE_REDIRECT_URI=${GOOGLE_REDIRECT_URI}
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

#### Deploy:

```bash
docker-compose up -d --build
```

---

### Option 3: Traditional Server (PM2)

Geleneksel sunucuda çalıştırmak için.

#### Setup:

```bash
# Sunucuya bağlan
ssh user@your-server.com

# Node.js ve PM2 kurulumu
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# Projeyi klonla
git clone https://github.com/your-username/odoo-orchestrator.git
cd odoo-orchestrator

# Dependencies yükle
npm install

# Environment variables ayarla
cp .env.example .env.local
nano .env.local  # Düzenle

# Build
npm run build

# PM2 ile başlat
pm2 start npm --name "odoo-orchestrator" -- start
pm2 save
pm2 startup  # Sunucu restart'ta otomatik başlatma
```

#### Nginx Reverse Proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📋 Post-Deployment Checklist

### 1. Health Check

```bash
curl https://your-domain.com/api/health
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

### 2. Database Migration

Supabase Dashboard'dan migration'ları çalıştırın:

1. Supabase Dashboard > SQL Editor
2. Migration dosyalarını sırayla çalıştır:
   - `20251112000001_create_documents_table.sql`
   - `20251112000002_create_documents_bucket.sql`
   - `20251112000003_create_training_materials_table.sql`
   - `20251112000004_create_activity_logs_table.sql`
   - `20251112000005_create_modules_system.sql`
   - `20251112000006_create_api_system.sql`
   - `20251112000007_performance_optimization.sql`

Veya CLI ile:
```bash
npx supabase db push
```

### 3. Feature Verification

- [ ] Authentication çalışıyor (`/login`, `/register`)
- [ ] Dashboard yükleniyor (`/dashboard`)
- [ ] Database bağlantısı aktif (firma ekleme testi)
- [ ] API endpoints çalışıyor (`/api/health`)
- [ ] File uploads çalışıyor (doküman yükleme)
- [ ] Email gönderimi çalışıyor (eğer aktifse)
- [ ] Calendar sync çalışıyor (Google OAuth testi)

### 4. Security Check

- [ ] HTTPS aktif ve çalışıyor
- [ ] Security headers kontrol edildi (browser dev tools > Network > Headers)
- [ ] Environment variables güvenli (production'da görünmüyor)
- [ ] API rate limiting aktif
- [ ] CORS ayarları doğru

### 5. Performance Check

- [ ] Sayfa yükleme süreleri kabul edilebilir (<3s)
- [ ] API response time'ları iyi (<500ms)
- [ ] Database query'leri optimize
- [ ] Image optimization çalışıyor

---

## 🔄 Updates & Rollbacks

### Update Process:

```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Run migrations (if any)
npx supabase db push

# Build and deploy
npm run build
# (deploy based on your platform)
```

### Rollback:

**Vercel:**
```bash
vercel rollback
```

**Docker:**
```bash
docker-compose down
git checkout previous-version
docker-compose up -d --build
```

**PM2:**
```bash
pm2 restart odoo-orchestrator
# veya
git checkout previous-version
npm run build
pm2 restart odoo-orchestrator
```

---

## 🐛 Troubleshooting

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

### Database Connection Issues

- Supabase URL ve keys kontrol edin
- Network firewall ayarlarını kontrol edin
- Connection pooling ayarlarını kontrol edin
- Supabase Dashboard > Settings > Database > Connection Pooling

### Performance Issues

- Database indexes kontrol edin
- Query optimization yapın
- Caching stratejisini gözden geçirin
- CDN kullanıyorsanız cache ayarlarını kontrol edin

### Environment Variables Not Working

- Vercel: Settings > Environment Variables'da Production için ekli mi?
- Docker: `.env` dosyası doğru yerde mi?
- PM2: Environment variables PM2'ye aktarıldı mı?

---

## 📞 Support

Sorun yaşarsanız:
1. Logs'ları kontrol edin
2. Health check endpoint'ini kontrol edin
3. Error tracking dashboard'unu kontrol edin (Sentry)
4. Database query performance'ı kontrol edin
5. GitHub Issues'da sorun bildirin

---

## 🎯 Next Steps

Deployment sonrası:
1. ✅ Monitoring kurulumu (`docs/MONITORING.md`)
2. ✅ Uptime monitoring (UptimeRobot)
3. ✅ Error tracking (Sentry)
4. ✅ Performance monitoring
5. ✅ User feedback mekanizması

