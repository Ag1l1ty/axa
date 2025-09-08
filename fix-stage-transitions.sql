-- Crear tabla stage_transitions que falta en el schema
-- Esta tabla es necesaria para el funcionamiento del Kanban

-- 1. Crear la tabla stage_transitions
CREATE TABLE IF NOT EXISTS stage_transitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_id TEXT NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  from_stage TEXT NOT NULL CHECK (from_stage IN ('Definición', 'Desarrollo Local', 'Ambiente DEV', 'Ambiente TST', 'Ambiente UAT', 'Soporte Productivo', 'Cerrado')),
  to_stage TEXT NOT NULL CHECK (to_stage IN ('Definición', 'Desarrollo Local', 'Ambiente DEV', 'Ambiente TST', 'Ambiente UAT', 'Soporte Productivo', 'Cerrado')),
  transition_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE stage_transitions ENABLE ROW LEVEL SECURITY;

-- 3. Política para que todos los usuarios autenticados puedan insertar
CREATE POLICY "Users can insert stage transitions" ON stage_transitions
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 4. Política para que todos los usuarios autenticados puedan leer
CREATE POLICY "Users can view stage transitions" ON stage_transitions
  FOR SELECT TO authenticated
  USING (true);

-- 5. Política para que usuarios autenticados puedan actualizar
CREATE POLICY "Users can update stage transitions" ON stage_transitions
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. Política para que usuarios autenticados puedan eliminar
CREATE POLICY "Users can delete stage transitions" ON stage_transitions
  FOR DELETE TO authenticated
  USING (true);

-- 7. Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS stage_transitions_delivery_id_idx ON stage_transitions(delivery_id);
CREATE INDEX IF NOT EXISTS stage_transitions_transition_date_idx ON stage_transitions(transition_date);

-- 8. Verificar que la tabla se creó correctamente
SELECT 'stage_transitions table created successfully' as status;