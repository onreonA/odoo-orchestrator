-- Template Deployments Management
-- This migration creates tables for tracking template deployments

-- Create template_deployments table
CREATE TABLE IF NOT EXISTS template_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES odoo_instances(id) ON DELETE CASCADE,
  template_id UUID NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('kickoff', 'bom', 'workflow', 'dashboard', 'module_config')),
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'success', 'failed', 'rolled_back')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  current_step TEXT,
  
  -- Result
  result JSONB,
  error_message TEXT,
  error_stack TEXT,
  
  -- Rollback info
  backup_id UUID REFERENCES odoo_instance_backups(id),
  can_rollback BOOLEAN DEFAULT true,
  rolled_back_at TIMESTAMPTZ,
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Metadata
  deployed_by UUID REFERENCES profiles(id),
  customizations JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for template_deployments
CREATE INDEX IF NOT EXISTS idx_deployments_instance ON template_deployments(instance_id);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON template_deployments(status);
CREATE INDEX IF NOT EXISTS idx_deployments_created_at ON template_deployments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deployments_template_type ON template_deployments(template_type);

-- Create deployment_logs table
CREATE TABLE IF NOT EXISTS deployment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deployment_id UUID NOT NULL REFERENCES template_deployments(id) ON DELETE CASCADE,
  
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warning', 'error')),
  message TEXT NOT NULL,
  details JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for deployment_logs
CREATE INDEX IF NOT EXISTS idx_deployment_logs_deployment ON deployment_logs(deployment_id);
CREATE INDEX IF NOT EXISTS idx_deployment_logs_level ON deployment_logs(level) WHERE level IN ('warning', 'error');
CREATE INDEX IF NOT EXISTS idx_deployment_logs_created_at ON deployment_logs(created_at DESC);

-- Enable RLS
ALTER TABLE template_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployment_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for template_deployments
CREATE POLICY "Super admins see all deployments"
  ON template_deployments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Company admins see own deployments"
  ON template_deployments FOR SELECT
  USING (
    instance_id IN (
      SELECT id FROM odoo_instances
      WHERE company_id IN (
        SELECT company_id FROM profiles
        WHERE profiles.id = auth.uid()
      )
    )
  );

CREATE POLICY "Super admins manage all deployments"
  ON template_deployments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- RLS Policies for deployment_logs
CREATE POLICY "Super admins see all logs"
  ON deployment_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Company admins see own logs"
  ON deployment_logs FOR SELECT
  USING (
    deployment_id IN (
      SELECT id FROM template_deployments
      WHERE instance_id IN (
        SELECT id FROM odoo_instances
        WHERE company_id IN (
          SELECT company_id FROM profiles
          WHERE profiles.id = auth.uid()
        )
      )
    )
  );

-- Function to calculate deployment duration
CREATE OR REPLACE FUNCTION calculate_deployment_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_deployment_duration_trigger
  BEFORE UPDATE ON template_deployments
  FOR EACH ROW
  WHEN (NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL)
  EXECUTE FUNCTION calculate_deployment_duration();

-- Comments
COMMENT ON TABLE template_deployments IS 'Tracks template deployment operations to Odoo instances';
COMMENT ON COLUMN template_deployments.template_type IS 'Type of template being deployed: kickoff, bom, workflow, dashboard, or module_config';
COMMENT ON COLUMN template_deployments.progress IS 'Deployment progress percentage (0-100)';
COMMENT ON COLUMN template_deployments.current_step IS 'Current step being executed in the deployment';
COMMENT ON COLUMN template_deployments.result IS 'JSON object containing deployment results (e.g., created record IDs)';
COMMENT ON COLUMN template_deployments.backup_id IS 'Reference to backup created before deployment for rollback';
COMMENT ON COLUMN template_deployments.customizations IS 'JSON object containing user customizations to the template';

COMMENT ON TABLE deployment_logs IS 'Stores detailed logs for template deployments';
COMMENT ON COLUMN deployment_logs.level IS 'Log level: debug, info, warning, or error';
COMMENT ON COLUMN deployment_logs.details IS 'JSON object containing additional log details';

