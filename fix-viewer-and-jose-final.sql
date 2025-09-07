-- 🔧 SOLUCIONAR PROBLEMAS DE VIEWER Y JOSÉ
-- 1. Resetear password de viewer
-- 2. Corregir rol de José Andrés

-- ===============================================
-- PASO 1: RESETEAR PASSWORD DE VIEWER
-- ===============================================

-- Eliminar el usuario viewer actual y recrearlo
DELETE FROM auth.users WHERE email = 'viewer@agilitychanges.com';
DELETE FROM public.users WHERE email = 'viewer@agilitychanges.com';

SELECT 'Usuario viewer eliminado, crear nuevo en Dashboard con password: ViewNew2024!' as instruction;

-- ===============================================
-- PASO 2: CORREGIR ROL DE JOSÉ ANDRÉS
-- ===============================================

-- Actualizar metadatos en auth.users
UPDATE auth.users 
SET raw_user_meta_data = jsonb_build_object(
  'firstName', 'Jose Andres',
  'lastName', 'Sanchez',
  'role', 'Admin'
)
WHERE email = 'joseandres.sanchez@agilitychanges.com';

-- Sincronizar en public.users
UPDATE public.users 
SET 
  first_name = 'Jose Andres',
  last_name = 'Sanchez',
  role = 'Admin',
  updated_at = now()
WHERE email = 'joseandres.sanchez@agilitychanges.com';

SELECT '✅ José Andrés role fixed to Admin' as jose_status;

-- ===============================================
-- PASO 3: VERIFICACIÓN
-- ===============================================

SELECT 
  'VERIFICATION' as category,
  email,
  raw_user_meta_data ->> 'firstName' as first_name,
  raw_user_meta_data ->> 'lastName' as last_name,
  raw_user_meta_data ->> 'role' as role
FROM auth.users 
WHERE email IN (
  'joseandres.sanchez@agilitychanges.com',
  'viewer@agilitychanges.com'
)
ORDER BY email;

-- ===============================================
-- INSTRUCCIONES FINALES
-- ===============================================

SELECT '📋 INSTRUCCIONES:' as instructions
UNION ALL
SELECT '1. Crear nuevo usuario viewer@agilitychanges.com en Dashboard'
UNION ALL  
SELECT '2. Password: ViewNew2024!'
UNION ALL
SELECT '3. Agregar metadatos: firstName=User, lastName=Viewer, role=Viewer'
UNION ALL
SELECT '4. José Andrés ya tiene rol Admin corregido';