-- ============================================
-- SPRINT 8.5: Template Structure Kontrolü
-- ============================================
-- Bu sorgu template'lerin project_timeline ve departments yapısını kontrol eder
-- Supabase SQL Editor'de çalıştırın

-- 1. Template'lerin temel bilgileri ve structure kontrolü
SELECT 
  template_id,
  name,
  type,
  status,
  structure->>'companyName' as company_name,
  CASE 
    WHEN structure->'project_timeline' IS NOT NULL THEN '✅ Var'
    ELSE '❌ Yok'
  END as project_timeline_status,
  CASE 
    WHEN structure->'departments' IS NOT NULL THEN '✅ Var'
    ELSE '❌ Yok'
  END as departments_status,
  jsonb_array_length(structure->'project_timeline'->'phases') as phase_count,
  jsonb_array_length(structure->'project_timeline'->'milestones') as milestone_count,
  jsonb_array_length(structure->'departments') as department_count
FROM template_library
WHERE type = 'kickoff'
  AND status = 'published'
ORDER BY created_at DESC;

-- 2. Detaylı structure kontrolü (kickoff-manufacturing-v1 için)
SELECT 
  template_id,
  structure->'project_timeline'->'phases' as phases,
  structure->'project_timeline'->'milestones' as milestones,
  structure->'departments'->0->>'name' as first_department,
  jsonb_array_length(structure->'departments'->0->'tasks') as first_dept_task_count
FROM template_library
WHERE template_id = 'kickoff-manufacturing-v1';

-- 3. Detaylı structure kontrolü (kickoff-mobilya-v1 için)
SELECT 
  template_id,
  structure->'project_timeline'->'phases' as phases,
  structure->'project_timeline'->'milestones' as milestones,
  structure->'departments'->0->>'name' as first_department,
  jsonb_array_length(structure->'departments'->0->'tasks') as first_dept_task_count
FROM template_library
WHERE template_id = 'kickoff-mobilya-v1';

-- 4. Tüm departmanların task sayıları (kickoff-manufacturing-v1)
SELECT 
  jsonb_array_elements(structure->'departments')->>'name' as department_name,
  jsonb_array_length(jsonb_array_elements(structure->'departments')->'tasks') as task_count
FROM template_library
WHERE template_id = 'kickoff-manufacturing-v1';

-- 5. Tüm departmanların task sayıları (kickoff-mobilya-v1)
SELECT 
  jsonb_array_elements(structure->'departments')->>'name' as department_name,
  jsonb_array_length(jsonb_array_elements(structure->'departments')->'tasks') as task_count
FROM template_library
WHERE template_id = 'kickoff-mobilya-v1';


