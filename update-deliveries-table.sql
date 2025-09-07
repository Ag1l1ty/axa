-- Script para agregar campos de valoración de riesgo a la tabla deliveries
-- Ejecutar en SQL Editor de Supabase

-- 1. Agregar columnas para almacenar la valoración de riesgo
ALTER TABLE deliveries 
ADD COLUMN IF NOT EXISTS risk_level TEXT CHECK (risk_level IN ('Muy conservador', 'Conservador', 'Moderado', 'Moderado - alto', 'Agresivo', 'Muy Agresivo')),
ADD COLUMN IF NOT EXISTS risk_score INTEGER,
ADD COLUMN IF NOT EXISTS risk_assessment_date TIMESTAMP WITH TIME ZONE;

-- 2. Crear índices para mejorar las consultas
CREATE INDEX IF NOT EXISTS idx_deliveries_risk_assessed ON deliveries(risk_assessed);
CREATE INDEX IF NOT EXISTS idx_deliveries_project_id_risk ON deliveries(project_id, risk_assessed);

-- 3. Comentarios para documentar las columnas
COMMENT ON COLUMN deliveries.risk_assessed IS 'Indica si la entrega ha sido valorada para riesgo';
COMMENT ON COLUMN deliveries.risk_level IS 'Nivel de riesgo asignado a la entrega';
COMMENT ON COLUMN deliveries.risk_score IS 'Puntuación numérica del riesgo (1-20)';
COMMENT ON COLUMN deliveries.risk_assessment_date IS 'Fecha y hora cuando se realizó la valoración de riesgo';

-- 4. Verificar la estructura actualizada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'deliveries' 
AND table_schema = 'public'
ORDER BY ordinal_position;