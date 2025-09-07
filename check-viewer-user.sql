-- 🔍 VERIFICAR USUARIO VIEWER EN SUPABASE
-- Confirmar si el usuario viewer existe y tiene credenciales correctas

-- ===============================================
-- VERIFICAR EN AUTH.USERS
-- ===============================================

SELECT 
  'VIEWER IN AUTH.USERS' as status,
  email,
  created_at,
  email_confirmed_at,
  raw_user_meta_data ->> 'firstName' as first_name,
  raw_user_meta_data ->> 'lastName' as last_name,
  raw_user_meta_data ->> 'role' as role
FROM auth.users 
WHERE email = 'viewer@agilitychanges.com';

-- ===============================================
-- VERIFICAR EN PUBLIC.USERS
-- ===============================================

SELECT 
  'VIEWER IN PUBLIC.USERS' as status,
  email,
  first_name,
  last_name,
  role,
  created_at
FROM public.users 
WHERE email = 'viewer@agilitychanges.com';

-- ===============================================
-- VERIFICAR TODOS LOS USUARIOS @agilitychanges.com
-- ===============================================

SELECT 
  'ALL AGILITY USERS' as status,
  email,
  raw_user_meta_data ->> 'role' as role,
  created_at
FROM auth.users 
WHERE email LIKE '%@agilitychanges.com'
ORDER BY created_at;