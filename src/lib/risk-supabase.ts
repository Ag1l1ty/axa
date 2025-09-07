import { createClient } from '@supabase/supabase-js'

// Cliente Supabase para operaciones de riesgo
const supabaseUrl = 'https://gekizwnlxdywcfebycao.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdla2l6d25seGR5d2NmZWJ5Y2FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4Nzc5ODksImV4cCI6MjA3MjQ1Mzk4OX0.5hqf9hFzwYgLtXKU7dS1EXrzrpAJSyx40VjKblN65KM'

const riskSupabase = createClient(supabaseUrl, supabaseAnonKey)

// =====================================================
// TIPOS PARA RISK ASSESSMENT Y MONITORING
// =====================================================

export interface RiskAssessment {
  id: string
  project_id: string
  assessed_by: string
  assessment_date: string
  team_experience: 'high' | 'medium' | 'low'
  axa_knowledge: 'high' | 'medium' | 'low'
  technical_uncertainty: 'low' | 'medium' | 'high'
  technology_maturity: 'stable' | 'recent' | 'emerging'
  external_dependencies: 'low' | 'medium' | 'high'
  organizational_complexity: 'low' | 'medium' | 'high'
  risk_score: number
  risk_level: string
  potential_deviation?: string
  created_at: string
  updated_at: string
}

export interface RiskMonitoring {
  id: string
  risk_assessment_id: string
  project_id: string
  delivery_id: string // REQUERIDO: Cada monitoring es por delivery específica
  monitored_by: string
  monitoring_date: string
  timeline_deviation?: number
  hours_to_fix?: number
  functional_fit?: number
  feature_adjustments?: number
  block_hours?: number
  previous_risk_score: number
  previous_risk_level: string
  new_risk_score: number
  new_risk_level: string
  notes?: string
  created_at: string
  updated_at: string
}

// =====================================================
// CRUD PARA RISK ASSESSMENTS
// =====================================================

export async function createRiskAssessment(data: {
  project_id: string
  assessed_by: string
  team_experience: 'high' | 'medium' | 'low'
  axa_knowledge: 'high' | 'medium' | 'low'
  technical_uncertainty: 'low' | 'medium' | 'high'
  technology_maturity: 'stable' | 'recent' | 'emerging'
  external_dependencies: 'low' | 'medium' | 'high'
  organizational_complexity: 'low' | 'medium' | 'high'
  risk_score: number
  risk_level: string
  potential_deviation?: string
}): Promise<RiskAssessment | null> {
  try {
    const { data: assessment, error } = await riskSupabase
      .from('risk_assessments')
      .insert(data)
      .select()
      .single()

    if (error) {
      console.error('Error creating risk assessment:', error)
      return null
    }

    return assessment
  } catch (error) {
    console.error('Error connecting to Supabase for risk assessment:', error)
    return null
  }
}

export async function getRiskAssessmentsByProject(projectId: string): Promise<RiskAssessment[]> {
  try {
    const { data: assessments, error } = await riskSupabase
      .from('risk_assessments')
      .select('*')
      .eq('project_id', projectId)
      .order('assessment_date', { ascending: false })

    if (error) {
      console.error('Error fetching risk assessments:', error)
      return []
    }

    return assessments || []
  } catch (error) {
    console.error('Error connecting to Supabase for risk assessments:', error)
    return []
  }
}

export async function getAllRiskAssessments(): Promise<RiskAssessment[]> {
  try {
    const { data: assessments, error } = await riskSupabase
      .from('risk_assessments')
      .select('*')
      .order('assessment_date', { ascending: false })

    if (error) {
      console.error('Error fetching all risk assessments:', error)
      return []
    }

    return assessments || []
  } catch (error) {
    console.error('Error connecting to Supabase for risk assessments:', error)
    return []
  }
}

// =====================================================
// CRUD PARA RISK MONITORING
// =====================================================

export async function createRiskMonitoring(data: {
  risk_assessment_id: string
  project_id: string
  delivery_id: string // REQUERIDO
  monitored_by: string
  timeline_deviation?: number
  hours_to_fix?: number
  functional_fit?: number
  feature_adjustments?: number
  block_hours?: number
  previous_risk_score: number
  previous_risk_level: string
  new_risk_score: number
  new_risk_level: string
  notes?: string
}): Promise<RiskMonitoring | null> {
  try {
    const { data: monitoring, error } = await riskSupabase
      .from('risk_monitoring')
      .insert(data)
      .select()
      .single()

    if (error) {
      console.error('Error creating risk monitoring:', error)
      return null
    }

    return monitoring
  } catch (error) {
    console.error('Error connecting to Supabase for risk monitoring:', error)
    return null
  }
}

export async function getRiskMonitoringByProject(projectId: string): Promise<RiskMonitoring[]> {
  try {
    const { data: monitoring, error } = await riskSupabase
      .from('risk_monitoring')
      .select('*')
      .eq('project_id', projectId)
      .order('monitoring_date', { ascending: false })

    if (error) {
      console.error('Error fetching risk monitoring:', error)
      return []
    }

    return monitoring || []
  } catch (error) {
    console.error('Error connecting to Supabase for risk monitoring:', error)
    return []
  }
}

export async function getAllRiskMonitoring(): Promise<RiskMonitoring[]> {
  try {
    const { data: monitoring, error } = await riskSupabase
      .from('risk_monitoring')
      .select('*')
      .order('monitoring_date', { ascending: false })

    if (error) {
      console.error('Error fetching all risk monitoring:', error)
      return []
    }

    return monitoring || []
  } catch (error) {
    console.error('Error connecting to Supabase for risk monitoring:', error)
    return []
  }
}

// =====================================================
// FUNCIONES DE ANÁLISIS Y REPORTES
// =====================================================

export async function getRiskHistoryByProject(projectId: string): Promise<{
  assessments: RiskAssessment[]
  monitoring: RiskMonitoring[]
}> {
  const [assessments, monitoring] = await Promise.all([
    getRiskAssessmentsByProject(projectId),
    getRiskMonitoringByProject(projectId)
  ])

  return {
    assessments,
    monitoring
  }
}

export async function getRiskTrendsByProject(projectId: string): Promise<{
  date: string
  risk_score: number
  risk_level: string
  type: 'assessment' | 'monitoring'
}[]> {
  const { assessments, monitoring } = await getRiskHistoryByProject(projectId)
  
  const trends = [
    ...assessments.map(a => ({
      date: a.assessment_date,
      risk_score: a.risk_score,
      risk_level: a.risk_level,
      type: 'assessment' as const
    })),
    ...monitoring.map(m => ({
      date: m.monitoring_date,
      risk_score: m.new_risk_score,
      risk_level: m.new_risk_level,
      type: 'monitoring' as const
    }))
  ]

  return trends.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

export async function getDashboardRiskMetrics(): Promise<{
  total_assessments: number
  total_monitoring_events: number
  high_risk_projects: number
  recent_assessments: number
}> {
  try {
    const [assessments, monitoring] = await Promise.all([
      getAllRiskAssessments(),
      getAllRiskMonitoring()
    ])

    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const high_risk_projects = new Set([
      ...assessments.filter(a => ['Agresivo', 'Muy Agresivo'].includes(a.risk_level)).map(a => a.project_id),
      ...monitoring.filter(m => ['Agresivo', 'Muy Agresivo'].includes(m.new_risk_level)).map(m => m.project_id)
    ]).size

    const recent_assessments = assessments.filter(
      a => new Date(a.assessment_date) > oneWeekAgo
    ).length

    return {
      total_assessments: assessments.length,
      total_monitoring_events: monitoring.length,
      high_risk_projects,
      recent_assessments
    }
  } catch (error) {
    console.error('Error getting dashboard risk metrics:', error)
    return {
      total_assessments: 0,
      total_monitoring_events: 0,
      high_risk_projects: 0,
      recent_assessments: 0
    }
  }
}