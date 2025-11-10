-- ============================================
-- TEMPLATES TABLE
-- ============================================
-- Created: 2025-11-10
-- Description: Odoo konfigürasyon template'leri için tablo

-- Templates table
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT NOT NULL, -- 'furniture', 'defense', 'metal', 'ecommerce', etc.
  
  -- Template Content
  modules JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{name, technical_name, category, config}]
  configurations JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{type, name, code, settings}]
  workflows JSONB DEFAULT '[]'::jsonb, -- [{name, steps, conditions}]
  custom_fields JSONB DEFAULT '[]'::jsonb, -- [{model, field_name, field_type, options}]
  reports JSONB DEFAULT '[]'::jsonb, -- [{name, template, format}]
  
  -- Metadata
  source_company_id UUID REFERENCES companies(id) ON DELETE SET NULL, -- Hangi firmadan alındı
  source_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Usage Stats
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Version Control
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_templates_industry ON templates(industry);
CREATE INDEX idx_templates_is_active ON templates(is_active);
CREATE INDEX idx_templates_source_company ON templates(source_company_id);

-- RLS Policies
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Super admins can do everything
CREATE POLICY "Super admins have full access to templates"
  ON templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Authenticated users can read active templates
CREATE POLICY "Authenticated users can read active templates"
  ON templates
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND is_active = true
  );

-- Users can create templates
CREATE POLICY "Authenticated users can create templates"
  ON templates
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own templates
CREATE POLICY "Users can update own templates"
  ON templates
  FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Template Applications table (hangi template hangi firmaya uygulandı)
CREATE TABLE template_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Application Details
  applied_modules JSONB DEFAULT '[]'::jsonb, -- Hangi modüller uygulandı
  applied_configurations JSONB DEFAULT '[]'::jsonb, -- Hangi konfigürasyonlar uygulandı
  customizations JSONB DEFAULT '{}'::jsonb, -- Template'ten farklılaştırılan kısımlar
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'applying', 'completed', 'failed'
  error_message TEXT,
  
  applied_by UUID REFERENCES profiles(id),
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_template_applications_template ON template_applications(template_id);
CREATE INDEX idx_template_applications_company ON template_applications(company_id);
CREATE INDEX idx_template_applications_status ON template_applications(status);

-- RLS Policies
ALTER TABLE template_applications ENABLE ROW LEVEL SECURITY;

-- Super admins can do everything
CREATE POLICY "Super admins have full access to template applications"
  ON template_applications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Users can read applications for their companies
CREATE POLICY "Users can read applications for their companies"
  ON template_applications
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      company_id IN (
        SELECT company_id FROM profiles
        WHERE profiles.id = auth.uid()
        AND company_id IS NOT NULL
      )
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
      )
    )
  );

-- Users can create applications
CREATE POLICY "Authenticated users can create template applications"
  ON template_applications
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);




