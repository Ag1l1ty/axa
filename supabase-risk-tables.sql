-- =====================================================
-- TABLAS PARA RISK ASSESSMENT Y RISK MONITORING
-- Ejecutar estos scripts en el SQL Editor de Supabase
-- =====================================================

-- 1. TABLA RISK ASSESSMENTS (Evaluaciones iniciales de riesgo)
-- =====================================================
CREATE TABLE risk_assessments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    assessed_by VARCHAR(100) NOT NULL, -- Usuario que hizo la evaluación
    assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Respuestas del formulario
    team_experience VARCHAR(20) NOT NULL CHECK (team_experience IN ('high', 'medium', 'low')),
    axa_knowledge VARCHAR(20) NOT NULL CHECK (axa_knowledge IN ('high', 'medium', 'low')),
    technical_uncertainty VARCHAR(20) NOT NULL CHECK (technical_uncertainty IN ('low', 'medium', 'high')),
    technology_maturity VARCHAR(20) NOT NULL CHECK (technology_maturity IN ('stable', 'recent', 'emerging')),
    external_dependencies VARCHAR(20) NOT NULL CHECK (external_dependencies IN ('low', 'medium', 'high')),
    organizational_complexity VARCHAR(20) NOT NULL CHECK (organizational_complexity IN ('low', 'medium', 'high')),
    
    -- Resultados calculados
    risk_score DECIMAL(5,2) NOT NULL,
    risk_level VARCHAR(50) NOT NULL,
    potential_deviation VARCHAR(100),
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA RISK MONITORING (Valoración de riesgo por delivery)
-- =====================================================
CREATE TABLE risk_monitoring (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    risk_assessment_id UUID NOT NULL REFERENCES risk_assessments(id) ON DELETE CASCADE,
    project_id VARCHAR(50) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    delivery_id VARCHAR(50) NOT NULL, -- REQUERIDO: Cada monitoring es por delivery específica
    monitored_by VARCHAR(100) NOT NULL, -- Usuario que hizo el monitoreo
    monitoring_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Métricas de monitoreo
    timeline_deviation INTEGER, -- Porcentaje de desviación (-100 a 100)
    hours_to_fix INTEGER, -- Horas para arreglar errores
    functional_fit INTEGER, -- Cantidad de ajustes funcionales
    feature_adjustments INTEGER, -- Cambios funcionales post-desarrollo
    block_hours INTEGER, -- Horas de bloqueos
    
    -- Estado de riesgo antes y después
    previous_risk_score DECIMAL(5,2) NOT NULL,
    previous_risk_level VARCHAR(50) NOT NULL,
    new_risk_score DECIMAL(5,2) NOT NULL,
    new_risk_level VARCHAR(50) NOT NULL,
    
    -- Observaciones adicionales
    notes TEXT,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ÍNDICES PARA MEJORAR PERFORMANCE
-- =====================================================
CREATE INDEX idx_risk_assessments_project_id ON risk_assessments(project_id);
CREATE INDEX idx_risk_assessments_date ON risk_assessments(assessment_date);
CREATE INDEX idx_risk_monitoring_assessment_id ON risk_monitoring(risk_assessment_id);
CREATE INDEX idx_risk_monitoring_project_id ON risk_monitoring(project_id);
CREATE INDEX idx_risk_monitoring_delivery_id ON risk_monitoring(delivery_id);
CREATE INDEX idx_risk_monitoring_date ON risk_monitoring(monitoring_date);

-- Constraint único: Un solo monitoring por delivery
CREATE UNIQUE INDEX idx_unique_monitoring_per_delivery ON risk_monitoring(delivery_id);

-- 4. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================
-- Habilitar RLS en las nuevas tablas
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_monitoring ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas las operaciones (temporal - para desarrollo)
CREATE POLICY "Allow all operations on risk_assessments" ON risk_assessments
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on risk_monitoring" ON risk_monitoring
    FOR ALL USING (true) WITH CHECK (true);

-- 5. TRIGGERS PARA ACTUALIZAR updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_risk_assessments_updated_at 
    BEFORE UPDATE ON risk_assessments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_risk_monitoring_updated_at 
    BEFORE UPDATE ON risk_monitoring 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMENTARIOS DE LAS TABLAS
-- =====================================================
COMMENT ON TABLE risk_assessments IS 'Evaluaciones iniciales de riesgo de proyectos (una por proyecto)';
COMMENT ON TABLE risk_monitoring IS 'Valoración de riesgo por delivery específica (una por delivery, múltiples por proyecto)';

COMMENT ON COLUMN risk_assessments.team_experience IS 'Experiencia del equipo: high, medium, low';
COMMENT ON COLUMN risk_assessments.axa_knowledge IS 'Conocimiento del entorno AXA: high, medium, low';
COMMENT ON COLUMN risk_assessments.technical_uncertainty IS 'Incertidumbre técnica: low, medium, high';
COMMENT ON COLUMN risk_assessments.technology_maturity IS 'Madurez tecnológica: stable, recent, emerging';
COMMENT ON COLUMN risk_assessments.external_dependencies IS 'Dependencias externas: low, medium, high';
COMMENT ON COLUMN risk_assessments.organizational_complexity IS 'Complejidad organizacional: low, medium, high';

COMMENT ON COLUMN risk_monitoring.timeline_deviation IS 'Porcentaje de desviación del timeline (-100 a 100)';
COMMENT ON COLUMN risk_monitoring.hours_to_fix IS 'Horas laborables para arreglar errores';
COMMENT ON COLUMN risk_monitoring.functional_fit IS 'Número de ajustes funcionales post-definición';
COMMENT ON COLUMN risk_monitoring.feature_adjustments IS 'Cambios funcionales post-desarrollo';
COMMENT ON COLUMN risk_monitoring.block_hours IS 'Horas de bloqueos laborables';