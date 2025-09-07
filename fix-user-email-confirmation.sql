-- 🔧 ARREGLAR CONFIRMACIÓN DE EMAIL DEL USUARIO RECIÉN CREADO

-- 1. Confirmar email del usuario más reciente manualmente
UPDATE auth.users 
SET 
  email_confirmed_at = now(),
  confirmed_at = now()
WHERE email_confirmed_at IS NULL 
  AND email = (
    SELECT email 
    FROM auth.users 
    ORDER BY created_at DESC 
    LIMIT 1
  );

-- 2. Verificar que la confirmación se aplicó
SELECT 
  'EMAIL CONFIRMED' as status,
  email,
  email_confirmed_at,
  confirmed_at,
  raw_user_meta_data ->> 'firstName' as firstName,
  raw_user_meta_data ->> 'lastName' as lastName,
  raw_user_meta_data ->> 'role' as role
FROM auth.users 
WHERE email = (
  SELECT email 
  FROM auth.users 
  ORDER BY created_at DESC 
  LIMIT 1
);

-- 3. Verificar sincronización con public.users
SELECT 
  'SYNC CHECK' as status,
  au.email as auth_email,
  pu.email as public_email,
  pu.first_name,
  pu.last_name,
  pu.role,
  CASE 
    WHEN au.email_confirmed_at IS NOT NULL THEN 'CONFIRMED'
    ELSE 'NOT CONFIRMED'
  END as email_status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = (
  SELECT email 
  FROM auth.users 
  ORDER BY created_at DESC 
  LIMIT 1
);

SELECT '✅ Usuario confirmado. Ahora debería poder hacer login.' as result;