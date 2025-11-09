# 🔧 Foreign Key Hatası - Hızlı Çözüm

## ❌ Sorun
```
insert or update on table "companies" violates foreign key constraint "companies_created_by_fkey"
```

**Neden:** `created_by` alanı `profiles(id)` tablosuna referans veriyor ama kullanıcının profili yok.

## ✅ Çözüm (2 Yöntem)

### **Yöntem 1: Supabase Dashboard'dan (Hızlı)**

1. Supabase Dashboard'a gidin: https://supabase.com/dashboard
2. Projenizi seçin
3. SQL Editor'e gidin
4. Şu SQL'i çalıştırın:

```sql
-- Foreign key constraint'i kaldır (NULL'a izin ver)
ALTER TABLE companies
  DROP CONSTRAINT IF EXISTS companies_created_by_fkey;

ALTER TABLE companies
  ADD CONSTRAINT companies_created_by_fkey
  FOREIGN KEY (created_by) 
  REFERENCES profiles(id) 
  ON DELETE SET NULL;
```

### **Yöntem 2: Kod Tarafında (Zaten Yapıldı)**

Kodda profile kontrolü eklendi. Eğer profile yoksa otomatik oluşturuluyor.

**Dosya:** `app/(dashboard)/companies/new/page.tsx`

```typescript
// Ensure profile exists
const { data: profile } = await supabase
  .from('profiles')
  .select('id')
  .eq('id', user.id)
  .single()

// If profile doesn't exist, create it
if (!profile) {
  await supabase.from('profiles').insert({
    id: user.id,
    email: user.email || '',
    full_name: user.user_metadata?.full_name || '',
    role: 'super_admin',
  })
}
```

## 🚀 Hızlı Test

1. Tarayıcıda sayfayı yenileyin
2. Firma eklemeyi tekrar deneyin
3. Artık çalışmalı!

---

**Not:** Migration dosyası hazır ama uzun sürüyor. Supabase Dashboard'dan manuel çalıştırmanız daha hızlı olur.

