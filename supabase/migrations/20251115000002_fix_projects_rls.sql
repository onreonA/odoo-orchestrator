-- Fix RLS policies for projects table
-- Add WITH CHECK clause for INSERT operations
-- Add super_admin policy for projects

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Company admins access own company projects" ON projects;

-- Create policy with both USING and WITH CHECK for INSERT/UPDATE
CREATE POLICY "Company admins access own company projects"
  ON projects FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Super Admin: Full access to projects
CREATE POLICY "Super admins have full access to projects"
  ON projects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

