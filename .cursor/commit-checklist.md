# Commit Checklist

Bu dosya, commit işlemlerinde kontrol edilmesi gereken kritik dosyaları içerir.

## Kritik Sayfalar (Silinmemeli)

### Dashboard Sayfaları

- `app/(dashboard)/departments/page.tsx`
- `app/(dashboard)/departments/new/page.tsx`
- `app/(dashboard)/tasks/page.tsx`
- `app/(dashboard)/tasks/new/page.tsx`
- `app/(dashboard)/projects/page.tsx`
- `app/(dashboard)/support/page.tsx`
- `app/(dashboard)/configurations/templates/page.tsx`

### Core Dosyalar

- `app/(dashboard)/layout.tsx`
- `lib/supabase/server.ts`
- `lib/supabase/client.ts`
- `lib/utils.ts`
- `components/ui/button.tsx`

## Commit Öncesi Kontrol Listesi

1. ✅ `git status` ile değişiklikleri kontrol et
2. ✅ Silinen dosyaları kontrol et (`git status` içinde `D` işareti)
3. ✅ Kritik sayfaların varlığını kontrol et
4. ✅ Format kontrolü yap (`npm run format:check`)
5. ✅ Commit mesajını açıklayıcı yaz





