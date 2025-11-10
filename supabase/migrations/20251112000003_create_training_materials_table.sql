-- ============================================
-- TRAINING MATERIALS TABLE
-- ============================================
-- Created: 2025-11-12
-- Description: Eğitim materyalleri ve ilerleme takibi

-- Training materials table
CREATE TABLE IF NOT EXISTS training_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Material Info
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general', -- 'general', 'odoo-basics', 'module-specific', 'advanced', 'video', 'documentation'
  type TEXT NOT NULL DEFAULT 'documentation', -- 'documentation', 'video', 'interactive', 'quiz', 'workshop'
  
  -- Content
  content_url TEXT, -- Video URL, document URL, etc.
  duration_minutes INTEGER, -- Estimated duration in minutes
  difficulty_level TEXT DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced'
  
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  tags TEXT[],
  is_required BOOLEAN DEFAULT false, -- Required for all users
  order_index INTEGER DEFAULT 0, -- Display order
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training progress table
CREATE TABLE IF NOT EXISTS training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  training_material_id UUID NOT NULL REFERENCES training_materials(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Progress
  status TEXT NOT NULL DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed', 'skipped'
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  time_spent_minutes INTEGER DEFAULT 0,
  
  -- Completion
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  
  -- Quiz/Assessment
  quiz_score INTEGER, -- 0-100
  quiz_attempts INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one progress record per user per material
  UNIQUE(user_id, training_material_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_training_materials_company_id ON training_materials(company_id);
CREATE INDEX IF NOT EXISTS idx_training_materials_project_id ON training_materials(project_id);
CREATE INDEX IF NOT EXISTS idx_training_materials_category ON training_materials(category);
CREATE INDEX IF NOT EXISTS idx_training_materials_type ON training_materials(type);
CREATE INDEX IF NOT EXISTS idx_training_progress_user_id ON training_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_training_progress_material_id ON training_progress(training_material_id);
CREATE INDEX IF NOT EXISTS idx_training_progress_company_id ON training_progress(company_id);
CREATE INDEX IF NOT EXISTS idx_training_progress_status ON training_progress(status);

-- Enable RLS
ALTER TABLE training_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for training_materials

-- Super admin: Full access
CREATE POLICY "Super admins have full access to training materials"
  ON training_materials FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Company admin: Access to own company materials
CREATE POLICY "Company admins access own company training materials"
  ON training_materials FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'company_admin')
    )
  );

-- Company users: Read access to own company materials
CREATE POLICY "Company users read own company training materials"
  ON training_materials FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- RLS Policies for training_progress

-- Users can view their own progress
CREATE POLICY "Users can view own training progress"
  ON training_progress FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own progress
CREATE POLICY "Users can create own training progress"
  ON training_progress FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own progress
CREATE POLICY "Users can update own training progress"
  ON training_progress FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Company admins can view all progress in their company
CREATE POLICY "Company admins view company training progress"
  ON training_progress FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'company_admin')
    )
  );

-- Update triggers
CREATE OR REPLACE FUNCTION update_training_materials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_training_materials_updated_at
  BEFORE UPDATE ON training_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_training_materials_updated_at();

CREATE OR REPLACE FUNCTION update_training_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  END IF;
  IF NEW.progress_percentage > 0 THEN
    NEW.last_accessed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_training_progress_updated_at
  BEFORE UPDATE ON training_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_training_progress_updated_at();

