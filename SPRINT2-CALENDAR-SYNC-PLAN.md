# Sprint 2: Calendar Sync Engine Planı

## 🎯 Hedef

Dış takvimlerle (Google Calendar, Outlook, CalDAV) iki yönlü senkronizasyon sağlamak.

## 📋 Özellikler

### 1. Google Calendar Sync
- OAuth 2.0 authentication
- Calendar listesi çekme
- Event'leri senkronize etme (bi-directional)
- Conflict resolution

### 2. Outlook/Microsoft 365 Sync
- Microsoft Graph API entegrasyonu
- OAuth 2.0 authentication
- Calendar ve event senkronizasyonu

### 3. CalDAV/WebDAV Support
- Standart protokol desteği
- Generic calendar server entegrasyonu

### 4. Sync Management UI
- Sync bağlantıları yönetme
- Sync durumu görüntüleme
- Sync kuralları ayarlama
- Privacy controls

## 🔧 Teknik Gereksinimler

### Paketler
- `googleapis` - Google Calendar API
- `@microsoft/microsoft-graph-client` - Microsoft Graph API
- `dav` veya `node-caldav` - CalDAV protokolü
- `ical.js` - iCal format parsing

### API Routes
- `POST /api/calendar/syncs` - Yeni sync bağlantısı oluştur
- `GET /api/calendar/syncs` - Sync bağlantılarını listele
- `PUT /api/calendar/syncs/[id]` - Sync ayarlarını güncelle
- `DELETE /api/calendar/syncs/[id]` - Sync bağlantısını sil
- `POST /api/calendar/syncs/[id]/sync` - Manuel sync tetikle
- `GET /api/calendar/syncs/[id]/status` - Sync durumu

### Services
- `lib/services/calendar-sync-service.ts` - Sync business logic
- `lib/integrations/google-calendar.ts` - Google Calendar integration
- `lib/integrations/outlook-calendar.ts` - Outlook integration
- `lib/integrations/caldav-client.ts` - CalDAV client

### UI Pages
- `app/(dashboard)/calendar/syncs/page.tsx` - Sync bağlantıları listesi
- `app/(dashboard)/calendar/syncs/new/page.tsx` - Yeni sync bağlantısı
- `app/(dashboard)/calendar/syncs/[id]/page.tsx` - Sync detay ve ayarlar

## 📝 İlk Adımlar

1. Google Calendar OAuth setup
2. Google Calendar API client
3. Sync service oluştur
4. Sync API routes
5. Sync management UI


