# 🔒 RLS Policy Düzeltmesi

## ❌ Sorun

**Hata Mesajı:**
```
new row violates row-level security policy for table 'companies'
```

**Neden Oldu:**
- Companies tablosuna INSERT yaparken RLS policy'si engelliyordu
- Mevcut policy'ler sadece super_admin veya company_id'ye sahip kullanıcılar için çalışıyordu
- Yeni firma oluştururken kullanıcının henüz company_id'si olmadığı için policy eşleşmiyordu

## ✅ Çözüm

**Migration:** `20251109200400_fix_companies_insert_policy.sql`

**Yapılan Değişiklikler:**

1. **INSERT Policy Eklendi:**
   ```sql
   CREATE POLICY "Authenticated users can insert companies"
     ON companies FOR INSERT
     WITH CHECK (auth.uid() IS NOT NULL);
   ```
   - Artık authenticated herhangi bir kullanıcı firma oluşturabilir

2. **SELECT Policy Güncellendi:**
   - Super admin'ler tüm firmaları görebilir
   - Kullanıcılar oluşturdukları firmaları görebilir
   - Kullanıcılar ait oldukları firmaları görebilir

3. **UPDATE Policy Güncellendi:**
   - Super admin'ler tüm firmaları güncelleyebilir
   - Kullanıcılar oluşturdukları firmaları güncelleyebilir

4. **DELETE Policy:**
   - Sadece super admin'ler silebilir

## 🧪 Test

**E2E Test Eklendi:**
- `e2e/companies-rls-error.spec.ts`
- RLS hatası olmadan firma oluşturmayı test eder

## 📝 Sonuç

✅ Migration başarıyla uygulandı  
✅ RLS hatası düzeltildi  
✅ Kullanıcılar artık firma oluşturabilir  
✅ Test eklendi

## 🔄 Migration Uygulama

Migration otomatik olarak uygulandı. Eğer manuel uygulamak isterseniz:

```bash
npx supabase db push
```

Veya Supabase Dashboard'dan SQL Editor'de çalıştırabilirsiniz.




