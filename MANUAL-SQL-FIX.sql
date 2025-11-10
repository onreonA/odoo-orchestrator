-- ============================================
-- MANUEL SQL - Supabase Dashboard'dan Çalıştırın
-- ============================================
-- Bu SQL'i Supabase Dashboard > SQL Editor'den çalıştırın
-- Çok daha hızlı olacak!

-- Companies tablosu için foreign key constraint'i düzelt
ALTER TABLE companies 
  ALTER COLUMN created_by DROP NOT NULL;

ALTER TABLE companies
  DROP CONSTRAINT IF EXISTS companies_created_by_fkey;

ALTER TABLE companies
  ADD CONSTRAINT companies_created_by_fkey
  FOREIGN KEY (created_by) 
  REFERENCES profiles(id) 
  ON DELETE SET NULL;

-- ✅ Tamamlandı! Artık created_by NULL olabilir ve foreign key hatası olmaz.




