-- Sprint 9: Consultant Calendar, Feedback Loop & Template Customization
-- Migration: 20251115000005_sprint9_schema.sql
-- Description: Creates tables for consultant calendar, meeting requests, template customizations, versioning, feedback, and analytics

-- ============================================================================
-- 1. CONSULTANT CALENDAR
-- ============================================================================

CREATE TABLE IF NOT EXISTS consultant_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  working_hours JSONB NOT NULL DEFAULT '{}',
  availability_slots JSONB NOT NULL DEFAULT '[]',
  privacy_settings JSONB NOT NULL DEFAULT '{
    "show_availability": true,
    "show_details": false,
    "allow_meeting_requests": true,
    "auto_approve": false
  }',
  sync_settings JSONB NOT NULL DEFAULT '{
    "sync_odoo": false,
    "sync_google": false,
    "sync_outlook": false,
    "sync_direction": "bidirectional"
  }',
  timezone TEXT NOT NULL DEFAULT 'Europe/Istanbul',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(consultant_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_consultant_calendar_consultant_id ON consultant_calendar(consultant_id);

-- Comments
COMMENT ON TABLE consultant_calendar IS 'Stores consultant calendar settings and availability';
COMMENT ON COLUMN consultant_calendar.working_hours IS 'Working hours per day of week: {"monday": {"start": "09:00", "end": "18:00"}, ...}';
COMMENT ON COLUMN consultant_calendar.availability_slots IS 'Available time slots: [{"date": "2024-11-20", "start": "10:00", "end": "11:00"}, ...]';
COMMENT ON COLUMN consultant_calendar.privacy_settings IS 'Privacy settings for calendar sharing';

-- ============================================================================
-- 2. MEETING REQUESTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS meeting_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed')),
  meeting_type TEXT NOT NULL CHECK (meeting_type IN ('discovery', 'support', 'review', 'training', 'other')),
  notes TEXT,
  meeting_link TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_meeting_requests_consultant_id ON meeting_requests(consultant_id);
CREATE INDEX IF NOT EXISTS idx_meeting_requests_company_id ON meeting_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_meeting_requests_requested_by ON meeting_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_meeting_requests_status ON meeting_requests(status);
CREATE INDEX IF NOT EXISTS idx_meeting_requests_requested_date ON meeting_requests(requested_date);

-- Comments
COMMENT ON TABLE meeting_requests IS 'Stores meeting requests from companies to consultants';
COMMENT ON COLUMN meeting_requests.status IS 'Request status: pending, approved, rejected, cancelled, completed';

-- ============================================================================
-- 3. TEMPLATE CUSTOMIZATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS template_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT NOT NULL REFERENCES template_library(template_id) ON DELETE CASCADE,
  base_template_id TEXT REFERENCES template_library(template_id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  customizations JSONB NOT NULL DEFAULT '{}',
  version TEXT NOT NULL DEFAULT '1.0.0',
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_template_customizations_template_id ON template_customizations(template_id);
CREATE INDEX IF NOT EXISTS idx_template_customizations_base_template_id ON template_customizations(base_template_id);
CREATE INDEX IF NOT EXISTS idx_template_customizations_created_by ON template_customizations(created_by);
CREATE INDEX IF NOT EXISTS idx_template_customizations_company_id ON template_customizations(company_id);
CREATE INDEX IF NOT EXISTS idx_template_customizations_status ON template_customizations(status);

-- Comments
COMMENT ON TABLE template_customizations IS 'Stores customized versions of templates';
COMMENT ON COLUMN template_customizations.customizations IS 'JSONB structure: {"modules": [...], "custom_fields": [...], "workflows": [...], "dashboards": [...]}';
COMMENT ON COLUMN template_customizations.version IS 'Semantic version: major.minor.patch (e.g., 1.0.0)';

-- ============================================================================
-- 4. TEMPLATE VERSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT NOT NULL REFERENCES template_library(template_id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  changelog TEXT,
  structure JSONB NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(template_id, version)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_template_versions_template_id ON template_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_template_versions_is_current ON template_versions(template_id, is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_template_versions_created_at ON template_versions(template_id, created_at DESC);

-- Comments
COMMENT ON TABLE template_versions IS 'Stores version history of templates';
COMMENT ON COLUMN template_versions.version IS 'Semantic version: major.minor.patch (e.g., 1.0.0, 1.1.0, 2.0.0)';
COMMENT ON COLUMN template_versions.structure IS 'Full template structure at this version';
COMMENT ON COLUMN template_versions.is_current IS 'Whether this is the current active version';

-- Trigger to ensure only one current version per template
CREATE OR REPLACE FUNCTION ensure_single_current_version()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_current = true THEN
    UPDATE template_versions
    SET is_current = false
    WHERE template_id = NEW.template_id
      AND id != NEW.id
      AND is_current = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_current_version
  BEFORE INSERT OR UPDATE ON template_versions
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_current_version();

-- ============================================================================
-- 5. TEMPLATE FEEDBACK
-- ============================================================================

CREATE TABLE IF NOT EXISTS template_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT NOT NULL REFERENCES template_library(template_id) ON DELETE CASCADE,
  deployment_id UUID REFERENCES template_deployments(id) ON DELETE SET NULL,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  issues JSONB DEFAULT '[]',
  suggestions JSONB DEFAULT '[]',
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_template_feedback_template_id ON template_feedback(template_id);
CREATE INDEX IF NOT EXISTS idx_template_feedback_deployment_id ON template_feedback(deployment_id);
CREATE INDEX IF NOT EXISTS idx_template_feedback_company_id ON template_feedback(company_id);
CREATE INDEX IF NOT EXISTS idx_template_feedback_user_id ON template_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_template_feedback_rating ON template_feedback(template_id, rating);
CREATE INDEX IF NOT EXISTS idx_template_feedback_sentiment ON template_feedback(template_id, sentiment);
CREATE INDEX IF NOT EXISTS idx_template_feedback_created_at ON template_feedback(template_id, created_at DESC);

-- Comments
COMMENT ON TABLE template_feedback IS 'Stores feedback from users about template deployments';
COMMENT ON COLUMN template_feedback.issues IS 'Array of issues: [{"type": "error", "description": "...", "severity": "high"}, ...]';
COMMENT ON COLUMN template_feedback.suggestions IS 'Array of suggestions: [{"type": "improvement", "description": "..."}, ...]';
COMMENT ON COLUMN template_feedback.sentiment IS 'Automatically analyzed sentiment: positive, neutral, negative';

-- ============================================================================
-- 6. TEMPLATE ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS template_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT NOT NULL REFERENCES template_library(template_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  avg_rating DECIMAL(3, 2),
  avg_deployment_time_seconds INTEGER,
  total_feedback_count INTEGER NOT NULL DEFAULT 0,
  positive_feedback_count INTEGER NOT NULL DEFAULT 0,
  negative_feedback_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(template_id, date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_template_analytics_template_id ON template_analytics(template_id);
CREATE INDEX IF NOT EXISTS idx_template_analytics_date ON template_analytics(template_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_template_analytics_template_date ON template_analytics(template_id, date);

-- Comments
COMMENT ON TABLE template_analytics IS 'Daily aggregated analytics for templates';
COMMENT ON COLUMN template_analytics.avg_rating IS 'Average rating (1.00 to 5.00)';
COMMENT ON COLUMN template_analytics.avg_deployment_time_seconds IS 'Average deployment time in seconds';

-- ============================================================================
-- 7. UPDATE TRIGGERS
-- ============================================================================

-- Update updated_at timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_consultant_calendar_updated_at
  BEFORE UPDATE ON consultant_calendar
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meeting_requests_updated_at
  BEFORE UPDATE ON meeting_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_template_customizations_updated_at
  BEFORE UPDATE ON template_customizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_template_feedback_updated_at
  BEFORE UPDATE ON template_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_template_analytics_updated_at
  BEFORE UPDATE ON template_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE consultant_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_analytics ENABLE ROW LEVEL SECURITY;

-- Consultant Calendar Policies
CREATE POLICY "Consultants can view own calendar"
  ON consultant_calendar FOR SELECT
  USING (auth.uid() = consultant_id);

CREATE POLICY "Consultants can update own calendar"
  ON consultant_calendar FOR UPDATE
  USING (auth.uid() = consultant_id);

CREATE POLICY "Consultants can insert own calendar"
  ON consultant_calendar FOR INSERT
  WITH CHECK (auth.uid() = consultant_id);

-- Meeting Requests Policies
CREATE POLICY "Users can view meeting requests for their company"
  ON meeting_requests FOR SELECT
  USING (
    auth.uid() = consultant_id OR
    auth.uid() = requested_by OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.company_id = meeting_requests.company_id
    )
  );

CREATE POLICY "Users can create meeting requests"
  ON meeting_requests FOR INSERT
  WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Consultants can update their meeting requests"
  ON meeting_requests FOR UPDATE
  USING (auth.uid() = consultant_id OR auth.uid() = requested_by);

-- Template Customizations Policies
CREATE POLICY "Users can view public customizations or own customizations"
  ON template_customizations FOR SELECT
  USING (
    is_public = true OR
    auth.uid() = created_by OR
    (company_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.company_id = template_customizations.company_id
    ))
  );

CREATE POLICY "Users can create customizations"
  ON template_customizations FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own customizations"
  ON template_customizations FOR UPDATE
  USING (auth.uid() = created_by);

-- Template Versions Policies
CREATE POLICY "Users can view template versions"
  ON template_versions FOR SELECT
  USING (true); -- Public read access

CREATE POLICY "Super admins and consultants can create versions"
  ON template_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'consultant')
    )
  );

-- Template Feedback Policies
CREATE POLICY "Users can view feedback for their company templates"
  ON template_feedback FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.company_id = template_feedback.company_id
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'consultant')
    )
  );

CREATE POLICY "Users can create feedback"
  ON template_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback"
  ON template_feedback FOR UPDATE
  USING (auth.uid() = user_id);

-- Template Analytics Policies
CREATE POLICY "Users can view analytics for their company templates"
  ON template_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM template_library tl
      JOIN template_deployments td ON td.template_id = tl.template_id
      JOIN odoo_instances oi ON oi.id = td.instance_id
      JOIN companies c ON c.id = oi.company_id
      JOIN profiles p ON p.company_id = c.id
      WHERE tl.template_id = template_analytics.template_id
        AND p.id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'consultant')
    )
  );

-- Super admins can insert/update analytics
CREATE POLICY "Super admins can manage analytics"
  ON template_analytics FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

