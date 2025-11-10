-- ============================================
-- DOCUMENTS STORAGE BUCKET
-- ============================================
-- Created: 2025-11-12
-- Description: Dokümanlar için Supabase Storage bucket

-- Create documents bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for documents bucket

-- Users can upload documents to their company folder
CREATE POLICY "Users can upload documents to their company"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view documents in their company
CREATE POLICY "Users can view documents in their company"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM documents d
      WHERE d.file_path = CONCAT('documents/', name)
      AND (
        d.is_public = true
        OR d.company_id IN (
          SELECT company_id FROM profiles
          WHERE profiles.id = auth.uid()
        )
      )
    )
  )
);

-- Users can update documents they uploaded
CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete documents they uploaded
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'company_admin')
      AND profiles.company_id::text = (storage.foldername(name))[1]
    )
  )
);

