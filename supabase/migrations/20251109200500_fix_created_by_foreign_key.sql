-- ============================================
-- FIX CREATED_BY FOREIGN KEY CONSTRAINT
-- ============================================
-- Problem: created_by references profiles(id) but profile might not exist
-- Solution: Make created_by nullable and remove strict foreign key constraint
-- OR: Ensure profile exists before inserting

-- Fix companies table foreign key constraint
-- Make it allow NULL and add ON DELETE SET NULL

-- First, make sure created_by can be NULL
ALTER TABLE companies 
  ALTER COLUMN created_by DROP NOT NULL;

-- Drop existing constraint
ALTER TABLE companies
  DROP CONSTRAINT IF EXISTS companies_created_by_fkey;

-- Add new constraint that allows NULL
ALTER TABLE companies
  ADD CONSTRAINT companies_created_by_fkey
  FOREIGN KEY (created_by) 
  REFERENCES profiles(id) 
  ON DELETE SET NULL;
