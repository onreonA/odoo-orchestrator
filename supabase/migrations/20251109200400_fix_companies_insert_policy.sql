-- ============================================
-- FIX COMPANIES INSERT POLICY
-- ============================================
-- Problem: Users cannot insert new companies because RLS policy requires company_id
-- Solution: Allow authenticated users to insert companies (they become the creator)

-- Drop existing INSERT-restrictive policies if they exist
DROP POLICY IF EXISTS "Super admins have full access to companies" ON companies;
DROP POLICY IF EXISTS "Company admins access own company" ON companies;

-- 1. INSERT: Any authenticated user can create a company
CREATE POLICY "Authenticated users can insert companies"
  ON companies FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 2. SELECT: Super admins see all, others see companies they created or belong to
CREATE POLICY "Users can select companies they created or belong to"
  ON companies FOR SELECT
  USING (
    -- Super admin sees all
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
    OR
    -- User created the company
    created_by = auth.uid()
    OR
    -- User belongs to the company
    id IN (
      SELECT company_id FROM profiles
      WHERE profiles.id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

-- 3. UPDATE: Super admins can update all, creators can update their own
CREATE POLICY "Users can update own companies or super admin"
  ON companies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
    OR
    created_by = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
    OR
    created_by = auth.uid()
  );

-- 4. DELETE: Only super admins can delete companies
CREATE POLICY "Only super admins can delete companies"
  ON companies FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );
