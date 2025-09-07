-- 🧹 LIMPIAR USUARIO PEDRO DUPLICADO PARA TEST FINAL

-- 1. Verificar estado actual 
SELECT 'PEDRO EN PUBLIC.USERS' as tabla, email, id FROM public.users WHERE email = 'pedro.fernandez@agilitychanges.com';

-- 2. Eliminar Pedro de public.users si existe
DELETE FROM public.users WHERE email = 'pedro.fernandez@agilitychanges.com';

-- 3. Verificar que se eliminó
SELECT 'PEDRO DESPUÉS DE CLEANUP' as estado, COUNT(*) as count FROM public.users WHERE email = 'pedro.fernandez@agilitychanges.com';

SELECT '🧹 Usuario Pedro limpio. Listo para test final.' as resultado;