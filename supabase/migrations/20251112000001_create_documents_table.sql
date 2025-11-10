-- ============================================
-- DOCUMENTS TABLE - Document Library
-- ============================================
-- Created: 2025-11-12
-- Description: Doküman kütüphanesi için tablo

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Document Info
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general', -- 'general', 'training', 'technical', 'user-guide', 'api-docs', 'other'
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Supabase Storage path
  file_size INTEGER, -- bytes
  file_type TEXT, -- 'pdf', 'docx', 'xlsx', 'pptx', 'image', 'video', 'other'
  mime_type TEXT,
  
  -- Metadata
  uploaded_by UUID REFERENCES profiles(id),
  version INTEGER DEFAULT 1,
  is_public BOOLEAN DEFAULT false, -- Public documents visible to all company users
  tags TEXT[], -- Array of tags for search
  
  -- Access Control
  access_level TEXT DEFAULT 'company', -- 'company', 'project', 'private'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_documents_company_id ON documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Super admin: Full access
CREATE POLICY "Super admins have full access to documents"
  ON documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Company admin: Access to own company documents
CREATE POLICY "Company admins access own company documents"
  ON documents FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'company_admin')
    )
  );

-- Company users: Read access to public and company documents
CREATE POLICY "Company users read company documents"
  ON documents FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
    AND (is_public = true OR access_level = 'company')
  );

-- Users can upload documents to their company
CREATE POLICY "Users can upload documents to their company"
  ON documents FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Users can update documents they uploaded
CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'company_admin')
      AND profiles.company_id = documents.company_id
    )
  );

-- Users can delete documents they uploaded
CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'company_admin')
      AND profiles.company_id = documents.company_id
    )
  );

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_updated_at();

