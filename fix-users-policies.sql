-- 🔧 SOLUCIÓN INMEDIATA: LIMPIAR POLÍTICAS CONFLICTIVAS EN USERS
-- Las políticas específicas están bloqueando la política general

-- ===============================================
-- PASO 1: ELIMINAR POLÍTICAS CONFLICTIVAS
-- ===============================================

-- Eliminar todas las políticas específicas que están causando conflicto
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

SELECT '🗑️ Políticas conflictivas eliminadas de tabla users' as status;

-- ===============================================
-- PASO 2: VERIFICAR QUE LA POLÍTICA GENERAL SIGA ACTIVA
-- ===============================================

-- La política "Allow all operations on users" con true debería seguir activa
-- Si no existe, la creamos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Allow all operations on users'
        AND schemaname = 'public'
    ) THEN
        CREATE POLICY "Allow all operations on users" ON public.users
        FOR ALL USING (true);
        
        RAISE NOTICE 'Política general recreada';
    ELSE
        RAISE NOTICE 'Política general ya existe';
    END IF;
END $$;

-- ===============================================
-- PASO 3: VERIFICACIÓN FINAL
-- ===============================================

SELECT 
  '👥 POLÍTICAS FINALES EN USERS' as category,
  policyname as policy_name,
  cmd as command,
  CASE WHEN qual = 'true' THEN '✅ PERMITE TODO' ELSE qual END as condition
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

SELECT '✅ Limpieza completada. Solo debería quedar la política general.' as status;