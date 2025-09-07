# Configuración de Supabase con Autenticación

## 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea una nueva cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Anota la URL y la clave anónima del proyecto

## 2. Configurar Autenticación

1. Ve a Authentication > Settings en tu dashboard de Supabase
2. En "Site URL" agrega: `http://localhost:9002` 
3. En "Redirect URLs" agrega: `http://localhost:9002/reset-password`
4. Habilita "Enable email confirmations" si deseas verificación por email

## 2. Configurar variables de entorno

1. Copia `.env.local.example` a `.env.local`
2. Completa las variables con los datos de tu proyecto:

```bash
cp .env.local.example .env.local
```

Edita `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima
```

## 3. Crear las tablas en Supabase

Ve al SQL Editor en tu dashboard de Supabase y ejecuta:

```sql
-- Crear tabla de usuarios
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  avatar TEXT NOT NULL,
  assigned_project_ids TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de proyectos
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  stage TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  risk_score INTEGER,
  budget DECIMAL NOT NULL,
  budget_spent DECIMAL DEFAULT 0,
  projected_deliveries INTEGER,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  owner_id TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_avatar TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de entregas
CREATE TABLE deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  delivery_number INTEGER NOT NULL,
  stage TEXT NOT NULL,
  budget DECIMAL NOT NULL,
  budget_spent DECIMAL,
  estimated_date DATE NOT NULL,
  creation_date DATE NOT NULL,
  last_budget_update DATE,
  owner_id TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_avatar TEXT NOT NULL,
  is_archived BOOLEAN DEFAULT FALSE,
  risk_assessed BOOLEAN DEFAULT FALSE,
  error_count INTEGER DEFAULT 0,
  error_solution_time INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de métricas de proyecto
CREATE TABLE project_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  deliveries INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  budget DECIMAL NOT NULL DEFAULT 0,
  spent DECIMAL NOT NULL DEFAULT 0,
  error_solution_time INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_metrics ENABLE ROW LEVEL SECURITY;

-- Crear políticas básicas (permitir todo por ahora)
CREATE POLICY "Allow all operations" ON users FOR ALL TO anon USING (true);
CREATE POLICY "Allow all operations" ON projects FOR ALL TO anon USING (true);
CREATE POLICY "Allow all operations" ON deliveries FOR ALL TO anon USING (true);
CREATE POLICY "Allow all operations" ON project_metrics FOR ALL TO anon USING (true);
```

## 4. Poblar con datos de prueba (opcional)

```sql
-- Insertar usuarios de ejemplo
INSERT INTO users (first_name, last_name, email, role, avatar) VALUES
('Ana', 'Rodriguez', 'ana@axa.com', 'PM/SM', '/avatars/01.png'),
('Carlos', 'Gomez', 'carlos@axa.com', 'PM/SM', '/avatars/02.png'),
('Maria', 'Lopez', 'maria@axa.com', 'Admin', '/avatars/03.png');

-- Insertar proyectos de ejemplo
INSERT INTO projects (name, description, stage, risk_level, risk_score, budget, budget_spent, projected_deliveries, start_date, end_date, owner_id, owner_name, owner_avatar) VALUES
('Digital Onboarding Platform', 'Development of a new digital onboarding experience for clients.', 'Desarrollo Local', 'Moderado', 10, 500000, 275000, 20, '2024-01-15', '2024-09-30', 'USR-001', 'Ana Rodriguez', '/avatars/01.png'),
('AI-Powered Claims Processing', 'Implementing an AI model to automate insurance claims processing.', 'Ambiente TST', 'Agresivo', 18, 1200000, 950000, 10, '2023-11-01', '2024-12-31', 'USR-002', 'Carlos Gomez', '/avatars/02.png');
```

## 5. Funcionalidades de Autenticación Implementadas

### ✅ Registro de Usuarios
- Formulario con email, contraseña, nombre, rol y foto
- Validación de contraseñas coincidentes
- Creación automática en tabla `users` después del registro

### ✅ Login/Logout
- Página de login: `/login`
- Sesión persistente con auto-refresh
- Logout desde cualquier parte de la app

### ✅ Recuperación de Contraseña
- Botón "¿Olvidaste tu contraseña?" en login
- Email de recuperación automático
- Página de reset: `/reset-password`

### ✅ Gestión de Usuarios Administrativa
- Crear usuarios desde panel de administración
- Los administradores pueden crear usuarios con contraseña
- Edición de usuarios existentes sin cambiar contraseña

### ✅ Context de Autenticación
- Hook `useAuth()` para acceder al usuario actual
- Estado de carga para UI
- Perfil de usuario completo desde tabla `users`

## 6. Usar en la aplicación

La aplicación mantiene la funcionalidad existente pero ahora incluye autenticación completa con Supabase.

### Próximos pasos recomendados:
1. Agregar el `AuthProvider` al layout principal
2. Proteger rutas que requieren autenticación
3. Mostrar datos específicos del usuario logueado
4. Implementar roles y permisos

```typescript
// Para datos
import { getProjects, getDeliveries, createProject } from '@/lib/supabase-data'

// Para autenticación  
import { useAuth } from '@/hooks/use-auth'
import { signUp, signIn, resetPassword } from '@/lib/auth'
```