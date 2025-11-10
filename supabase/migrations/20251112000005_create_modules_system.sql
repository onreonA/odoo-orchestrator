-- ============================================
-- MODULE SYSTEM - Plugin Architecture
-- ============================================
-- Created: 2025-11-12
-- Description: Plugin/modül sistemi için database schema
-- Sprint: 5

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE module_type AS ENUM ('core', 'optional', 'custom');
CREATE TYPE plugin_status AS ENUM ('available', 'installed', 'active', 'inactive', 'error');
CREATE TYPE module_category AS ENUM (
  'productivity',
  'analytics',
  'integration',
  'personal',
  'business',
  'custom'
);

-- ============================================
-- TABLES
-- ============================================

-- 1. modules (Plugin Registry)
-- Tüm mevcut modüllerin kaydı (marketplace)
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE, -- URL-friendly identifier
  description TEXT,
  long_description TEXT,
  icon_url TEXT,
  banner_url TEXT,
  
  -- Metadata
  version TEXT NOT NULL DEFAULT '1.0.0',
  author TEXT,
  author_url TEXT,
  homepage_url TEXT,
  repository_url TEXT,
  license TEXT DEFAULT 'MIT',
  
  -- Categorization
  type module_type NOT NULL DEFAULT 'optional',
  category module_category NOT NULL DEFAULT 'custom',
  tags TEXT[] DEFAULT '{}',
  
  -- Dependencies
  dependencies TEXT[], -- Other module slugs this depends on
  conflicts_with TEXT[], -- Module slugs that conflict
  
  -- Requirements
  min_platform_version TEXT,
  required_permissions TEXT[], -- e.g., ['read_companies', 'write_projects']
  
  -- Configuration
  has_settings BOOLEAN DEFAULT false,
  settings_schema JSONB, -- JSON schema for module settings
  
  -- Status
  is_official BOOLEAN DEFAULT false, -- Official modules by platform team
  is_featured BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  
  -- Stats
  install_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0,
  
  -- Files
  entry_point TEXT, -- Main module file path
  files JSONB, -- List of files included in module
  
  -- Lifecycle
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  deprecated_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$')
);

-- 2. module_instances (Installed Modules)
-- Kullanıcı/firma bazında yüklenmiş modüller
CREATE TABLE module_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE, -- NULL = global/user-level
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- NULL = company-level
  
  -- Status
  status plugin_status NOT NULL DEFAULT 'installed',
  version TEXT NOT NULL, -- Installed version
  
  -- Configuration
  settings JSONB DEFAULT '{}', -- Module-specific settings
  
  -- Lifecycle
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,
  last_error TEXT,
  last_error_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_instance CHECK (
    (company_id IS NOT NULL AND user_id IS NULL) OR
    (company_id IS NULL AND user_id IS NOT NULL) OR
    (company_id IS NULL AND user_id IS NULL) -- Global instance
  )
);

-- 3. module_settings (Module Settings)
-- Modül ayarları (key-value pairs)
CREATE TABLE module_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  instance_id UUID NOT NULL REFERENCES module_instances(id) ON DELETE CASCADE,
  
  -- Settings
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(instance_id, key)
);

-- 4. module_hooks (Module Hooks)
-- Modüllerin sistem event'lerine bağlanması için
CREATE TABLE module_hooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  instance_id UUID NOT NULL REFERENCES module_instances(id) ON DELETE CASCADE,
  
  -- Hook Info
  event_name TEXT NOT NULL, -- e.g., 'company.created', 'project.updated'
  handler_function TEXT NOT NULL, -- Function name in module
  priority INTEGER DEFAULT 100, -- Lower = higher priority
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(instance_id, event_name, handler_function)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_modules_slug ON modules(slug);
CREATE INDEX idx_modules_type ON modules(type);
CREATE INDEX idx_modules_category ON modules(category);
CREATE INDEX idx_modules_featured ON modules(is_featured) WHERE is_featured = true;

CREATE INDEX idx_module_instances_module ON module_instances(module_id);
CREATE INDEX idx_module_instances_company ON module_instances(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX idx_module_instances_user ON module_instances(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_module_instances_status ON module_instances(status);

CREATE INDEX idx_module_settings_instance ON module_settings(instance_id);
CREATE INDEX idx_module_hooks_instance ON module_hooks(instance_id);
CREATE INDEX idx_module_hooks_event ON module_hooks(event_name) WHERE is_active = true;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- modules: Public read, admin write
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "modules_read_all" ON modules
  FOR SELECT
  USING (true); -- Everyone can read available modules

CREATE POLICY "modules_write_admin" ON modules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- module_instances: Users can see their own instances
ALTER TABLE module_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "module_instances_read_own" ON module_instances
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "module_instances_write_own" ON module_instances
  FOR ALL
  USING (
    user_id = auth.uid() OR
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
      AND profiles.role IN ('company_admin', 'super_admin')
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- module_settings: Same as instances
ALTER TABLE module_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "module_settings_read_instance" ON module_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM module_instances
      WHERE module_instances.id = module_settings.instance_id
      AND (
        module_instances.user_id = auth.uid() OR
        module_instances.company_id IN (
          SELECT company_id FROM profiles
          WHERE id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'super_admin'
        )
      )
    )
  );

CREATE POLICY "module_settings_write_instance" ON module_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM module_instances
      WHERE module_instances.id = module_settings.instance_id
      AND (
        module_instances.user_id = auth.uid() OR
        (module_instances.company_id IN (
          SELECT company_id FROM profiles
          WHERE id = auth.uid()
          AND profiles.role IN ('company_admin', 'super_admin')
        )) OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'super_admin'
        )
      )
    )
  );

-- module_hooks: Same as instances
ALTER TABLE module_hooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "module_hooks_read_instance" ON module_hooks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM module_instances
      WHERE module_instances.id = module_hooks.instance_id
      AND (
        module_instances.user_id = auth.uid() OR
        module_instances.company_id IN (
          SELECT company_id FROM profiles
          WHERE id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'super_admin'
        )
      )
    )
  );

CREATE POLICY "module_hooks_write_instance" ON module_hooks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM module_instances
      WHERE module_instances.id = module_hooks.instance_id
      AND (
        module_instances.user_id = auth.uid() OR
        (module_instances.company_id IN (
          SELECT company_id FROM profiles
          WHERE id = auth.uid()
          AND profiles.role IN ('company_admin', 'super_admin')
        )) OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'super_admin'
        )
      )
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_modules_updated_at
  BEFORE UPDATE ON modules
  FOR EACH ROW
  EXECUTE FUNCTION update_modules_updated_at();

CREATE TRIGGER update_module_settings_updated_at
  BEFORE UPDATE ON module_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_modules_updated_at();

-- Update install count when instance is created/deleted
CREATE OR REPLACE FUNCTION update_module_install_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE modules
    SET install_count = install_count + 1
    WHERE id = NEW.module_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE modules
    SET install_count = GREATEST(install_count - 1, 0)
    WHERE id = OLD.module_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_module_install_count_trigger
  AFTER INSERT OR DELETE ON module_instances
  FOR EACH ROW
  EXECUTE FUNCTION update_module_install_count();

-- ============================================
-- SEED DATA (Core Modules)
-- ============================================

-- Core modules that are always available
INSERT INTO modules (name, slug, description, type, category, is_official, is_featured, version, author) VALUES
  ('Odoo Project Management', 'odoo-project-management', 'Core Odoo project management features', 'core', 'business', true, true, '1.0.0', 'Platform Team'),
  ('Discovery & Analysis', 'discovery-analysis', 'Company discovery and analysis tools', 'core', 'analytics', true, true, '1.0.0', 'Platform Team'),
  ('Customer Portal', 'customer-portal', 'Customer self-service portal', 'core', 'business', true, true, '1.0.0', 'Platform Team'),
  ('Support System', 'support-system', 'Customer support ticket system', 'core', 'business', true, true, '1.0.0', 'Platform Team'),
  ('Template Library', 'template-library', 'Project template library', 'core', 'productivity', true, true, '1.0.0', 'Platform Team'),
  ('Calendar & Communication', 'calendar-communication', 'Calendar sync and communication tools', 'core', 'productivity', true, true, '1.0.0', 'Platform Team'),
  ('Document Library', 'document-library', 'Document management system', 'core', 'productivity', true, true, '1.0.0', 'Platform Team'),
  ('Training Materials', 'training-materials', 'Training and onboarding materials', 'core', 'productivity', true, true, '1.0.0', 'Platform Team'),
  ('AI Chatbot', 'ai-chatbot', '7/24 AI assistant', 'core', 'productivity', true, true, '1.0.0', 'Platform Team'),
  ('Activity Logs', 'activity-logs', 'System activity tracking', 'core', 'analytics', true, false, '1.0.0', 'Platform Team');

