-- 🔍 DEBUG: REVISAR POLÍTICAS RLS ACTUALES
-- Diagnosticar por qué los usuarios autenticados no pueden leer datos

-- ===============================================
-- PASO 1: VERIFICAR POLÍTICAS EN USUARIOS
-- ===============================================

SELECT 
  '👥 USERS TABLE POLICIES' as category,
  policyname as policy_name,
  cmd as command,
  qual as policy_condition,
  with_check as with_check_condition
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'

UNION ALL

-- ===============================================
-- PASO 2: VERIFICAR POLÍTICAS EN PROYECTOS  
-- ===============================================

SELECT 
  '📋 PROJECTS TABLE POLICIES' as category,
  policyname as policy_name,
  cmd as command,
  qual as policy_condition,
  with_check as with_check_condition
FROM pg_policies 
WHERE tablename = 'projects' AND schemaname = 'public'

UNION ALL

-- ===============================================
-- PASO 3: VERIFICAR POLÍTICAS EN DELIVERIES
-- ===============================================

SELECT 
  '📦 DELIVERIES TABLE POLICIES' as category,
  policyname as policy_name,
  cmd as command,
  qual as policy_condition,
  with_check as with_check_condition
FROM pg_policies 
WHERE tablename = 'deliveries' AND schemaname = 'public'

UNION ALL

-- ===============================================
-- PASO 4: VERIFICAR SI RLS ESTÁ HABILITADO
-- ===============================================

SELECT 
  '🔒 RLS STATUS' as category,
  tablename as policy_name,
  CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as command,
  '' as policy_condition,
  '' as with_check_condition
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public' 
  AND t.tablename IN ('users', 'projects', 'deliveries')
  
ORDER BY category, policy_name;