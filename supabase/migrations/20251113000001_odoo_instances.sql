-- Odoo Instances Management
-- This migration creates tables for managing Odoo instances

-- Create odoo_instances table
CREATE TABLE IF NOT EXISTS odoo_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Instance bilgileri (Multi-environment support)
  instance_url TEXT NOT NULL,  -- https://<instance-name>.odoo.com or https://<instance-name>.odoo.sh
  instance_id TEXT,  -- Odoo.sh instance ID (unique identifier, only for odoo_sh)
  instance_name TEXT NOT NULL,  -- Instance name (subdomain)
  database_name TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '17.0',
  
  -- Odoo.sh API credentials (only for odoo_sh deployment method)
  odoo_sh_api_token_encrypted TEXT,  -- Odoo.sh API token (encrypted, optional - only for odoo_sh)
  encryption_key_id TEXT NOT NULL DEFAULT 'default',  -- Key rotation için
  
  -- Odoo instance credentials (encrypted with AES-256)
  admin_username TEXT NOT NULL,
  admin_password_encrypted TEXT NOT NULL,
  api_key_encrypted TEXT,  -- Odoo XML-RPC API key (if used)
  
  -- Cloud-specific fields (odoo.sh or odoo.com)
  subscription_id TEXT,  -- Subscription ID (odoo.sh or odoo.com)
  subscription_tier TEXT,  -- 'starter', 'growth', 'enterprise' (for odoo.sh)
  git_repository_url TEXT,  -- Git repository URL for deployments (odoo.sh only)
  git_branch TEXT DEFAULT 'master',  -- Current branch (master, staging, production) (odoo.sh only)
  git_commit_hash TEXT,  -- Last deployed commit hash (odoo.sh only)
  
  -- Odoo.com specific (for initial demos)
  odoo_com_account_id TEXT,  -- Odoo.com account ID (if applicable)
  odoo_com_subdomain TEXT,  -- Odoo.com subdomain (e.g., 'aeka-mobilya')
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'error', 'deploying', 'maintenance')),
  health_status JSONB,
  last_health_check TIMESTAMPTZ,
  health_check_interval INTEGER DEFAULT 300,  -- saniye
  
  -- Deployment info
  deployed_at TIMESTAMPTZ,
  deployed_by UUID REFERENCES profiles(id),
  deployment_method TEXT DEFAULT 'odoo_com' CHECK (deployment_method IN ('odoo_com', 'odoo_sh', 'docker', 'manual')),
  
  -- Migration info (for odoo.com -> odoo.sh migration)
  migrated_from TEXT,  -- Previous deployment_method
  migrated_at TIMESTAMPTZ,  -- When migration happened
  migration_backup_id UUID REFERENCES odoo_instance_backups(id),  -- Backup used for migration
  
  -- Configuration
  modules_installed TEXT[],
  storage_used_mb INTEGER,
  storage_limit_mb INTEGER,
  user_count INTEGER,
  user_limit INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(company_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_odoo_instances_company ON odoo_instances(company_id);
CREATE INDEX IF NOT EXISTS idx_odoo_instances_status ON odoo_instances(status);
CREATE INDEX IF NOT EXISTS idx_odoo_instances_health_check ON odoo_instances(last_health_check) 
  WHERE status = 'active';

-- Create odoo_instance_backups table
CREATE TABLE IF NOT EXISTS odoo_instance_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES odoo_instances(id) ON DELETE CASCADE,
  
  -- Backup info
  backup_type TEXT NOT NULL CHECK (backup_type IN ('manual', 'automatic', 'pre_deployment')),
  backup_id TEXT,  -- Odoo.sh backup ID
  size_mb INTEGER,
  storage_path TEXT,  -- Odoo.sh storage path (if downloaded locally)
  download_url TEXT,  -- Odoo.sh backup download URL (temporary)
  
  -- Status
  status TEXT DEFAULT 'creating' CHECK (status IN ('creating', 'completed', 'failed', 'downloading')),
  error_message TEXT,
  
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes for backups
CREATE INDEX IF NOT EXISTS idx_backups_instance ON odoo_instance_backups(instance_id);
CREATE INDEX IF NOT EXISTS idx_backups_created_at ON odoo_instance_backups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backups_status ON odoo_instance_backups(status);

-- Enable RLS
ALTER TABLE odoo_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE odoo_instance_backups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotent migration)
DROP POLICY IF EXISTS "Super admins see all instances" ON odoo_instances;
DROP POLICY IF EXISTS "Company admins see own instance" ON odoo_instances;
DROP POLICY IF EXISTS "Super admins manage all instances" ON odoo_instances;
DROP POLICY IF EXISTS "Super admins see all backups" ON odoo_instance_backups;
DROP POLICY IF EXISTS "Company admins see own backups" ON odoo_instance_backups;
DROP POLICY IF EXISTS "Super admins manage all backups" ON odoo_instance_backups;

-- RLS Policies for odoo_instances
CREATE POLICY "Super admins see all instances"
  ON odoo_instances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Company admins see own instance"
  ON odoo_instances FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Super admins manage all instances"
  ON odoo_instances FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- RLS Policies for odoo_instance_backups
CREATE POLICY "Super admins see all backups"
  ON odoo_instance_backups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Company admins see own backups"
  ON odoo_instance_backups FOR SELECT
  USING (
    instance_id IN (
      SELECT id FROM odoo_instances
      WHERE company_id IN (
        SELECT company_id FROM profiles
        WHERE profiles.id = auth.uid()
      )
    )
  );

CREATE POLICY "Super admins manage all backups"
  ON odoo_instance_backups FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Create updated_at trigger for odoo_instances
CREATE OR REPLACE FUNCTION update_odoo_instances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (for idempotent migration)
DROP TRIGGER IF EXISTS update_odoo_instances_updated_at ON odoo_instances;

CREATE TRIGGER update_odoo_instances_updated_at
  BEFORE UPDATE ON odoo_instances
  FOR EACH ROW
  EXECUTE FUNCTION update_odoo_instances_updated_at();

-- Comments
COMMENT ON TABLE odoo_instances IS 'Stores information about Odoo instances managed by the platform';
COMMENT ON COLUMN odoo_instances.encryption_key_id IS 'ID of the encryption key used for credentials (supports key rotation)';
COMMENT ON COLUMN odoo_instances.health_status IS 'JSON object containing health check results';
COMMENT ON COLUMN odoo_instances.health_check_interval IS 'Interval in seconds between health checks (default 5 minutes)';

COMMENT ON TABLE odoo_instance_backups IS 'Stores backup information for Odoo instances';
COMMENT ON COLUMN odoo_instance_backups.backup_type IS 'Type of backup: manual, automatic, or pre_deployment';
COMMENT ON COLUMN odoo_instance_backups.storage_path IS 'Path to backup file in storage';

-- Add new columns if table already exists (for idempotent migration)
DO $$
BEGIN
  -- Add odoo_com specific columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'odoo_instances' AND column_name = 'odoo_com_account_id'
  ) THEN
    ALTER TABLE odoo_instances ADD COLUMN odoo_com_account_id TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'odoo_instances' AND column_name = 'odoo_com_subdomain'
  ) THEN
    ALTER TABLE odoo_instances ADD COLUMN odoo_com_subdomain TEXT;
  END IF;
  
  -- Add migration columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'odoo_instances' AND column_name = 'migrated_from'
  ) THEN
    ALTER TABLE odoo_instances ADD COLUMN migrated_from TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'odoo_instances' AND column_name = 'migrated_at'
  ) THEN
    ALTER TABLE odoo_instances ADD COLUMN migrated_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'odoo_instances' AND column_name = 'migration_backup_id'
  ) THEN
    ALTER TABLE odoo_instances ADD COLUMN migration_backup_id UUID REFERENCES odoo_instance_backups(id);
  END IF;
  
  -- Update deployment_method default if column exists but default is different
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'odoo_instances' AND column_name = 'deployment_method'
  ) THEN
    -- Check if default needs to be updated (this is safe, won't change existing values)
    ALTER TABLE odoo_instances ALTER COLUMN deployment_method SET DEFAULT 'odoo_com';
  END IF;
END $$;

-- Update CHECK constraint separately (outside DO block to use DECLARE)
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Find the constraint name for deployment_method
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'odoo_instances'::regclass
  AND contype = 'c'
  AND (
    conname LIKE '%deployment_method%' 
    OR pg_get_constraintdef(oid) LIKE '%deployment_method%'
  )
  LIMIT 1;
  
  -- Drop existing constraint if found
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE odoo_instances DROP CONSTRAINT IF EXISTS %I', constraint_name);
  END IF;
  
  -- Add new constraint with 'odoo_com' (if it doesn't already exist)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'odoo_instances'::regclass
    AND contype = 'c'
    AND conname = 'odoo_instances_deployment_method_check'
  ) THEN
    ALTER TABLE odoo_instances ADD CONSTRAINT odoo_instances_deployment_method_check 
      CHECK (deployment_method IN ('odoo_com', 'odoo_sh', 'docker', 'manual'));
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    -- Constraint already exists, skip
    NULL;
END $$;

-- Continue with remaining column additions
DO $$
BEGIN
  
  -- Add backup columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'odoo_instance_backups' AND column_name = 'backup_id'
  ) THEN
    ALTER TABLE odoo_instance_backups ADD COLUMN backup_id TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'odoo_instance_backups' AND column_name = 'download_url'
  ) THEN
    ALTER TABLE odoo_instance_backups ADD COLUMN download_url TEXT;
  END IF;
  
  -- Update status check constraint for backups if needed
  -- Note: PostgreSQL doesn't support ALTER CHECK constraint easily, so we skip this
  -- The constraint will be applied to new rows only
  
  -- Make instance_id nullable if it's currently NOT NULL (for odoo.com support)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'odoo_instances' 
    AND column_name = 'instance_id' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE odoo_instances ALTER COLUMN instance_id DROP NOT NULL;
  END IF;
  
  -- Make odoo_sh_api_token_encrypted nullable if it's currently NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'odoo_instances' 
    AND column_name = 'odoo_sh_api_token_encrypted' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE odoo_instances ALTER COLUMN odoo_sh_api_token_encrypted DROP NOT NULL;
  END IF;
END $$;

