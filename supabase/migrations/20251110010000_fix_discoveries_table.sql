-- ============================================
-- FIX DISCOVERIES TABLE
-- ============================================
-- Problem 1: project_id is NOT NULL but can be null in API
-- Problem 2: Missing RLS policies for discoveries table

-- 1. Make project_id nullable (discoveries can exist without a project)
ALTER TABLE discoveries 
  ALTER COLUMN project_id DROP NOT NULL;

-- 2. Add RLS policies for discoveries table

-- INSERT: Authenticated users can create discoveries for companies they have access to
CREATE POLICY "Authenticated users can insert discoveries"
  ON discoveries FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      -- User created the company
      company_id IN (
        SELECT id FROM companies WHERE created_by = auth.uid()
      )
      OR
      -- User belongs to the company
      company_id IN (
        SELECT company_id FROM profiles
        WHERE profiles.id = auth.uid()
        AND company_id IS NOT NULL
      )
      OR
      -- Super admin
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
      )
    )
  );

-- SELECT: Users can read discoveries for companies they have access to
CREATE POLICY "Users can read discoveries for accessible companies"
  ON discoveries FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      -- User created the company
      company_id IN (
        SELECT id FROM companies WHERE created_by = auth.uid()
      )
      OR
      -- User belongs to the company
      company_id IN (
        SELECT company_id FROM profiles
        WHERE profiles.id = auth.uid()
        AND company_id IS NOT NULL
      )
      OR
      -- User created the discovery
      created_by = auth.uid()
      OR
      -- Super admin
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
      )
    )
  );

-- UPDATE: Users can update discoveries they created or for their companies
CREATE POLICY "Users can update own discoveries or company discoveries"
  ON discoveries FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND (
      created_by = auth.uid()
      OR
      company_id IN (
        SELECT id FROM companies WHERE created_by = auth.uid()
      )
      OR
      company_id IN (
        SELECT company_id FROM profiles
        WHERE profiles.id = auth.uid()
        AND company_id IS NOT NULL
      )
      OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
      )
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      created_by = auth.uid()
      OR
      company_id IN (
        SELECT id FROM companies WHERE created_by = auth.uid()
      )
      OR
      company_id IN (
        SELECT company_id FROM profiles
        WHERE profiles.id = auth.uid()
        AND company_id IS NOT NULL
      )
      OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
      )
    )
  );

-- DELETE: Users can delete discoveries they created or super admins can delete all
CREATE POLICY "Users can delete own discoveries or super admin deletes all"
  ON discoveries FOR DELETE
  USING (
    created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );




