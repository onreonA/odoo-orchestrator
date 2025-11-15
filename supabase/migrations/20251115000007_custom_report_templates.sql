-- Sprint 9: Custom Report Templates
-- Migration: 20251115000007_custom_report_templates.sql
-- Description: Creates table for custom report templates

CREATE TABLE IF NOT EXISTS custom_report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  template_id TEXT NOT NULL REFERENCES template_library(template_id) ON DELETE CASCADE,
  metrics TEXT[] NOT NULL DEFAULT '{}',
  date_range JSONB NOT NULL DEFAULT '{"type": "last_30_days"}',
  include_deployments BOOLEAN NOT NULL DEFAULT true,
  include_feedback BOOLEAN NOT NULL DEFAULT true,
  group_by TEXT CHECK (group_by IN ('day', 'week', 'month')),
  format TEXT NOT NULL DEFAULT 'excel' CHECK (format IN ('pdf', 'excel', 'both')),
  schedule JSONB,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_custom_report_templates_template_id ON custom_report_templates(template_id);
CREATE INDEX IF NOT EXISTS idx_custom_report_templates_created_by ON custom_report_templates(created_by);

-- RLS Policies
ALTER TABLE custom_report_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own report templates"
  ON custom_report_templates FOR SELECT
  USING (created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'consultant')
  ));

CREATE POLICY "Users can create own report templates"
  ON custom_report_templates FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own report templates"
  ON custom_report_templates FOR UPDATE
  USING (created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'consultant')
  ));

CREATE POLICY "Users can delete own report templates"
  ON custom_report_templates FOR DELETE
  USING (created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'consultant')
  ));

-- Trigger for updated_at
CREATE TRIGGER update_custom_report_templates_updated_at
  BEFORE UPDATE ON custom_report_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE custom_report_templates IS 'Stores custom report templates for template analytics';
COMMENT ON COLUMN custom_report_templates.metrics IS 'Array of metric names to include in the report';
COMMENT ON COLUMN custom_report_templates.date_range IS 'Date range configuration: {"type": "last_30_days"} or {"type": "custom", "start_date": "...", "end_date": "..."}';
COMMENT ON COLUMN custom_report_templates.schedule IS 'Schedule configuration for automated reports';


