-- ============================================
-- SPRINT 7: AUTO-CONFIGURATION SYSTEM
-- Database Schema Genişletme
-- ============================================

-- Configuration status enum (eğer yoksa oluştur veya genişlet)
-- NOT: user_role enum'una 'consultant' ekleme işlemi 20251114000000_add_consultant_role.sql dosyasında yapılıyor
DO $$ 
BEGIN
  -- Eğer enum yoksa oluştur
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'config_status') THEN
    CREATE TYPE config_status AS ENUM (
      'draft',
      'pending_review',
      'needs_changes',
      'approved',
      'rejected',
      'deployed',
      'archived'
    );
  ELSE
    -- Enum varsa eksik değerleri ekle (eğer yoksa)
    -- NOT: PostgreSQL enum değerleri aynı transaction içinde kullanılamaz
    -- Bu yüzden bu değerler ayrı migration'larda eklenmeli veya
    -- migration'ı manuel olarak ikiye bölmek gerekir
    -- Şimdilik sadece mevcut enum'u kullanıyoruz
    NULL;
  END IF;
END $$;

-- Configuration templates table
CREATE TABLE IF NOT EXISTS configuration_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('model', 'view', 'workflow', 'security', 'report')),
  industry TEXT[], -- Hangi sektörler için uygun
  department_types TEXT[], -- Hangi departmanlar için uygun
  
  -- Template content
  template_config JSONB NOT NULL, -- Template yapısı
  variables JSONB, -- Değişkenler (örn: {department_name: string})
  
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuration versions table
CREATE TABLE IF NOT EXISTS configuration_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_id UUID NOT NULL REFERENCES configurations(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  generated_code TEXT NOT NULL,
  changes_summary TEXT,
  deployed_at TIMESTAMPTZ,
  deployed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(configuration_id, version_number)
);

-- Configuration reviews table
CREATE TABLE IF NOT EXISTS configuration_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_id UUID NOT NULL REFERENCES configurations(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'needs_changes')),
  comments TEXT,
  suggested_changes JSONB,
  reviewed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuration deployments table (deployment tracking)
CREATE TABLE IF NOT EXISTS configuration_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_id UUID NOT NULL REFERENCES configurations(id) ON DELETE CASCADE,
  version_id UUID REFERENCES configuration_versions(id),
  instance_id UUID NOT NULL REFERENCES odoo_instances(id) ON DELETE CASCADE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'success', 'failed', 'rolled_back')),
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_config_templates_category ON configuration_templates(category);
CREATE INDEX IF NOT EXISTS idx_config_templates_industry ON configuration_templates USING GIN(industry);
CREATE INDEX IF NOT EXISTS idx_config_templates_department_types ON configuration_templates USING GIN(department_types);
CREATE INDEX IF NOT EXISTS idx_config_templates_public ON configuration_templates(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_config_templates_rating ON configuration_templates(rating DESC) WHERE rating IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_config_versions_config ON configuration_versions(configuration_id);
CREATE INDEX IF NOT EXISTS idx_config_versions_number ON configuration_versions(configuration_id, version_number DESC);

CREATE INDEX IF NOT EXISTS idx_config_reviews_config ON configuration_reviews(configuration_id);
CREATE INDEX IF NOT EXISTS idx_config_reviews_reviewer ON configuration_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_config_reviews_status ON configuration_reviews(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_config_reviews_created ON configuration_reviews(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_config_deployments_config ON configuration_deployments(configuration_id);
CREATE INDEX IF NOT EXISTS idx_config_deployments_instance ON configuration_deployments(instance_id);
CREATE INDEX IF NOT EXISTS idx_config_deployments_status ON configuration_deployments(status);
CREATE INDEX IF NOT EXISTS idx_config_deployments_created ON configuration_deployments(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE configuration_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuration_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuration_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuration_deployments ENABLE ROW LEVEL SECURITY;

-- Configuration templates policies
DROP POLICY IF EXISTS "Public templates are viewable by everyone" ON configuration_templates;
CREATE POLICY "Public templates are viewable by everyone" ON configuration_templates
  FOR SELECT
  USING (is_public = true OR created_by = auth.uid());

DROP POLICY IF EXISTS "Users can create templates" ON configuration_templates;
CREATE POLICY "Users can create templates" ON configuration_templates
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their own templates" ON configuration_templates;
CREATE POLICY "Users can update their own templates" ON configuration_templates
  FOR UPDATE
  USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their own templates" ON configuration_templates;
CREATE POLICY "Users can delete their own templates" ON configuration_templates
  FOR DELETE
  USING (auth.uid() = created_by);

-- Configuration versions policies
DROP POLICY IF EXISTS "Users can view versions of accessible configurations" ON configuration_versions;
CREATE POLICY "Users can view versions of accessible configurations" ON configuration_versions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM configurations c
      WHERE c.id = configuration_versions.configuration_id
      AND (
        c.company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
      )
    )
  );

DROP POLICY IF EXISTS "Users can create versions" ON configuration_versions;
CREATE POLICY "Users can create versions" ON configuration_versions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM configurations c
      WHERE c.id = configuration_versions.configuration_id
      AND (
        c.company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'consultant'))
      )
    )
  );

-- Configuration reviews policies
DROP POLICY IF EXISTS "Users can view reviews of accessible configurations" ON configuration_reviews;
CREATE POLICY "Users can view reviews of accessible configurations" ON configuration_reviews
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM configurations c
      WHERE c.id = configuration_reviews.configuration_id
      AND (
        c.company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
        OR reviewer_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
      )
    )
  );

DROP POLICY IF EXISTS "Reviewers can create reviews" ON configuration_reviews;
CREATE POLICY "Reviewers can create reviews" ON configuration_reviews
  FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "Reviewers can update their reviews" ON configuration_reviews;
CREATE POLICY "Reviewers can update their reviews" ON configuration_reviews
  FOR UPDATE
  USING (auth.uid() = reviewer_id);

-- Configuration deployments policies
DROP POLICY IF EXISTS "Users can view deployments of accessible instances" ON configuration_deployments;
CREATE POLICY "Users can view deployments of accessible instances" ON configuration_deployments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM odoo_instances oi
      WHERE oi.id = configuration_deployments.instance_id
      AND (
        oi.company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
      )
    )
  );

DROP POLICY IF EXISTS "Users can create deployments" ON configuration_deployments;
CREATE POLICY "Users can create deployments" ON configuration_deployments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM odoo_instances oi
      WHERE oi.id = configuration_deployments.instance_id
      AND (
        oi.company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'consultant'))
      )
    )
  );

DROP POLICY IF EXISTS "Users can update deployments" ON configuration_deployments;
CREATE POLICY "Users can update deployments" ON configuration_deployments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM odoo_instances oi
      WHERE oi.id = configuration_deployments.instance_id
      AND (
        oi.company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'consultant'))
      )
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_configuration_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_configuration_templates_updated_at ON configuration_templates;
CREATE TRIGGER trigger_update_configuration_templates_updated_at
  BEFORE UPDATE ON configuration_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_configuration_templates_updated_at();

-- Calculate deployment duration
CREATE OR REPLACE FUNCTION calculate_configuration_deployment_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_configuration_deployment_duration ON configuration_deployments;
CREATE TRIGGER trigger_calculate_configuration_deployment_duration
  BEFORE INSERT OR UPDATE ON configuration_deployments
  FOR EACH ROW
  EXECUTE FUNCTION calculate_configuration_deployment_duration();

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get latest version of a configuration
CREATE OR REPLACE FUNCTION get_latest_configuration_version(config_id UUID)
RETURNS TABLE (
  id UUID,
  version_number INTEGER,
  generated_code TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cv.id,
    cv.version_number,
    cv.generated_code,
    cv.created_at
  FROM configuration_versions cv
  WHERE cv.configuration_id = config_id
  ORDER BY cv.version_number DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get pending reviews count for a user
CREATE OR REPLACE FUNCTION get_pending_reviews_count(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  review_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO review_count
  FROM configuration_reviews cr
  WHERE cr.reviewer_id = user_id
  AND cr.status = 'pending';
  
  RETURN review_count;
END;
$$ LANGUAGE plpgsql;

