-- 🔧 CREAR POLÍTICAS RLS CORRECTAS PARA PRODUCCIÓN
-- Permitir lectura universal, controlar escritura por roles

-- ===============================================
-- PASO 1: HABILITAR RLS EN LAS TABLAS
-- ===============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- PASO 2: POLÍTICAS PARA USERS
-- ===============================================

-- LECTURA: Todos los usuarios autenticados pueden leer todos los usuarios
CREATE POLICY "users_read_authenticated" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

-- ESCRITURA: Solo Admin puede gestionar usuarios
CREATE POLICY "users_admin_manage" ON public.users
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'Admin'
    )
  );

-- ===============================================
-- PASO 3: POLÍTICAS PARA PROJECTS
-- ===============================================

-- LECTURA: Todos los usuarios autenticados pueden leer todos los proyectos
CREATE POLICY "projects_read_authenticated" ON public.projects
  FOR SELECT USING (auth.role() = 'authenticated');

-- ESCRITURA: Admin y PM/SM pueden gestionar proyectos
CREATE POLICY "projects_pm_manage" ON public.projects
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('Admin', 'PM/SM')
    )
  );

-- ===============================================
-- PASO 4: POLÍTICAS PARA DELIVERIES
-- ===============================================

-- LECTURA: Todos los usuarios autenticados pueden leer todas las entregas
CREATE POLICY "deliveries_read_authenticated" ON public.deliveries
  FOR SELECT USING (auth.role() = 'authenticated');

-- ESCRITURA: Admin y PM/SM pueden gestionar entregas
CREATE POLICY "deliveries_pm_manage" ON public.deliveries
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('Admin', 'PM/SM')
    )
  );

SELECT '✅ Políticas RLS correctas creadas para producción' as status;

-- ===============================================
-- PASO 5: VERIFICACIÓN FINAL
-- ===============================================

SELECT 
  'POLÍTICAS FINALES' as category,
  tablename,
  policyname,
  cmd as command_type
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'projects', 'deliveries')
ORDER BY tablename, policyname;