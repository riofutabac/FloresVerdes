-- Script para crear usuario de prueba en Supabase
-- Ejecuta esto en el SQL Editor de tu Dashboard de Supabase

-- PASO 1: Primero crea el usuario en Supabase Auth UI
-- Ve a: Authentication > Users > Add User
-- Email: admin@floresverdes.com
-- Password: Admin123!
-- Copia el UUID que se genera

-- PASO 2: Inserta los datos del usuario en la tabla usuarios
-- IMPORTANTE: Reemplaza 'TU_UUID_AQUI' con el UUID real generado en el paso 1

INSERT INTO usuarios (
  id,
  email,
  nombre_completo,
  role,
  estado,
  created_at,
  updated_at
) VALUES (
  'TU_UUID_AQUI', -- ⚠️ Reemplaza con el UUID del usuario de Auth
  'admin@floresverdes.com',
  'Administrador Principal',
  'admin',
  'activo',
  NOW(),
  NOW()
);

-- Ejemplo de otros usuarios de prueba:

-- Usuario Gerente
-- Primero crea en Auth UI: gerente@floresverdes.com / Gerente123!
-- Luego ejecuta:
/*
INSERT INTO usuarios (
  id,
  email,
  nombre_completo,
  role,
  estado,
  created_at,
  updated_at
) VALUES (
  'UUID_DEL_GERENTE', -- ⚠️ Reemplaza con el UUID del usuario de Auth
  'gerente@floresverdes.com',
  'Gerente de Producción',
  'gerente',
  'activo',
  NOW(),
  NOW()
);
*/

-- Usuario Jefe de Calidad
-- Primero crea en Auth UI: jefe.calidad@floresverdes.com / Calidad123!
-- Luego ejecuta:
/*
INSERT INTO usuarios (
  id,
  email,
  nombre_completo,
  role,
  estado,
  created_at,
  updated_at
) VALUES (
  'UUID_DEL_JEFE_CALIDAD', -- ⚠️ Reemplaza con el UUID del usuario de Auth
  'jefe.calidad@floresverdes.com',
  'Jefe de Control de Calidad',
  'jefe_calidad',
  'activo',
  NOW(),
  NOW()
);
*/

-- Para verificar que el usuario se creó correctamente:
SELECT id, email, nombre_completo, role, estado 
FROM usuarios 
WHERE email = 'admin@floresverdes.com';
