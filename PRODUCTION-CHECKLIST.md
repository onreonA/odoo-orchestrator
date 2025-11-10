# Production Deployment Checklist

## 🔐 Environment Variables

Aşağıdaki environment variable'ların production'da ayarlandığından emin olun:

### Required Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# OpenAI (for AI features)
OPENAI_API_KEY=your-openai-api-key

# Google OAuth (for Calendar Sync)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/calendar/syncs/google/oauth/callback

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

## 🗄️ Database

- [ ] Supabase migration'ları production database'de çalıştırıldı
- [ ] RLS policies aktif ve test edildi
- [ ] Database backup stratejisi kuruldu
- [ ] Connection pooling ayarlandı
- [ ] Index'ler optimize edildi (migration 20251112000007)

## 🔒 Security

- [ ] HTTPS aktif
- [ ] Security headers kontrol edildi (`next.config.ts`)
- [ ] API rate limiting aktif
- [ ] CORS ayarları kontrol edildi
- [ ] Environment variables güvenli şekilde saklanıyor
- [ ] Supabase RLS policies test edildi
- [ ] API keys güvenli şekilde hash'leniyor

## 🚀 Performance

- [ ] Next.js build başarılı (`npm run build`)
- [ ] Image optimization aktif
- [ ] Compression aktif
- [ ] Database indexes optimize edildi
- [ ] Caching stratejisi kuruldu
- [ ] CDN ayarları yapıldı (eğer kullanılıyorsa)

## 📊 Monitoring & Logging

- [ ] Error tracking kuruldu (Sentry, LogRocket, vb.)
- [ ] Performance monitoring aktif
- [ ] Database query monitoring aktif
- [ ] Uptime monitoring kuruldu

## 🧪 Testing

- [ ] Unit testler geçti (`npm run test`)
- [ ] E2E testler geçti (`npm run test:e2e`)
- [ ] Type checking geçti (`npm run type-check`)
- [ ] Production build test edildi (`npm run build && npm start`)

## 📱 Mobile & Accessibility

- [ ] Responsive design test edildi
- [ ] Mobile browser testleri yapıldı
- [ ] Accessibility (WCAG) kontrol edildi
- [ ] Touch interactions test edildi

## 🔍 SEO

- [ ] Metadata ayarlandı (`app/layout.tsx`)
- [ ] Sitemap oluşturuldu (`app/sitemap.ts`)
- [ ] Robots.txt ayarlandı (`app/robots.ts`)
- [ ] Open Graph tags test edildi
- [ ] Twitter Card tags test edildi
- [ ] Google Search Console bağlandı (opsiyonel)

## 📚 Documentation

- [ ] API documentation güncel
- [ ] User guide hazır
- [ ] Deployment guide hazır
- [ ] Troubleshooting guide hazır

## 🔄 CI/CD

- [ ] CI pipeline kuruldu
- [ ] Automated testing aktif
- [ ] Automated deployment aktif
- [ ] Rollback stratejisi hazır

## ✅ Pre-Launch

- [ ] Load testing yapıldı
- [ ] Security audit yapıldı
- [ ] Backup ve restore test edildi
- [ ] Disaster recovery planı hazır
- [ ] Support channels hazır

## 🎯 Post-Launch

- [ ] Monitoring dashboards aktif
- [ ] Alerting kuruldu
- [ ] User feedback mekanizması hazır
- [ ] Performance metrics takip ediliyor

