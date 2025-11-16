-- ============================================
-- TEMPLATE DEPLOYMENT KONTROL SORGULARI
-- ============================================

-- 1. Son deployment'ın detaylı bilgileri (Hata mesajı dahil)
SELECT 
  td.id,
  td.template_id,
  td.template_type,
  td.status,
  td.progress,
  td.current_step,
  td.error_message,
  td.error_stack,
  td.started_at,
  td.completed_at,
  td.duration_seconds,
  td.result
FROM template_deployments td
ORDER BY td.created_at DESC
LIMIT 1;

-- 2. Son deployment için Odoo instance bilgileri
SELECT 
  oi.id,
  oi.company_id,
  oi.instance_url,
  oi.instance_name,
  oi.database_name,
  oi.version,
  oi.status,
  oi.health_status,
  oi.admin_username,
  c.name as company_name
FROM template_deployments td
JOIN odoo_instances oi ON td.instance_id = oi.id
JOIN companies c ON oi.company_id = c.id
ORDER BY td.created_at DESC
LIMIT 1;

-- 3. Son deployment'ın logları (Hata detayları için)
-- Önce deployment ID'yi alın (yukarıdaki sorgudan)
-- Sonra bu ID'yi kullanın:
SELECT 
  level,
  message,
  details,
  created_at
FROM deployment_logs
WHERE deployment_id = (
  SELECT id 
  FROM template_deployments 
  ORDER BY created_at DESC 
  LIMIT 1
)
ORDER BY created_at ASC;

-- 4. Tüm başarısız deployment'lar
SELECT 
  td.id,
  td.template_type,
  td.status,
  td.error_message,
  td.current_step,
  td.created_at,
  oi.instance_url,
  c.name as company_name
FROM template_deployments td
JOIN odoo_instances oi ON td.instance_id = oi.id
JOIN companies c ON oi.company_id = c.id
WHERE td.status = 'failed'
ORDER BY td.created_at DESC;

-- 5. Deployment istatistikleri
SELECT 
  status,
  COUNT(*) as count,
  AVG(progress) as avg_progress,
  AVG(duration_seconds) as avg_duration_seconds
FROM template_deployments
GROUP BY status;













