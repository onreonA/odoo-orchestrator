-- ============================================
-- TEMPLATE LIBRARY SYSTEM
-- ============================================
-- Created: 2025-11-15
-- Description: Template library için database schema
-- Sprint: 8

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE template_type AS ENUM (
  'kickoff',
  'bom',
  'workflow',
  'dashboard',
  'configuration',
  'report'
);

CREATE TYPE template_status AS ENUM (
  'draft',
  'published',
  'deprecated',
  'archived'
);

-- ============================================
-- TEMPLATE LIBRARY TABLE
-- ============================================

CREATE TABLE template_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template Identification
  template_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type template_type NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',

  -- Classification
  industry TEXT NOT NULL,
  sub_category TEXT,
  tags TEXT[],

  -- Content
  structure JSONB NOT NULL,
  description TEXT,
  features TEXT[],
  preview_images TEXT[],
  documentation_url TEXT,

  -- Requirements
  required_odoo_modules TEXT[],
  required_odoo_version TEXT DEFAULT '19.0',
  estimated_duration INTEGER, -- gün
  estimated_cost_min DECIMAL(10,2),
  estimated_cost_max DECIMAL(10,2),
  currency TEXT DEFAULT 'TRY',

  -- Source Information
  created_from_company UUID REFERENCES companies(id),
  created_from_company_name TEXT,
  created_by UUID REFERENCES profiles(id),

  -- Status
  status template_status DEFAULT 'draft',
  is_official BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,

  -- Statistics
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2),
  rating DECIMAL(3,2),
  review_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_template_library_type ON template_library(type);
CREATE INDEX idx_template_library_industry ON template_library(industry);
CREATE INDEX idx_template_library_status ON template_library(status);
CREATE INDEX idx_template_library_featured ON template_library(is_featured) WHERE is_featured = true;
CREATE INDEX idx_template_library_rating ON template_library(rating DESC NULLS LAST);
CREATE INDEX idx_template_library_template_id ON template_library(template_id);
CREATE INDEX idx_template_library_tags ON template_library USING GIN(tags);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto update updated_at timestamp
CREATE TRIGGER update_template_library_updated_at
  BEFORE UPDATE ON template_library
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE template_library ENABLE ROW LEVEL SECURITY;

-- Everyone can view published templates
CREATE POLICY "Everyone can view published templates"
  ON template_library FOR SELECT
  USING (status = 'published');

-- Super admins can manage all templates
CREATE POLICY "Super admins manage all templates"
  ON template_library FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Company admins can view and use templates
CREATE POLICY "Company admins can view templates"
  ON template_library FOR SELECT
  USING (status = 'published' OR status = 'draft');

-- Template creators can manage their own templates
CREATE POLICY "Creators can manage own templates"
  ON template_library FOR ALL
  USING (created_by = auth.uid());

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE template_library IS 'Template library - stores all reusable templates for kickoff, BOM, workflows, dashboards, etc.';
COMMENT ON COLUMN template_library.template_id IS 'Unique identifier for the template (e.g., kickoff-mobilya-v1)';
COMMENT ON COLUMN template_library.structure IS 'JSONB structure containing template-specific data (modules, questions, phases, etc.)';
COMMENT ON COLUMN template_library.usage_count IS 'Number of times this template has been used';
COMMENT ON COLUMN template_library.success_rate IS 'Percentage of successful deployments using this template';











