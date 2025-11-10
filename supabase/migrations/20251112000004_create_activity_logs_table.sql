-- ============================================
-- ACTIVITY LOGS TABLE
-- ============================================
-- Created: 2025-11-12
-- Description: Aktivite kayıtları için tablo

-- Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Activity Info
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'view', 'login', 'logout', 'export', etc.
  entity_type TEXT NOT NULL, -- 'project', 'discovery', 'ticket', 'document', 'training', 'user', etc.
  entity_id UUID, -- ID of the affected entity
  
  -- Details
  description TEXT NOT NULL,
  metadata JSONB, -- Additional context data
  
  -- Location
  ip_address TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_company_id ON activity_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_project_id ON activity_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Super admin: Full access
CREATE POLICY "Super admins have full access to activity logs"
  ON activity_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Company admin: Access to own company logs
CREATE POLICY "Company admins access own company activity logs"
  ON activity_logs FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'company_admin')
    )
  );

-- Company users: Access to own activity logs
CREATE POLICY "Company users access own activity logs"
  ON activity_logs FOR SELECT
  USING (
    user_id = auth.uid()
    OR company_id IN (
      SELECT company_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Users can create their own activity logs
CREATE POLICY "Users can create activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR company_id IN (
      SELECT company_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Function to automatically log activities
CREATE OR REPLACE FUNCTION log_activity(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_description TEXT,
  p_metadata JSONB DEFAULT NULL,
  p_company_id UUID DEFAULT NULL,
  p_project_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_company_id UUID;
  v_log_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Get user's company_id if not provided
  IF p_company_id IS NULL AND v_user_id IS NOT NULL THEN
    SELECT company_id INTO v_company_id
    FROM profiles
    WHERE id = v_user_id;
  ELSE
    v_company_id := p_company_id;
  END IF;
  
  -- Insert activity log
  INSERT INTO activity_logs (
    company_id,
    project_id,
    user_id,
    action,
    entity_type,
    entity_id,
    description,
    metadata
  ) VALUES (
    v_company_id,
    p_project_id,
    v_user_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_description,
    p_metadata
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

