-- ============================================
-- DEPLOYMENT DETAYLARI KONTROL SORGULARI
-- ============================================

-- 1. Son başarılı deployment'ın detaylı sonuçları
SELECT 
  td.id as deployment_id,
  td.template_id,
  td.template_type,
  td.status,
  td.progress,
  td.current_step,
  td.result,  -- Bu JSONB kolonunda modüller, custom fields, workflows vb. bilgiler var
  td.started_at,
  td.completed_at,
  td.duration_seconds,
  tl.name as template_name,
  oi.instance_url,
  c.name as company_name
FROM template_deployments td
LEFT JOIN template_library tl ON td.template_id = tl.id
LEFT JOIN odoo_instances oi ON td.instance_id = oi.id
LEFT JOIN companies c ON oi.company_id = c.id
WHERE td.status = 'success'
ORDER BY td.created_at DESC
LIMIT 1;

-- 2. Deployment result'ı detaylı görüntüleme (JSON formatında)
-- result kolonunda şunlar olmalı:
-- {
--   "modules": [...],           // Kurulan modüller
--   "customFields": [...],     // Oluşturulan custom field'lar
--   "workflows": [...],        // Oluşturulan workflow'lar
--   "dashboards": [...]        // Oluşturulan dashboard'lar
-- }
SELECT 
  id,
  template_type,
  result->'modules' as modules,
  result->'customFields' as custom_fields,
  result->'workflows' as workflows,
  result->'dashboards' as dashboards
FROM template_deployments
WHERE status = 'success'
ORDER BY created_at DESC
LIMIT 1;

-- 3. Kurulan modüllerin listesi
SELECT 
  jsonb_array_elements(result->'modules') as module_info
FROM template_deployments
WHERE status = 'success'
  AND result->'modules' IS NOT NULL
ORDER BY created_at DESC
LIMIT 1;

-- 4. Oluşturulan custom field'ların listesi
SELECT 
  jsonb_array_elements(result->'customFields') as custom_field_info
FROM template_deployments
WHERE status = 'success'
  AND result->'customFields' IS NOT NULL
ORDER BY created_at DESC
LIMIT 1;

-- 5. Deployment logları (eğer varsa)
SELECT 
  level,
  message,
  details,
  created_at
FROM deployment_logs
WHERE deployment_id = (
  SELECT id 
  FROM template_deployments 
  WHERE status = 'success'
  ORDER BY created_at DESC 
  LIMIT 1
)
ORDER BY created_at ASC;

-- 6. Template kullanım istatistikleri
SELECT 
  tl.template_id,
  tl.name,
  tl.type,
  tl.usage_count,
  COUNT(td.id) as deployment_count,
  SUM(CASE WHEN td.status = 'success' THEN 1 ELSE 0 END) as success_count,
  SUM(CASE WHEN td.status = 'failed' THEN 1 ELSE 0 END) as failed_count
FROM template_library tl
LEFT JOIN template_deployments td ON tl.id = td.template_id
GROUP BY tl.template_id, tl.name, tl.type, tl.usage_count
ORDER BY tl.usage_count DESC;












