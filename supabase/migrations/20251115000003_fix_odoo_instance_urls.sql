-- Fix Odoo instance URLs with trailing/leading whitespace
-- This migration trims whitespace from instance_url and instance_name fields

UPDATE odoo_instances
SET 
  instance_url = TRIM(instance_url),
  instance_name = TRIM(instance_name)
WHERE 
  instance_url != TRIM(instance_url) 
  OR instance_name != TRIM(instance_name);

-- Also fix companies table if needed
UPDATE companies
SET 
  odoo_instance_url = TRIM(odoo_instance_url)
WHERE 
  odoo_instance_url IS NOT NULL 
  AND odoo_instance_url != TRIM(odoo_instance_url);

-- Add a comment
COMMENT ON COLUMN odoo_instances.instance_url IS 'Odoo instance URL (should not contain leading/trailing whitespace)';













