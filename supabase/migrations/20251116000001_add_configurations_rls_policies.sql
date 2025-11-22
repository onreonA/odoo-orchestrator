-- ============================================
-- Add RLS Policies for configurations table
-- ============================================

-- Drop existing policies if they exist (for idempotent migration)
DROP POLICY IF EXISTS "Super admins have full access to configurations" ON configurations;
DROP POLICY IF EXISTS "Users can view configurations of their company" ON configurations;
DROP POLICY IF EXISTS "Users can create configurations for their company" ON configurations;
DROP POLICY IF EXISTS "Users can update configurations of their company" ON configurations;
DROP POLICY IF EXISTS "Users can delete configurations of their company" ON configurations;

-- Super Admin: Full access to all configurations
CREATE POLICY "Super admins have full access to configurations"
  ON configurations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Users can view configurations of their company
CREATE POLICY "Users can view configurations of their company"
  ON configurations FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Users can create configurations for their company
CREATE POLICY "Users can create configurations for their company"
  ON configurations FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Users can update configurations of their company
CREATE POLICY "Users can update configurations of their company"
  ON configurations FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Users can delete configurations of their company
CREATE POLICY "Users can delete configurations of their company"
  ON configurations FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );




