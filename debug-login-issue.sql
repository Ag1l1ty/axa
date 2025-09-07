-- 🔍 DEBUG COMPLETO DEL PROBLEMA DE LOGIN

-- 1. Verificar usuario en auth.users con todos los campos importantes
SELECT 
  '1. AUTH.USERS STATUS' as section,
  id,
  email,
  encrypted_password IS NOT NULL as has_password,
  email_confirmed_at IS NOT NULL as email_confirmed,
  phone_confirmed_at IS NOT NULL as phone_confirmed,
  confirmed_at IS NOT NULL as confirmed,
  banned_until,
  deleted_at,
  created_at,
  updated_at,
  raw_user_meta_data
FROM auth.users 
WHERE email IN (
  SELECT email FROM auth.users ORDER BY created_at DESC LIMIT 1
)
ORDER BY created_at DESC;

-- 2. Verificar usuario en public.users
SELECT 
  '2. PUBLIC.USERS STATUS' as section,
  id,
  email,
  first_name,
  last_name,
  role,
  created_at,
  updated_at
FROM public.users 
WHERE email IN (
  SELECT email FROM auth.users ORDER BY created_at DESC LIMIT 1
)
ORDER BY created_at DESC;

-- 3. Verificar si hay conflictos de ID
SELECT 
  '3. ID MATCHING CHECK' as section,
  au.id as auth_id,
  pu.id as public_id,
  au.email,
  CASE 
    WHEN au.id = pu.id THEN '✅ IDs MATCH'
    ELSE '❌ ID MISMATCH'
  END as id_status
FROM auth.users au
LEFT JOIN public.users pu ON au.email = pu.email
WHERE au.email IN (
  SELECT email FROM auth.users ORDER BY created_at DESC LIMIT 1
);

-- 4. Verificar que no hay usuarios duplicados
SELECT 
  '4. DUPLICATE CHECK' as section,
  email,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) > 1 THEN '❌ DUPLICATES FOUND'
    ELSE '✅ NO DUPLICATES'
  END as status
FROM auth.users 
WHERE email IN (
  SELECT email FROM auth.users ORDER BY created_at DESC LIMIT 3
)
GROUP BY email
ORDER BY count DESC;

-- 5. Verificar el estado de todos los usuarios recientes
SELECT 
  '5. RECENT USERS OVERVIEW' as section,
  email,
  encrypted_password IS NOT NULL as has_password,
  email_confirmed_at IS NOT NULL as email_confirmed,
  confirmed_at IS NOT NULL as confirmed,
  banned_until IS NOT NULL as is_banned,
  deleted_at IS NOT NULL as is_deleted,
  raw_user_meta_data ->> 'firstName' as first_name,
  raw_user_meta_data ->> 'role' as role,
  created_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 5;

-- 6. Test de contraseña (verificar que está hasheada)
SELECT 
  '6. PASSWORD CHECK' as section,
  email,
  CASE 
    WHEN encrypted_password IS NULL THEN '❌ NO PASSWORD'
    WHEN LENGTH(encrypted_password) < 10 THEN '❌ INVALID PASSWORD HASH'
    ELSE '✅ PASSWORD HASH EXISTS'
  END as password_status,
  LENGTH(encrypted_password) as hash_length
FROM auth.users 
WHERE email IN (
  SELECT email FROM auth.users ORDER BY created_at DESC LIMIT 1
);

SELECT '🔍 DEBUG COMPLETO FINALIZADO' as result;