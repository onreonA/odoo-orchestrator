-- ============================================
-- SPRINT 7: Add consultant role to user_role enum
-- Bu migration önce çalıştırılmalı (20251114000000)
-- ============================================

-- User role enum'a consultant ekle (eğer yoksa)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'consultant' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
    ALTER TYPE user_role ADD VALUE 'consultant';
  END IF;
END $$;


