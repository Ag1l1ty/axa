-- 🔍 VERIFICAR DATOS EN SUPABASE - VERSION SIMPLE
-- Ejecutar cada consulta por separado

-- USUARIOS
SELECT 'USERS' as table_info, count(*)::text as total FROM public.users;

-- PROYECTOS  
SELECT 'PROJECTS' as table_info, count(*)::text as total FROM public.projects;

-- DELIVERIES
SELECT 'DELIVERIES' as table_info, count(*)::text as total FROM public.deliveries;