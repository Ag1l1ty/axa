-- 🔧 CORREGIR ROL DE JOSE SANCHEZ QUE APARECE COMO NULL
-- Asignar rol de Admin correctamente

UPDATE auth.users 
SET raw_user_meta_data = jsonb_build_object(
  'firstName', 'Jose',
  'lastName', 'Sanchez',
  'role', 'Admin'
)
WHERE email = 'joseandres.sanchez@agilitychanges.com';

-- Sincronizar también en public.users
UPDATE public.users 
SET 
  first_name = 'Jose',
  last_name = 'Sanchez',
  role = 'Admin',
  updated_at = now()
WHERE email = 'joseandres.sanchez@agilitychanges.com';

-- Verificar corrección
SELECT 
  'JOSE ROLE FIXED' as status,
  email,
  raw_user_meta_data ->> 'role' as role
FROM auth.users 
WHERE email = 'joseandres.sanchez@agilitychanges.com';

SELECT 'José role corrected successfully' as result;