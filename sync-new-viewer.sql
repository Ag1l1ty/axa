-- 🔄 SINCRONIZAR NUEVO USUARIO VIEWER DESPUÉS DE CREACIÓN
-- Ejecutar DESPUÉS de crear viewer en Dashboard

-- Verificar que viewer existe en auth.users
SELECT 
  'VIEWER IN AUTH' as status,
  email,
  raw_user_meta_data ->> 'role' as role
FROM auth.users 
WHERE email = 'viewer@agilitychanges.com';

-- Sincronizar a public.users (el trigger debería hacerlo automáticamente)
-- Pero por si acaso, forzar inserción
INSERT INTO public.users (
  id, 
  first_name, 
  last_name, 
  email, 
  role, 
  avatar
)
SELECT 
  au.id,
  au.raw_user_meta_data ->> 'firstName',
  au.raw_user_meta_data ->> 'lastName',
  au.email,
  au.raw_user_meta_data ->> 'role',
  '/avatars/01.png'
FROM auth.users au
WHERE au.email = 'viewer@agilitychanges.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.users pu 
    WHERE pu.id = au.id
  );

SELECT '✅ Viewer sincronizado correctamente' as result;