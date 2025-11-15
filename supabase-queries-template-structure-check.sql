-- Template structure kontrolü
-- Bu sorgu template_library tablosundaki structure kolonunu kontrol eder

-- 1. Mobilya template'inin structure kolonunu kontrol et
SELECT 
  template_id,
  name,
  type,
  status,
  jsonb_typeof(structure) as structure_type,
  structure->'modules' as modules,
  jsonb_array_length(structure->'modules') as modules_count,
  structure->'customFields' as custom_fields,
  jsonb_array_length(structure->'customFields') as custom_fields_count
FROM template_library
WHERE template_id = 'kickoff-mobilya-v1';

-- 2. Structure kolonunun tamamını görüntüle (ilk 1000 karakter)
SELECT 
  template_id,
  name,
  LEFT(structure::text, 1000) as structure_preview
FROM template_library
WHERE template_id = 'kickoff-mobilya-v1';

-- 3. Son deployment'ın template_id'sini ve template'in structure'ını kontrol et
-- NOT: template_deployments.template_id UUID, template_library.template_id TEXT olduğu için cast gerekiyor
SELECT 
  td.id as deployment_id,
  td.template_id::text as deployment_template_id,
  td.status,
  td.result,
  tl.template_id as library_template_id,
  tl.name as template_name,
  jsonb_typeof(tl.structure) as structure_type,
  jsonb_array_length(tl.structure->'modules') as template_modules_count,
  jsonb_array_length(td.result->'modules') as result_modules_count
FROM template_deployments td
LEFT JOIN template_library tl ON td.template_id::text = tl.template_id
ORDER BY td.created_at DESC
LIMIT 1;

