-- Fix template_deployments.template_id type mismatch
-- template_deployments.template_id is UUID but should be TEXT to match template_library.template_id

-- Step 1: Delete existing deployments (they have wrong template_id format anyway)
-- These deployments were created with UUID template_id which doesn't match template_library
DELETE FROM template_deployments;

-- Step 2: Drop the old UUID column
ALTER TABLE template_deployments 
  DROP COLUMN IF EXISTS template_id;

-- Step 3: Add new TEXT column
ALTER TABLE template_deployments 
  ADD COLUMN template_id TEXT NOT NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_deployments_template_id ON template_deployments(template_id);

-- Add comment
COMMENT ON COLUMN template_deployments.template_id IS 'Template identifier from template_library (e.g., kickoff-mobilya-v1)';

