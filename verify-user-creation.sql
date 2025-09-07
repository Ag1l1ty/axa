-- 🔍 VERIFICAR ESTADO DEL USUARIO RECIÉN CREADO

-- 1. Verificar en auth.users
SELECT 
  'AUTH USERS' as table_name,
  email,
  email_confirmed_at,
  confirmed_at,
  raw_user_meta_data,
  created_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 5;

-- 2. Verificar en public.users
SELECT 
  'PUBLIC USERS' as table_name,
  email,
  first_name,
  last_name,
  role,
  created_at
FROM public.users 
ORDER BY created_at DESC
LIMIT 5;

-- 3. Verificar sincronización
SELECT 
  'SYNC STATUS' as category,
  au.email,
  CASE 
    WHEN au.email_confirmed_at IS NOT NULL THEN 'CONFIRMED'
    ELSE 'NOT CONFIRMED'
  END as email_status,
  CASE 
    WHEN pu.email IS NOT NULL THEN 'EXISTS IN PUBLIC'
    ELSE 'MISSING FROM PUBLIC'
  END as public_sync_status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC
LIMIT 5;

-- 4. Mostrar metadatos del usuario más reciente
SELECT 
  'LATEST USER METADATA' as category,
  email,
  raw_user_meta_data ->> 'firstName' as firstName,
  raw_user_meta_data ->> 'lastName' as lastName,
  raw_user_meta_data ->> 'role' as role,
  email_confirmed_at,
  confirmation_sent_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 1;