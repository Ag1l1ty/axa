-- Schema SQL para Supabase
-- Ejecutar en SQL Editor de Supabase

-- 1. Crear tabla de usuarios
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'PM/SM', 'Viewer', 'Portfolio Manager')),
  avatar TEXT NOT NULL,
  assigned_project_ids TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear tabla de proyectos
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('Definición', 'Desarrollo Local', 'Ambiente DEV', 'Ambiente TST', 'Ambiente UAT', 'Soporte Productivo', 'Cerrado')),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('Muy conservador', 'Conservador', 'Moderado', 'Moderado - alto', 'Agresivo', 'Muy Agresivo', 'No Assessment')),
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

-- 3. Crear tabla de entregas
CREATE TABLE deliveries (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  delivery_number INTEGER NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('Definición', 'Desarrollo Local', 'Ambiente DEV', 'Ambiente TST', 'Ambiente UAT', 'Soporte Productivo', 'Cerrado')),
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

-- 4. Crear tabla de métricas de proyecto
CREATE TABLE project_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  deliveries INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  budget DECIMAL NOT NULL DEFAULT 0,
  spent DECIMAL NOT NULL DEFAULT 0,
  error_solution_time INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, month)
);

-- 5. Habilitar Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_metrics ENABLE ROW LEVEL SECURITY;

-- 6. Crear políticas básicas (permitir todo por ahora - ajustar según necesidades)
CREATE POLICY "Allow all operations on users" ON users FOR ALL TO anon USING (true);
CREATE POLICY "Allow all operations on projects" ON projects FOR ALL TO anon USING (true);
CREATE POLICY "Allow all operations on deliveries" ON deliveries FOR ALL TO anon USING (true);
CREATE POLICY "Allow all operations on project_metrics" ON project_metrics FOR ALL TO anon USING (true);

-- 7. Insertar datos de ejemplo
INSERT INTO users (id, first_name, last_name, email, role, avatar) VALUES
('user-001', 'Ana', 'Rodriguez', 'ana@axa.com', 'PM/SM', '/avatars/01.png'),
('user-002', 'Carlos', 'Gomez', 'carlos@axa.com', 'PM/SM', '/avatars/02.png'),
('user-003', 'Maria', 'Lopez', 'maria@axa.com', 'Admin', '/avatars/03.png'),
('user-004', 'Juan', 'Perez', 'juan@axa.com', 'Portfolio Manager', '/avatars/04.png');

-- 8. Insertar proyectos de ejemplo
INSERT INTO projects (id, name, description, stage, risk_level, risk_score, budget, budget_spent, projected_deliveries, start_date, end_date, owner_id, owner_name, owner_avatar) VALUES
('PRJ-001', 'Digital Onboarding Platform', 'Development of a new digital onboarding experience for clients.', 'Desarrollo Local', 'Moderado', 10, 500000, 275000, 20, '2024-01-15', '2024-09-30', 'user-001', 'Ana Rodriguez', '/avatars/01.png'),
('PRJ-002', 'AI-Powered Claims Processing', 'Implementing an AI model to automate insurance claims processing.', 'Ambiente TST', 'Agresivo', 18, 1200000, 950000, 10, '2023-11-01', '2024-12-31', 'user-002', 'Carlos Gomez', '/avatars/02.png'),
('PRJ-003', 'Mobile App Redesign', 'Complete redesign of the mobile application with new UX/UI.', 'Ambiente UAT', 'Conservador', 5, 300000, 180000, 15, '2024-03-01', '2024-10-15', 'user-003', 'Maria Lopez', '/avatars/03.png');

-- 9. Insertar métricas de ejemplo para los proyectos
INSERT INTO project_metrics (project_id, month, deliveries, errors, budget, spent, error_solution_time) VALUES
('PRJ-001', 'Jan', 2, 2, 55000, 50000, 3),
('PRJ-001', 'Feb', 3, 1, 55000, 60000, 2),
('PRJ-001', 'Mar', 4, 3, 55000, 52000, 4),
('PRJ-001', 'Apr', 3, 4, 55000, 58000, 5),
('PRJ-001', 'May', 4, 2, 55000, 55000, 3),
('PRJ-001', 'Jun', 2, 1, 55000, 54000, 2),

('PRJ-002', 'Jan', 1, 5, 100000, 110000, 7),
('PRJ-002', 'Feb', 1, 8, 100000, 120000, 9),
('PRJ-002', 'Mar', 1, 6, 100000, 95000, 8),
('PRJ-002', 'Apr', 1, 4, 100000, 105000, 6),
('PRJ-002', 'May', 1, 3, 100000, 98000, 5),
('PRJ-002', 'Jun', 1, 2, 100000, 102000, 4),

('PRJ-003', 'Mar', 2, 1, 50000, 45000, 1),
('PRJ-003', 'Apr', 3, 0, 50000, 48000, 0),
('PRJ-003', 'May', 2, 2, 50000, 47000, 3),
('PRJ-003', 'Jun', 3, 1, 50000, 52000, 2);

-- 10. Insertar algunas entregas de ejemplo
INSERT INTO deliveries (id, project_id, project_name, delivery_number, stage, budget, budget_spent, estimated_date, creation_date, owner_id, owner_name, owner_avatar, error_count, error_solution_time) VALUES
('DLV-001', 'PRJ-001', 'Digital Onboarding Platform', 1, 'Ambiente TST', 25000, 23000, '2024-08-15', '2024-01-20', 'user-001', 'Ana Rodriguez', '/avatars/01.png', 2, 3),
('DLV-002', 'PRJ-001', 'Digital Onboarding Platform', 2, 'Desarrollo Local', 30000, 0, '2024-09-01', '2024-02-01', 'user-001', 'Ana Rodriguez', '/avatars/01.png', 0, 0),
('DLV-003', 'PRJ-002', 'AI-Powered Claims Processing', 1, 'Cerrado', 120000, 125000, '2024-07-30', '2024-01-15', 'user-002', 'Carlos Gomez', '/avatars/02.png', 8, 9),
('DLV-004', 'PRJ-003', 'Mobile App Redesign', 1, 'Ambiente UAT', 60000, 58000, '2024-08-20', '2024-03-10', 'user-003', 'Maria Lopez', '/avatars/03.png', 1, 2);

-- 11. Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON deliveries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_metrics_updated_at BEFORE UPDATE ON project_metrics
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();