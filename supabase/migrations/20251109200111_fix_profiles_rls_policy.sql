-- ============================================
-- FIX PROFILES RLS POLICY - Infinite Recursion
-- ============================================
-- Problem: RLS policy was checking profiles table while inserting into profiles
-- Solution: Use auth.uid() directly instead of querying profiles table

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Super admins have full access to profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- New policies that don't cause recursion

-- 1. INSERT: Users can create their own profile (during registration)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. SELECT: Users can read their own profile, super admins can read all
-- For super admin check, we'll use a function that doesn't query profiles table
CREATE POLICY "Users can read own profile or super admin reads all"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id 
    OR 
    -- Check if user is super admin via auth.jwt() claims
    -- We'll set this claim during registration for first user
    (auth.jwt() ->> 'role') = 'super_admin'
  );

-- 3. UPDATE: Users can update their own profile, super admins can update all
CREATE POLICY "Users can update own profile or super admin updates all"
  ON profiles FOR UPDATE
  USING (
    auth.uid() = id 
    OR 
    (auth.jwt() ->> 'role') = 'super_admin'
  )
  WITH CHECK (
    auth.uid() = id 
    OR 
    (auth.jwt() ->> 'role') = 'super_admin'
  );

-- 4. DELETE: Only super admins can delete profiles
CREATE POLICY "Super admins can delete profiles"
  ON profiles FOR DELETE
  USING ((auth.jwt() ->> 'role') = 'super_admin');

-- ============================================
-- ALTERNATIVE: Simpler approach - Allow all operations during development
-- Uncomment below if you want to disable RLS temporarily for profiles
-- ============================================

-- For now, let's use a simpler approach: Allow authenticated users to manage profiles
-- This is safer and avoids recursion

-- Drop all policies first
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile or super admin reads all" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile or super admin updates all" ON profiles;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON profiles;

-- Simple policies that work:
-- INSERT: Any authenticated user can insert their own profile
CREATE POLICY "Allow authenticated users to insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- SELECT: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- UPDATE: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Note: For super admin access, we'll handle it in application code
-- or create a separate function that checks without recursion




