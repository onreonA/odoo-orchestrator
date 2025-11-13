# Sprint 2: Smart Calendar UI Planı

## 🎯 Hedef

Güzel, interaktif bir takvim UI'ı oluşturmak. Kullanıcılar:

- Takvim görünümünü görebilir (aylık, haftalık, günlük)
- Yeni event oluşturabilir
- Event'leri görüntüleyip düzenleyebilir
- Event'leri silebilir
- Firma bazlı filtreleme yapabilir

## 📁 Oluşturulacak Dosyalar

### Pages

- `app/(dashboard)/calendar/page.tsx` - Ana takvim sayfası
- `app/(dashboard)/calendar/events/new/page.tsx` - Yeni event oluşturma
- `app/(dashboard)/calendar/events/[id]/page.tsx` - Event detay görüntüleme
- `app/(dashboard)/calendar/events/[id]/edit/page.tsx` - Event düzenleme

### API Routes

- `app/api/calendar/events/route.ts` - GET (list), POST (create)
- `app/api/calendar/events/[id]/route.ts` - GET (detail), PUT (update), DELETE

### Components

- `components/calendar/calendar-view.tsx` - Ana takvim görünümü
- `components/calendar/event-card.tsx` - Event kartı
- `components/calendar/event-form.tsx` - Event formu
- `components/calendar/event-detail.tsx` - Event detay modalı
- `components/calendar/view-selector.tsx` - Görünüm seçici (month/week/day)

### Services

- `lib/services/calendar-service.ts` - Calendar business logic

## 🎨 UI Özellikleri

### Görünümler

1. **Monthly View** - Aylık görünüm (grid)
2. **Weekly View** - Haftalık görünüm (time slots)
3. **Daily View** - Günlük görünüm (detailed)

### Event Card Özellikleri

- Renk kodlaması (event type'a göre)
- Durum göstergesi (scheduled, confirmed, cancelled)
- Katılımcı avatarları
- Firma etiketi
- Hızlı aksiyonlar (edit, delete)

### Form Özellikleri

- Başlık, açıklama
- Tarih/saat seçici
- Lokasyon, meeting URL
- Katılımcı seçimi (firma içi kullanıcılar)
- Firma seçimi
- Event type seçimi
- Recurrence (tekrar eden event'ler)

## 🔧 Teknik Detaylar

### State Management

- React hooks (useState, useEffect)
- Server Components (Next.js App Router)
- Supabase Realtime (real-time updates)

### Styling

- Tailwind CSS
- shadcn/ui components
- Responsive design

### Data Fetching

- Server-side data fetching
- Client-side mutations
- Optimistic updates

## 📝 İlk Adımlar

1. Calendar service oluştur
2. API routes oluştur
3. Calendar page oluştur (basit liste)
4. Event form component'i oluştur
5. Calendar view component'i oluştur
