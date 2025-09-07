-- 🔧 DESACTIVAR RLS TEMPORALMENTE PARA TESTING
-- Solo para confirmar que RLS es el problema

-- Deshabilitar RLS temporalmente
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries DISABLE ROW LEVEL SECURITY;

SELECT 'RLS temporalmente deshabilitado para testing' as status;