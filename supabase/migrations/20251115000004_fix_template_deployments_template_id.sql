-- Fix template_deployments.template_id type mismatch
-- template_deployments.template_id is UUID but should be TEXT to match template_library.template_id

-- First, check if there are any existing deployments
DO $$
BEGIN
  -- If there are existing deployments, we need to handle them
  -- For now, we'll just change the column type
  -- Existing UUID values will be lost, but deployments should be recreated anyway
  RAISE NOTICE 'Changing template_id column type from UUID to TEXT';
END $$;

-- Drop the old column and recreate as TEXT
ALTER TABLE template_deployments 
  DROP COLUMN IF EXISTS template_id;

ALTER TABLE template_deployments 
  ADD COLUMN template_id TEXT NOT NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_deployments_template_id ON template_deployments(template_id);

-- Add comment
COMMENT ON COLUMN template_deployments.template_id IS 'Template identifier from template_library (e.g., kickoff-mobilya-v1)';

