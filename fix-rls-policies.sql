-- 🔧 SOLUCIÓN: AJUSTAR POLÍTICAS RLS PARA ACCESO UNIVERSAL
-- Permitir que todos los usuarios autenticados lean datos
-- Solo diferenciar roles en operaciones de escritura/edición

-- ===============================================
-- PASO 1: ELIMINAR POLÍTICAS RESTRICTIVAS EXISTENTES
-- ===============================================

-- Eliminar políticas en users
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;

-- Eliminar políticas en projects
DROP POLICY IF EXISTS "projects_select_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_update_policy" ON public.projects;

-- Eliminar políticas en deliveries
DROP POLICY IF EXISTS "deliveries_select_policy" ON public.deliveries;
DROP POLICY IF EXISTS "deliveries_insert_policy" ON public.deliveries;
DROP POLICY IF EXISTS "deliveries_update_policy" ON public.deliveries;

SELECT '🗑️ Políticas existentes eliminadas' as status;

-- ===============================================
-- PASO 2: CREAR POLÍTICAS UNIVERSALES DE LECTURA
-- ===============================================

-- USERS: Todos pueden leer, solo Admin puede escribir
CREATE POLICY "users_read_all" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "users_admin_write" ON public.users
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('Admin')
    )
  );

-- PROJECTS: Todos pueden leer, Admin/PM pueden escribir
CREATE POLICY "projects_read_all" ON public.projects
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "projects_pm_write" ON public.projects
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('Admin', 'PM/SM')
    )
  );

-- DELIVERIES: Todos pueden leer, Admin/PM pueden escribir  
CREATE POLICY "deliveries_read_all" ON public.deliveries
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "deliveries_pm_write" ON public.deliveries
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('Admin', 'PM/SM')
    )
  );

-- PROJECT_METRICS: Todos pueden leer, Admin/PM pueden escribir
CREATE POLICY "project_metrics_read_all" ON public.project_metrics
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "project_metrics_pm_write" ON public.project_metrics
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('Admin', 'PM/SM')
    )
  );

SELECT '✅ Nuevas políticas de acceso universal creadas' as status;

-- ===============================================
-- PASO 3: VERIFICAR QUE RLS ESTÉ HABILITADO
-- ===============================================

-- Habilitar RLS si no está habilitado
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_metrics ENABLE ROW LEVEL SECURITY;

SELECT '🔒 RLS habilitado en todas las tablas' as status;

-- ===============================================
-- PASO 4: VERIFICACIÓN FINAL
-- ===============================================

SELECT 
  '📋 RESUMEN DE POLÍTICAS' as category,
  tablename,
  policyname,
  cmd as command_type
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'projects', 'deliveries', 'project_metrics')
ORDER BY tablename, policyname;