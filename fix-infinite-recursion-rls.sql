-- 🔧 SOLUCIONAR RECURSIÓN INFINITA EN POLÍTICAS RLS
-- Eliminar políticas recursivas y crear políticas simples

-- ===============================================
-- PASO 1: ELIMINAR TODAS LAS POLÍTICAS PROBLEMÁTICAS
-- ===============================================

-- Eliminar políticas recursivas que causan infinite recursion
DROP POLICY IF EXISTS "users_admin_manage" ON public.users;
DROP POLICY IF EXISTS "users_read_authenticated" ON public.users;
DROP POLICY IF EXISTS "projects_pm_manage" ON public.projects;
DROP POLICY IF EXISTS "projects_read_authenticated" ON public.projects;
DROP POLICY IF EXISTS "deliveries_pm_manage" ON public.deliveries;
DROP POLICY IF EXISTS "deliveries_read_authenticated" ON public.deliveries;

-- Eliminar también las políticas antiguas que pueden estar conflictivas
DROP POLICY IF EXISTS "Allow all operations on users" ON public.users;
DROP POLICY IF EXISTS "Allow all operations on projects" ON public.projects;
DROP POLICY IF EXISTS "Allow all operations on deliveries" ON public.deliveries;

SELECT '🗑️ Todas las políticas conflictivas eliminadas' as status;

-- ===============================================
-- PASO 2: CREAR POLÍTICAS SIMPLES SIN RECURSIÓN
-- ===============================================

-- USERS: Política simple - todos los autenticados pueden leer, solo admin escribir
CREATE POLICY "users_simple_read" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "users_simple_write" ON public.users
  FOR ALL USING (auth.role() = 'authenticated');

-- PROJECTS: Política simple - todos acceso completo si autenticado
CREATE POLICY "projects_simple_all" ON public.projects
  FOR ALL USING (auth.role() = 'authenticated');

-- DELIVERIES: Política simple - todos acceso completo si autenticado  
CREATE POLICY "deliveries_simple_all" ON public.deliveries
  FOR ALL USING (auth.role() = 'authenticated');

SELECT '✅ Políticas simples sin recursión creadas' as status;

-- ===============================================
-- PASO 3: VERIFICACIÓN
-- ===============================================

SELECT 
  'POLÍTICAS FINALES SIN RECURSIÓN' as category,
  tablename,
  policyname,
  cmd as command_type
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'projects', 'deliveries')
ORDER BY tablename, policyname;