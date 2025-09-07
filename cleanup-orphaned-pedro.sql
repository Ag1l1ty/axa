-- 🧹 LIMPIAR USUARIO PEDRO QUE ESTÁ MAL CREADO

-- 1. Verificar estado actual de Pedro
SELECT 
  'PEDRO IN PUBLIC.USERS' as status,
  id, 
  email, 
  first_name, 
  last_name, 
  role,
  created_at
FROM public.users 
WHERE email = 'pedro.fernandez@agilitychanges.com';

-- 2. Verificar si Pedro existe en auth.users (no debería existir)
SELECT 
  'PEDRO IN AUTH.USERS' as status,
  id,
  email,
  created_at
FROM auth.users 
WHERE email = 'pedro.fernandez@agilitychanges.com';

-- 3. Eliminar Pedro de public.users (está huérfano)
DELETE FROM public.users 
WHERE email = 'pedro.fernandez@agilitychanges.com';

-- 4. Confirmar eliminación
SELECT 
  'CLEANUP RESULT' as status,
  COUNT(*) as pedro_count_in_public
FROM public.users 
WHERE email = 'pedro.fernandez@agilitychanges.com';

SELECT '🧹 Usuario Pedro eliminado de public.users. Ahora puedes crearlo correctamente desde la app.' as result;