-- 🔍 VERIFICAR QUE SUPABASE TENGA DATOS REALES
-- Confirmar que las tablas no están vacías

-- ===============================================
-- VERIFICAR USUARIOS
-- ===============================================
SELECT 
  'USERS COUNT' as table_name,
  count(*)::text as total_records,
  string_agg(email, ', ') as sample_data
FROM public.users;

-- ===============================================
-- VERIFICAR PROYECTOS  
-- ===============================================
SELECT 
  'PROJECTS COUNT' as table_name,
  count(*)::text as total_records,
  string_agg(name, ', ') as sample_data
FROM public.projects;

-- ===============================================
-- VERIFICAR DELIVERIES
-- ===============================================
SELECT 
  'DELIVERIES COUNT' as table_name,
  count(*)::text as total_records,
  string_agg(project_name, ', ') as sample_data
FROM public.deliveries;

-- ===============================================
-- VERIFICAR PROJECT METRICS
-- ===============================================
SELECT 
  'PROJECT_METRICS COUNT' as table_name,
  count(*)::text as total_records,
  '' as sample_data
FROM public.project_metrics;