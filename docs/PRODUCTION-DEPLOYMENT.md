# Production Deployment Guide

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

Vercel Next.js için optimize edilmiş ve kolay deployment sağlar.

#### Steps:

1. **Vercel'e projeyi bağlayın:**
   ```bash
   npm i -g vercel
   vercel login
   vercel
   ```

2. **Environment Variables ekleyin:**
   - Vercel Dashboard > Project > Settings > Environment Variables
   - Tüm required environment variable'ları ekleyin (PRODUCTION-CHECKLIST.md'ye bakın)

3. **Build Settings:**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

4. **Deploy:**
   ```bash
   vercel --prod
   ```

### Option 2: Docker + Self-Hosted

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
    restart: unless-stopped
```

#### Deploy:

```bash
docker-compose up -d
```

### Option 3: Traditional Server (PM2)

#### Setup:

```bash
# Install PM2
npm install -g pm2

# Build the app
npm run build

# Start with PM2
pm2 start npm --name "odoo-orchestrator" -- start
pm2 save
pm2 startup
```

## 📋 Pre-Deployment Checklist

1. ✅ Environment variables ayarlandı
2. ✅ Database migration'ları çalıştırıldı
3. ✅ Build başarılı (`npm run build`)
4. ✅ Testler geçti (`npm run test:all`)
5. ✅ Security headers kontrol edildi
6. ✅ SEO ayarları yapıldı

## 🔧 Post-Deployment

### 1. Verify Deployment

```bash
# Check if app is running
curl https://your-domain.com/api/health

# Check build info
curl https://your-domain.com/api/version
```

### 2. Database Migration

Supabase Dashboard'dan migration'ları çalıştırın veya CLI kullanın:

```bash
npx supabase db push
```

### 3. Verify Features

- [ ] Authentication çalışıyor
- [ ] Database bağlantısı aktif
- [ ] API endpoints çalışıyor
- [ ] File uploads çalışıyor
- [ ] Email sending çalışıyor (eğer aktifse)
- [ ] Calendar sync çalışıyor

### 4. Monitoring Setup

- Error tracking (Sentry, LogRocket)
- Performance monitoring (Vercel Analytics, New Relic)
- Uptime monitoring (UptimeRobot, Pingdom)

## 🔄 Updates & Rollbacks

### Update Process:

```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Run migrations
npx supabase db push

# Build and deploy
npm run build
# (deploy based on your platform)
```

### Rollback:

```bash
# Vercel
vercel rollback

# Docker
docker-compose down
docker-compose up -d --build

# PM2
pm2 restart odoo-orchestrator
```

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

### Performance Issues

- Database indexes kontrol edin
- Query optimization yapın
- Caching stratejisini gözden geçirin

## 📞 Support

Sorun yaşarsanız:
1. Logs'ları kontrol edin
2. Error tracking dashboard'unu kontrol edin
3. Database query performance'ı kontrol edin
4. GitHub Issues'da sorun bildirin

