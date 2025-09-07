-- 🔍 VERIFICAR POLÍTICAS RLS DESPUÉS DE LA LIMPIEZA
-- Confirmar qué políticas siguen activas

SELECT 
  tablename,
  policyname,
  cmd as command,
  qual as condition
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'projects', 'deliveries')
ORDER BY tablename, policyname;