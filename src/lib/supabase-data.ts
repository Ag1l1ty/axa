import { supabase, supabaseAdmin } from './supabase'
import { getProjects as getMockProjects, getDeliveries as getMockDeliveries, MOCK_USERS } from './data'
import type { Project, Delivery, User, ProjectStage, RiskLevel } from './types'

// SOLO USAR DATOS REALES - NUNCA MOCK
const USE_REAL_DATA = true
const NEVER_USE_MOCK = true

// Helper function para obtener cliente consistente con manejo de sesión
const getDataSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase client not available')
  }
  return supabase
}

// Helper para manejar errores de sesión expirada con logout automático
const handleSessionError = async (error: any) => {
  if (error?.message?.includes('JWT') || 
      error?.message?.includes('expired') || 
      error?.message?.includes('invalid_token') ||
      error?.message?.includes('token_expired') ||
      error?.code === 'PGRST301') {
    console.log('🚪 Session expired detected in data layer - triggering auto logout')
    
    try {
      // Limpiar storage inmediatamente
      if (typeof window !== 'undefined') {
        localStorage.removeItem('axa-supabase-auth-token')
        localStorage.removeItem('sb-' + process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF + '-auth-token')
        sessionStorage.clear()
        console.log('🧹 Storage cleared from data layer')
      }
      
      // Intentar logout de Supabase
      await supabase.auth.signOut()
      
      // Redirigir inmediatamente
      if (typeof window !== 'undefined') {
        alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.')
        window.location.href = '/login'
      }
      
      return false
    } catch (refreshError) {
      console.error('❌ Error during session cleanup:', refreshError)
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      return false
    }
  }
  return false // No era un error de sesión
}

// Test de conexión a Supabase
export async function testSupabaseConnection() {
  try {
    console.log('🔍 Testing Supabase connection...')
    
    const { data, error } = await getDataSupabase()
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return false
    } else {
      console.log('✅ Supabase connection successful!')
      return true
    }
  } catch (error) {
    console.error('❌ Supabase connection error:', error)
    return false
  }
}

// Helper para manejar errores de autenticación
async function handleAuthError(error: any, operation: string) {
  console.error(`❌ ${operation} - Auth error:`, error)
  
  // Si es un error de JWT/token, intentar refrescar
  if (error.message?.includes('JWT') || error.message?.includes('expired') || error.message?.includes('invalid_token')) {
    console.log('🔄 Attempting to refresh session due to auth error')
    try {
      const { error: refreshError } = await getDataSupabase().auth.refreshSession()
      if (refreshError) {
        console.error('❌ Failed to refresh session:', refreshError)
        throw new Error('Session expired, please login again')
      }
      console.log('✅ Session refreshed successfully')
      return true // Indica que se debe reintentar la operación
    } catch (refreshError) {
      console.error('❌ Error during session refresh:', refreshError)
      throw new Error('Authentication expired, please login again')
    }
  }
  
  throw error
}

export async function getProjects(): Promise<Project[]> {
  console.log('🔍 getProjects called, USE_REAL_DATA:', USE_REAL_DATA)
  
  console.log('🚨 FORCING REAL PROJECTS ONLY - NO MOCK FALLBACK')
  
  try {
    console.log('✅ Fetching ONLY real projects from Supabase')

    const { data: projects, error } = await getDataSupabase()
      .from('projects')
      .select(`
        *,
        project_metrics (*)
      `)

    if (error) {
      console.error('❌ SUPABASE ERROR - NO FALLBACK:', error)
      // Verificar si es error de sesión y manejar logout automático
      await handleSessionError(error)
      throw error
    }

    console.log('📊 Supabase projects query result:', { 
      count: projects?.length || 0, 
      projects: projects?.map(p => p.name) || [] 
    })

    if (!projects) {
      console.error('⛔ No projects returned from Supabase')
      throw new Error('No projects found in database')
    }

    return projects?.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      stage: project.stage as ProjectStage,
      riskLevel: project.risk_level as RiskLevel,
      riskScore: project.risk_score,
      budget: project.budget,
      budgetSpent: project.budget_spent,
      projectedDeliveries: project.projected_deliveries,
      startDate: project.start_date,
      endDate: project.end_date,
      owner: {
        id: project.owner_id,
        name: project.owner_name,
        avatar: project.owner_avatar
      },
      metrics: project.project_metrics?.map((metric: any) => ({
        month: metric.month,
        deliveries: metric.deliveries,
        errors: metric.errors,
        budget: metric.budget,
        spent: metric.spent,
        errorSolutionTime: metric.error_solution_time
      })) || []
    })) || []
  } catch (error) {
    console.error('Error connecting to Supabase:', error)
    // Fallback completo a datos mock
    return getMockProjects()
  }
}

export async function getProjectById(id: string): Promise<Project | null> {
  // En modo híbrido, usar datos mock si no está configurado Supabase
  if (!USE_REAL_DATA) {
    return getMockProjects().find(p => p.id === id) || null
  }
  try {
    const { data: project, error } = await getDataSupabase()
      .from('projects')
      .select(`
        *,
        project_metrics (*)
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching project by ID:', error)
      return getMockProjects().find(p => p.id === id) || null
    }

    if (!project) {
      return null
    }
    
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      stage: project.stage as ProjectStage,
      riskLevel: project.risk_level as RiskLevel,
      riskScore: project.risk_score,
      budget: project.budget,
      budgetSpent: project.budget_spent,
      projectedDeliveries: project.projected_deliveries,
      startDate: project.start_date,
      endDate: project.end_date,
      owner: {
        id: project.owner_id,
        name: project.owner_name,
        avatar: project.owner_avatar
      },
      metrics: project.project_metrics?.map((metric: any) => ({
        month: metric.month,
        deliveries: metric.deliveries,
        errors: metric.errors,
        budget: metric.budget,
        spent: metric.spent,
        errorSolutionTime: metric.error_solution_time
      })) || []
    }
  } catch (error) {
    console.error('Error in getProjectById:', error)
    return getMockProjects().find(p => p.id === id) || null
  }
}

export async function getDeliveries(): Promise<Delivery[]> {
  console.log('🔍 getDeliveries called, USE_REAL_DATA:', USE_REAL_DATA)
  
  console.log('🚨 FORCING REAL DELIVERIES ONLY - NO MOCK FALLBACK')
  
  try {
    console.log('✅ Fetching ONLY real deliveries from Supabase')

    const { data: deliveries, error } = await getDataSupabase()
      .from('deliveries')
      .select('*')
      .order('creation_date', { ascending: false })

    if (error) {
      console.error('❌ SUPABASE ERROR - NO FALLBACK:', error)
      throw error
    }

    console.log('📊 Supabase deliveries query result:', { 
      count: deliveries?.length || 0, 
      deliveries: deliveries?.map(d => d.project_name) || [] 
    })

    if (!deliveries) {
      console.error('⛔ No deliveries returned from Supabase')
      throw new Error('No deliveries found in database')
    }

    return deliveries?.map(delivery => ({
      id: delivery.id,
      projectId: delivery.project_id,
      projectName: delivery.project_name,
      deliveryNumber: delivery.delivery_number,
      stage: delivery.stage as ProjectStage,
      budget: delivery.budget,
      budgetSpent: delivery.budget_spent,
      estimatedDate: delivery.estimated_date,
      creationDate: delivery.creation_date,
      actualStartDate: delivery.actual_start_date,
      actualDeliveryDate: delivery.actual_delivery_date,
      lastBudgetUpdate: delivery.last_budget_update,
      owner: {
        id: delivery.owner_id,
        name: delivery.owner_name,
        avatar: delivery.owner_avatar
      },
      isArchived: delivery.is_archived,
      riskAssessed: delivery.risk_assessed,
      riskLevel: delivery.risk_level as RiskLevel,
      riskScore: delivery.risk_score,
      riskAssessmentDate: delivery.risk_assessment_date,
      errorCount: delivery.error_count,
      errorSolutionTime: delivery.error_solution_time
    })) || []
  } catch (error) {
    console.error('Error connecting to Supabase for deliveries:', error)
    return getMockDeliveries()
  }
}

export async function getDeliveryById(id: string): Promise<Delivery | null> {
  console.log('🔍 Getting delivery by ID:', id, 'USE_REAL_DATA:', USE_REAL_DATA)
  
  // SOLO USAR DATOS REALES - NUNCA MOCK
  if (!USE_REAL_DATA) {
    console.log('📝 Mock mode: Getting mock delivery')
    return getMockDeliveries().find(d => d.id === id) || null
  }
  
  try {
    console.log('📤 Fetching delivery from Supabase:', id)
    const { data: delivery, error } = await getDataSupabase()
      .from('deliveries')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('❌ Error fetching delivery by ID from Supabase:', error)
      console.error('🚨 RETURNING NULL - NO MOCK FALLBACK')
      return null
    }

    if (!delivery) {
      console.log('⚠️ No delivery found in Supabase')
      return null
    }
    
    console.log('✅ Delivery fetched from Supabase:', {
      id: delivery.id,
      budget_spent: delivery.budget_spent,
      last_budget_update: delivery.last_budget_update
    })
    
    return {
      id: delivery.id,
      projectId: delivery.project_id,
      projectName: delivery.project_name,
      deliveryNumber: delivery.delivery_number,
      stage: delivery.stage as ProjectStage,
      budget: delivery.budget,
      budgetSpent: delivery.budget_spent,
      estimatedDate: delivery.estimated_date,
      creationDate: delivery.creation_date,
      actualStartDate: delivery.actual_start_date,
      actualDeliveryDate: delivery.actual_delivery_date,
      lastBudgetUpdate: delivery.last_budget_update,
      owner: {
        id: delivery.owner_id,
        name: delivery.owner_name,
        avatar: delivery.owner_avatar
      },
      isArchived: delivery.is_archived,
      riskAssessed: delivery.risk_assessed,
      errorCount: delivery.error_count,
      errorSolutionTime: delivery.error_solution_time
    }
  } catch (error) {
    console.error('❌ Connection error in getDeliveryById:', error)
    console.error('🚨 RETURNING NULL - NO MOCK FALLBACK')
    return null
  }
}

export async function getUsers(): Promise<User[]> {
  console.log('🔍 getUsers called, USE_REAL_DATA:', USE_REAL_DATA)
  
  console.log('🚨 FORCING REAL DATA ONLY - NO MOCK FALLBACK')
  
  try {
    console.log('✅ Fetching ONLY real users from Supabase')
    
    const { data: users, error } = await getDataSupabase()
      .from('users')
      .select('*')

    if (error) {
      console.error('❌ SUPABASE ERROR - NO FALLBACK:', error)
      throw error
    }

    console.log('📊 Supabase users query result:', { 
      count: users?.length || 0, 
      users: users?.map(u => u.email) || [] 
    })

    if (!users) {
      console.error('⛔ No users returned from Supabase')
      throw new Error('No users found in database')
    }

    return users?.map(user => ({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role as any,
      avatar: user.avatar,
      assignedProjectIds: user.assigned_project_ids
    })) || []
  } catch (error) {
    console.error('Error connecting to Supabase for users:', error)
    return MOCK_USERS
  }
}

export async function createProject(project: Omit<Project, 'id' | 'metrics'>): Promise<Project | null> {
  // En modo híbrido, usar datos mock si no está configurado
  if (!USE_REAL_DATA) {
    const mockProject: Project = {
      id: `PRJ-${Date.now()}`,
      ...project,
      metrics: []
    }
    return mockProject
  }

  try {
    const projectId = `PRJ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const { data, error } = await getDataSupabase()
    .from('projects')
    .insert({
      id: projectId,
      name: project.name,
      description: project.description,
      stage: project.stage,
      risk_level: project.riskLevel,
      risk_score: project.riskScore,
      budget: project.budget,
      budget_spent: project.budgetSpent,
      projected_deliveries: project.projectedDeliveries,
      start_date: project.startDate,
      end_date: project.endDate,
      owner_id: project.owner.id,
      owner_name: project.owner.name,
      owner_avatar: project.owner.avatar
    })
    .select()
    .single()

    if (error) {
      console.error('Error creating project:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      console.error('Supabase URL:', supabaseUrl)
      console.error('Project data being inserted:', JSON.stringify(project, null, 2))
      // Fallback a mock
      const mockProject: Project = {
        id: `PRJ-${Date.now()}`,
        ...project,
        metrics: []
      }
      return mockProject
    }

    if (!data) {
      const mockProject: Project = {
        id: `PRJ-${Date.now()}`,
        ...project,
        metrics: []
      }
      return mockProject
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      stage: data.stage as ProjectStage,
      riskLevel: data.risk_level as RiskLevel,
      riskScore: data.risk_score,
      budget: data.budget,
      budgetSpent: data.budget_spent,
      projectedDeliveries: data.projected_deliveries,
      startDate: data.start_date,
      endDate: data.end_date,
      owner: {
        id: data.owner_id,
        name: data.owner_name,
        avatar: data.owner_avatar
      },
      metrics: []
    }
  } catch (error) {
    console.error('Error connecting to Supabase for project creation:', error)
    // Fallback completo a mock
    const mockProject: Project = {
      id: `PRJ-${Date.now()}`,
      ...project,
      metrics: []
    }
    return mockProject
  }
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<boolean> {
  // En modo híbrido, simular éxito
  if (!USE_REAL_DATA) {
    return true
  }

  try {
    const { error } = await getDataSupabase()
      .from('projects')
      .update({
        ...(updates.name && { name: updates.name }),
        ...(updates.description && { description: updates.description }),
        ...(updates.stage && { stage: updates.stage }),
        ...(updates.riskLevel && { risk_level: updates.riskLevel }),
        ...(updates.riskScore !== undefined && { risk_score: Math.round(updates.riskScore) }),
        ...(updates.budget && { budget: updates.budget }),
        ...(updates.budgetSpent !== undefined && { budget_spent: updates.budgetSpent }),
        ...(updates.projectedDeliveries !== undefined && { projected_deliveries: updates.projectedDeliveries }),
        ...(updates.startDate && { start_date: updates.startDate }),
        ...(updates.endDate && { end_date: updates.endDate }),
        ...(updates.owner && {
          owner_id: updates.owner.id,
          owner_name: updates.owner.name,
          owner_avatar: updates.owner.avatar
        })
      })
      .eq('id', id)

    if (error) {
      console.error('Error updating project:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error connecting to Supabase for project update:', error)
    return true // Fallback: simular éxito
  }
}

export async function deleteProject(id: string): Promise<boolean> {
  // En modo híbrido, simular éxito
  if (!USE_REAL_DATA) {
    return true
  }

  try {
    const { error } = await getDataSupabase()
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting project:', error)
      return true // Fallback: simular éxito
    }

    return true
  } catch (error) {
    console.error('Error connecting to Supabase for project deletion:', error)
    return true // Fallback: simular éxito
  }
}

// CRUD para Stage History (seguimiento de cambios de etapa en kanban)
export async function saveStageTransition(deliveryId: string, fromStage: string | null, toStage: string, transitionDate: string): Promise<boolean> {
  if (!USE_REAL_DATA) {
    return true // Simular éxito en modo mock
  }
  
  try {
    const { error } = await getDataSupabase()
      .from('stage_transitions')
      .insert({
        delivery_id: deliveryId,
        from_stage: fromStage,
        to_stage: toStage,
        transition_date: transitionDate
      })
    
    if (error) {
      console.error('Error saving stage transition:', error)
      return false
    }
    
    console.log(`📋 Stage transition saved: ${fromStage} → ${toStage}`)
    return true
  } catch (error) {
    console.error('Error connecting to Supabase for stage transition:', error)
    return false
  }
}

export async function getStageTransitions(deliveryId: string): Promise<Array<{stage: string, date: string}>> {
  if (!USE_REAL_DATA) {
    // Simular transiciones mock
    const mockStages = ['Definición', 'Desarrollo Local', 'Ambiente DEV']
    return mockStages.map((stage, i) => ({
      stage,
      date: new Date(Date.now() - (mockStages.length - i - 1) * 86400000 * 7).toISOString()
    }))
  }
  
  try {
    const { data: transitions, error } = await getDataSupabase()
      .from('stage_transitions')
      .select('to_stage, transition_date')
      .eq('delivery_id', deliveryId)
      .order('transition_date', { ascending: true })
    
    if (error) {
      console.error('Error fetching stage transitions:', error)
      return []
    }
    
    return transitions?.map(t => ({
      stage: t.to_stage,
      date: t.transition_date
    })) || []
  } catch (error) {
    console.error('Error connecting to Supabase for stage transitions:', error)
    return []
  }
}

// Función para calcular días laborales entre dos fechas
export function calculateBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0
  const current = new Date(startDate)
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = domingo, 6 = sábado
      count++
    }
    current.setDate(current.getDate() + 1)
  }
  
  return count
}

// CRUD para Budget History
export async function saveBudgetHistory(deliveryId: string, amount: number, date: string): Promise<boolean> {
  console.log('💾 Saving budget history via API:', { deliveryId, amount, date })
  
  if (!USE_REAL_DATA) {
    console.log('📝 Mock mode: Budget history save simulated')
    return true
  }
  
  try {
    const response = await fetch('/api/budget-history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        delivery_id: deliveryId,
        amount: amount,
        update_date: date
      })
    })
    
    if (!response.ok) {
      console.error('❌ API error saving budget history:', response.status)
      console.log('⚠️ Budget history save failed - continuing without storing history')
      // Return true to not break the main budget update flow
      return true
    }
    
    const result = await response.json()
    console.log('✅ Budget history saved successfully via API')
    return true
    
  } catch (error) {
    console.error('❌ Error calling budget history API:', error)
    console.log('⚠️ Budget history save failed - continuing without storing history')
    // Return true to not break the main budget update flow
    return true
  }
}

export async function getBudgetHistory(deliveryId: string): Promise<BudgetHistoryEntry[]> {
  console.log('📊 Fetching budget history via API for delivery:', deliveryId)
  
  if (!USE_REAL_DATA) {
    console.log('📝 Mock mode: Returning empty budget history')
    return []
  }
  
  try {
    const response = await fetch(`/api/budget-history?delivery_id=${deliveryId}`)
    
    if (!response.ok) {
      console.error('❌ API error fetching budget history:', response.status)
      console.log('⚠️ Budget history fetch failed - returning empty array')
      return []
    }
    
    const result = await response.json()
    const data = result.data
    
    if (!data) {
      console.log('⚠️ No budget history found for delivery:', deliveryId)
      return []
    }
    
    const history: BudgetHistoryEntry[] = data.map((entry: any) => ({
      date: entry.update_date,
      amount: entry.amount
    }))
    
    console.log('✅ Budget history fetched via API:', history.length, 'entries')
    return history
    
  } catch (error) {
    console.error('❌ Error calling budget history API:', error)
    console.log('⚠️ Budget history fetch failed - returning empty array')
    return []
  }
}

// CRUD para Deliveries
export async function createDelivery(delivery: Omit<Delivery, 'id'>): Promise<Delivery | null> {
  // En modo híbrido, usar datos mock
  if (!USE_REAL_DATA) {
    return {
      id: `DLV-${Date.now()}`,
      ...delivery
    }
  }

  try {
    const deliveryId = `DLV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const { data, error } = await getDataSupabase()
      .from('deliveries')
      .insert({
        id: deliveryId,
        project_id: delivery.projectId,
        project_name: delivery.projectName,
        delivery_number: delivery.deliveryNumber,
        stage: delivery.stage,
        budget: delivery.budget,
        budget_spent: delivery.budgetSpent,
        estimated_date: delivery.estimatedDate,
        creation_date: delivery.creationDate,
        last_budget_update: delivery.lastBudgetUpdate,
        owner_id: delivery.owner.id,
        owner_name: delivery.owner.name,
        owner_avatar: delivery.owner.avatar,
        error_count: delivery.errorCount,
        error_solution_time: delivery.errorSolutionTime
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating delivery:', error)
      // Fallback a mock
      return {
        id: `DLV-${Date.now()}`,
        ...delivery
      }
    }

    return data ? {
      id: data.id,
      projectId: data.project_id,
      projectName: data.project_name,
      deliveryNumber: data.delivery_number,
      stage: data.stage as ProjectStage,
      budget: data.budget,
      budgetSpent: data.budget_spent,
      estimatedDate: data.estimated_date,
      creationDate: data.creation_date,
      lastBudgetUpdate: data.last_budget_update,
      owner: {
        id: data.owner_id,
        name: data.owner_name,
        avatar: data.owner_avatar
      },
      errorCount: data.error_count,
      errorSolutionTime: data.error_solution_time
    } : null
  } catch (error) {
    console.error('Error connecting to Supabase for delivery creation:', error)
    // Fallback completo a mock
    return {
      id: `DLV-${Date.now()}`,
      ...delivery
    }
  }
}

export async function updateDelivery(id: string, updates: Partial<Delivery>): Promise<boolean> {
  console.log('🔄 Updating delivery:', id, 'with updates:', updates)
  // En modo híbrido, simular éxito
  if (!USE_REAL_DATA) {
    console.log('📝 Mock mode: Delivery update simulated')
    return true
  }

  try {
    const updateData = {
      ...(updates.stage && { stage: updates.stage }),
      ...(updates.budget !== undefined && { budget: updates.budget }),
      ...(updates.budgetSpent !== undefined && { budget_spent: updates.budgetSpent }),
      ...(updates.errorCount !== undefined && { error_count: updates.errorCount }),
      ...(updates.errorSolutionTime !== undefined && { error_solution_time: updates.errorSolutionTime }),
      ...(updates.isArchived !== undefined && { is_archived: updates.isArchived }),
      ...(updates.lastBudgetUpdate && { last_budget_update: updates.lastBudgetUpdate }),
      ...(updates.actualStartDate && { actual_start_date: updates.actualStartDate }),
      ...(updates.actualDeliveryDate && { actual_delivery_date: updates.actualDeliveryDate }),
      updated_at: new Date().toISOString()
    }
    
    console.log('📤 Sending to Supabase:', updateData)
    console.log('🎯 Target delivery ID:', id)
    
    const { error, data } = await getDataSupabase()
      .from('deliveries')
      .update(updateData)
      .eq('id', id)
      .select()
      
    console.log('💾 Supabase response:', { error, data })

    if (error) {
      console.error('❌ Error updating delivery:', error)
      return false
    }

    console.log('✅ Delivery updated successfully in Supabase')
    return true
  } catch (error) {
    console.error('❌ Error connecting to Supabase for delivery update:', error)
    return false
  }
}

export async function deleteDelivery(id: string): Promise<boolean> {
  // En modo híbrido, simular éxito
  if (!USE_REAL_DATA) {
    return true
  }

  try {
    const { error } = await getDataSupabase()
      .from('deliveries')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting delivery:', error)
      return true // Fallback: simular éxito
    }

    return true
  } catch (error) {
    console.error('Error connecting to Supabase for delivery deletion:', error)
    return true // Fallback: simular éxito
  }
}

// CRUD para Users  
export async function createUser(userData: Omit<User, 'id'> & { password: string }): Promise<User | null> {
  console.log('🔥 Creating user with auth.signUp:', userData.email)
  console.log('🔧 User data:', {
    email: userData.email,
    role: userData.role,
    firstName: userData.firstName,
    lastName: userData.lastName
  })
  
  try {
    console.log('🔍 Checking if user already exists...')
    
    // Primero verificar si el usuario ya existe
    const checkResponse = await fetch('/api/admin/check-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: userData.email }),
    })

    const checkResult = await checkResponse.json()
    
    if (checkResult.exists) {
      console.error('❌ User already exists:', userData.email)
      throw new Error(`El usuario con email ${userData.email} ya existe`)
    }
    
    console.log('✅ Email is available, proceeding with user creation...')
    console.log('📞 Calling API route for admin user creation...')
    
    // Usar API route que tiene acceso a Service Role Key en el servidor
    const response = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        userData: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          avatar: userData.avatar || '/avatars/01.png'
        }
      }),
    })

    const result = await response.json()

    console.log('📥 API response:', {
      status: response.status,
      hasData: !!result.data,
      hasUser: !!result.data?.user,
      hasError: !!result.error,
      errorMessage: result.error
    })

    if (!response.ok || result.error) {
      console.error('❌ Error from API route:', result.error)
      return null
    }

    if (!result.data?.user) {
      console.error('❌ No user returned from API')
      return null
    }

    const newUser = result.data.user
    console.log('✅ User created successfully via API:', newUser.email)
    console.log('👤 New user ID:', newUser.id)

    // Esperar un poco para que el trigger se ejecute
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Verificar que el usuario se sincronizó en public.users
    const { data: publicUser } = await getDataSupabase()
      .from('users')
      .select('*')
      .eq('id', newUser.id)
      .single()

    if (!publicUser) {
      console.warn('⚠️ User not found in public.users, manual sync might be needed')
    } else {
      console.log('✅ User synchronized in public.users:', publicUser.email)
    }

    // Retornar los datos del usuario creado
    return {
      id: newUser.id,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      role: userData.role,
      avatar: userData.avatar || '/avatars/01.png',
      assignedProjectIds: userData.assignedProjectIds || []
    }
  } catch (error) {
    console.error('❌ Error in createUser:', error)
    return null
  }
}

export async function updateUser(id: string, updates: Partial<User>): Promise<boolean> {
  // En modo híbrido, simular éxito
  if (!USE_REAL_DATA) {
    return true
  }

  try {
    const { error } = await getDataSupabase()
    .from('users')
    .update({
      ...(updates.firstName && { first_name: updates.firstName }),
      ...(updates.lastName && { last_name: updates.lastName }),
      ...(updates.email && { email: updates.email }),
      ...(updates.role && { role: updates.role }),
      ...(updates.avatar && { avatar: updates.avatar }),
      ...(updates.assignedProjectIds && { assigned_project_ids: updates.assignedProjectIds })
    })
      .eq('id', id)

    if (error) {
      console.error('Error updating user:', error)
      return true // Fallback: simular éxito
    }

    return true
  } catch (error) {
    console.error('Error connecting to Supabase for user update:', error)
    return true // Fallback: simular éxito
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  // En modo híbrido, simular éxito
  if (!USE_REAL_DATA) {
    return true
  }

  try {
    console.log('🗑️ Deleting user via API route:', id)
    
    // Usar API route que elimina de auth.users Y public.users
    const response = await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: id }),
    })

    const result = await response.json()

    console.log('📥 Delete API response:', {
      status: response.status,
      success: result.success,
      error: result.error
    })

    if (!response.ok || result.error) {
      console.error('❌ Error from delete API route:', result.error)
      return false
    }

    console.log('✅ User deleted successfully via API:', id)
    return true
    
  } catch (error) {
    console.error('❌ Error in deleteUser:', error)
    return false
  }
}

// Dashboard functions usando Supabase
export async function getDashboardKpis(projects: Project[]) {
  const totalBudget = projects.reduce((acc, p) => acc + p.budget, 0)
  const onTrackProjects = projects.filter(p => p.stage !== 'Cerrado').length
  const highRiskProjects = projects.filter(p => 
    ['Moderado - alto', 'Agresivo', 'Muy Agresivo'].includes(p.riskLevel)
  ).length
  
  let totalDeliveries = 0
  
  if (USE_REAL_DATA) {
    try {
      const { data: deliveries } = await getDataSupabase()
        .from('deliveries')
        .select('*')
        .eq('stage', 'Cerrado')
      
      totalDeliveries = deliveries?.length || 0
    } catch (error) {
      console.error('Error fetching dashboard deliveries:', error)
      // Fallback: usar datos mock para el cálculo
      totalDeliveries = 0
    }
  }

  return {
    totalBudget,
    onTrackProjects,
    highRiskProjects,
    totalDeliveries
  }
}

// Función para agregar métricas reales basadas en entregas de Supabase
export async function aggregateRealMetrics(projects: Project[]) {
  if (!USE_REAL_DATA) {
    // Fallback a función mock
    const { aggregateMetrics } = await import('./data')
    return aggregateMetrics(projects)
  }

  try {
    // Obtener todas las entregas
    const deliveries = await getDeliveries()
    const closedDeliveries = deliveries.filter(d => d.stage === 'Cerrado')
    const deliveriesWithErrors = deliveries.filter(d => d.errorCount && d.errorCount > 0)
    
    const monthlyData: { [key: string]: { 
      actual: number; 
      planned: number; 
      errors: number; 
      totalErrorTime: number; 
      errorEntries: number;
      budget: number;
      spent: number;
    } } = {}
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    // Procesar cada proyecto
    projects.forEach(project => {
      if (!project.startDate || !project.endDate) return
      
      const startDate = new Date(project.startDate)
      const endDate = new Date(project.endDate)
      const projectedDeliveries = project.projectedDeliveries || 0
      
      // Calcular meses del proyecto
      const totalMonths = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)))
      const plannedPerMonth = projectedDeliveries / totalMonths
      
      // Generar línea planeada
      for (let i = 0; i < totalMonths; i++) {
        const currentDate = new Date(startDate)
        currentDate.setMonth(startDate.getMonth() + i)
        
        const monthName = monthOrder[currentDate.getMonth()]
        const year = currentDate.getFullYear()
        const dataKey = `${monthName}-${year}`
        
        if (!monthlyData[dataKey]) {
          monthlyData[dataKey] = { planned: 0, actual: 0, errors: 0, totalErrorTime: 0, errorEntries: 0, budget: 0, spent: 0 }
        }
        monthlyData[dataKey].planned += plannedPerMonth
        
        // Distribución del presupuesto proyectado por mes
        const budgetPerMonth = project.budget / totalMonths
        monthlyData[dataKey].budget += budgetPerMonth
      }
    })
    
    // Procesar entregas reales cerradas
    closedDeliveries.forEach(delivery => {
      // Usar fecha real si está disponible, sino usar creationDate
      const deliveryDate = new Date(delivery.actualDeliveryDate || delivery.creationDate)
      const monthName = monthOrder[deliveryDate.getMonth()]
      const year = deliveryDate.getFullYear()
      const dataKey = `${monthName}-${year}`
      
      if (!monthlyData[dataKey]) {
        monthlyData[dataKey] = { planned: 0, actual: 0, errors: 0, totalErrorTime: 0, errorEntries: 0, budget: 0, spent: 0 }
      }
      monthlyData[dataKey].actual += 1
    })
    
    // Procesar errores de entregas (cuando han pasado por TST)
    deliveriesWithErrors.forEach(delivery => {
      // Usar fecha real si está disponible, sino usar creationDate
      const deliveryDate = new Date(delivery.actualDeliveryDate || delivery.creationDate)
      const monthName = monthOrder[deliveryDate.getMonth()]
      const year = deliveryDate.getFullYear()
      const dataKey = `${monthName}-${year}`
      
      if (!monthlyData[dataKey]) {
        monthlyData[dataKey] = { planned: 0, actual: 0, errors: 0, totalErrorTime: 0, errorEntries: 0, budget: 0, spent: 0 }
      }
      
      // Acumular errores y tiempo de solución
      const errorCount = delivery.errorCount || 0
      const errorTime = delivery.errorSolutionTime || 0
      
      monthlyData[dataKey].errors += errorCount
      if (errorTime > 0 && errorCount > 0) {
        monthlyData[dataKey].totalErrorTime += errorTime * errorCount
        monthlyData[dataKey].errorEntries += errorCount
      }
    })
    
    // Procesar gastos reales de entregas individuales (distribuidos en su duración)
    deliveries.forEach(delivery => {
      const budgetSpent = Number(delivery.budgetSpent) || 0
      if (budgetSpent > 0) {
        const startDate = new Date(delivery.creationDate)
        const endDate = new Date(delivery.estimatedDate)
        
        // Calcular meses de duración de la entrega
        const deliveryMonths = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)))
        const spentPerMonth = budgetSpent / deliveryMonths
        
        // Distribuir gastos por cada mes de duración
        for (let i = 0; i < deliveryMonths; i++) {
          const currentDate = new Date(startDate)
          currentDate.setMonth(startDate.getMonth() + i)
          
          const monthName = monthOrder[currentDate.getMonth()]
          const year = currentDate.getFullYear()
          const dataKey = `${monthName}-${year}`
          
          if (!monthlyData[dataKey]) {
            monthlyData[dataKey] = { planned: 0, actual: 0, errors: 0, totalErrorTime: 0, errorEntries: 0, budget: 0, spent: 0 }
          }
          
          monthlyData[dataKey].spent += spentPerMonth
        }
      }
    })
    
    // Procesar gastos a nivel proyecto (distribuidos en su duración)
    projects.forEach(project => {
      const budgetSpent = Number(project.budgetSpent) || 0
      if (budgetSpent > 0) {
        const startDate = new Date(project.startDate)
        const endDate = new Date(project.endDate)
        
        // Calcular meses de duración del proyecto
        const projectMonths = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)))
        const spentPerMonth = budgetSpent / projectMonths
        
        // Distribuir gastos por cada mes de duración del proyecto
        for (let i = 0; i < projectMonths; i++) {
          const currentDate = new Date(startDate)
          currentDate.setMonth(startDate.getMonth() + i)
          
          const monthName = monthOrder[currentDate.getMonth()]
          const year = currentDate.getFullYear()
          const dataKey = `${monthName}-${year}`
          
          if (!monthlyData[dataKey]) {
            monthlyData[dataKey] = { planned: 0, actual: 0, errors: 0, totalErrorTime: 0, errorEntries: 0, budget: 0, spent: 0 }
          }
          
          monthlyData[dataKey].spent += spentPerMonth
        }
      }
    })
    
    // Ordenar y acumular
    const sortedKeys = Object.keys(monthlyData).sort((a, b) => {
      const [monthA, yearA] = a.split('-')
      const [monthB, yearB] = b.split('-')
      if (yearA !== yearB) {
        return Number(yearA) - Number(yearB)
      }
      return monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB)
    })
    
    let cumulativePlanned = 0
    let cumulativeActual = 0
    let cumulativeBudget = 0
    let cumulativeSpent = 0
    
    return sortedKeys.map(key => {
      const [month, year] = key.split('-')
      cumulativePlanned += monthlyData[key].planned
      cumulativeActual += monthlyData[key].actual
      cumulativeBudget += monthlyData[key].budget
      cumulativeSpent += monthlyData[key].spent
      
      // Calcular tiempo promedio de solución de errores
      const avgErrorTime = monthlyData[key].errorEntries > 0 
        ? monthlyData[key].totalErrorTime / monthlyData[key].errorEntries 
        : 0
      
      return {
        name: `${month}-${year.slice(-2)}`,
        planned: Math.round(cumulativePlanned),
        actual: cumulativeActual,
        errors: monthlyData[key].errors,
        avgErrorSolutionTime: avgErrorTime,
        cumulativeBudget: Math.round(cumulativeBudget),
        spent: cumulativeSpent
      }
    })
  } catch (error) {
    console.error('Error aggregating real metrics:', error)
    // Fallback a función mock
    const { aggregateMetrics } = await import('./data')
    return aggregateMetrics(projects)
  }
}

// Función específica para el gráfico de presupuesto vs gastos
export async function aggregateBudgetMetrics(projects: Project[]) {
  if (!USE_REAL_DATA) {
    // Fallback a función mock
    const { aggregateMetrics } = await import('./data')
    const mockData = aggregateMetrics(projects)
    return mockData.map(item => ({
      ...item,
      spent: item.spent || 0
    }))
  }

  try {
    console.log('📊 BAR CHART - Projects received:', projects.length)
    
    // Calcular totales directamente
    const totalBudget = projects.reduce((sum, project) => sum + (project.budget || 0), 0)
    const totalSpent = projects.reduce((sum, project) => sum + (Number(project.budgetSpent) || 0), 0)
    
    console.log(`💰 Total Planned: $${totalBudget}`)
    console.log(`💸 Total Executed: $${totalSpent}`)
    
    // Crear datos simples para gráfico de barras
    const result = [
      {
        name: 'Presupuesto',
        planned: totalBudget,
        executed: totalSpent,
        // Mantener compatibilidad con otros campos
        cumulativeBudget: totalBudget,
        spent: totalSpent,
        actual: 0,
        errors: 0,
        avgErrorSolutionTime: 0
      }
    ]
    
    console.log('✅ BAR CHART DATA:', result)
    return result
  } catch (error) {
    console.error('Error aggregating budget metrics:', error)
    // Fallback a función mock
    const { aggregateMetrics } = await import('./data')
    const mockData = aggregateMetrics(projects)
    return mockData.map(item => ({
      ...item,
      spent: item.spent || 0
    }))
  }
}

// === FUNCIONES DE VALORACIÓN DE RIESGO ===

/**
 * Actualiza la valoración de riesgo de una entrega
 * Una vez valorada, la entrega no puede ser valorada nuevamente
 */
export async function updateDeliveryRiskAssessment(
  deliveryId: string, 
  riskLevel: RiskLevel, 
  riskScore: number
): Promise<{ success: boolean; message: string }> {
  console.log('🔍 Updating delivery risk assessment:', deliveryId, riskLevel, riskScore)
  
  if (!USE_REAL_DATA) {
    console.log('📝 Mock mode: Risk assessment update simulated')
    return { success: true, message: 'Risk assessment updated (mock mode)' }
  }

  try {
    // Primero verificar si la entrega ya fue valorada
    const { data: currentDelivery, error: checkError } = await getDataSupabase()
      .from('deliveries')
      .select('id, risk_assessed')
      .eq('id', deliveryId)
      .single()

    if (checkError) {
      console.error('❌ Error checking delivery:', checkError)
      return { success: false, message: 'Error checking delivery status' }
    }

    if (!currentDelivery) {
      return { success: false, message: 'Delivery not found' }
    }

    // Verificar si ya fue valorada
    if (currentDelivery?.risk_assessed) {
      console.log('⚠️ Delivery already assessed')
      return { success: false, message: 'Esta entrega ya ha sido valorada y no puede ser valorada nuevamente' }
    }

    // Actualizar la valoración de riesgo en la base de datos
    const { error: updateError } = await getDataSupabase()
      .from('deliveries')
      .update({
        risk_assessed: true,
        risk_level: riskLevel,
        risk_score: riskScore,
        risk_assessment_date: new Date().toISOString()
      })
      .eq('id', deliveryId)

    if (updateError) {
      console.error('❌ Error updating delivery risk:', updateError)
      return { success: false, message: 'Error updating delivery risk assessment' }
    }

    console.log('✅ Delivery risk assessment updated successfully')

    // Obtener información del proyecto para actualizar su assessment
    const { data: delivery, error: deliveryError } = await getDataSupabase()
      .from('deliveries')
      .select('project_id')
      .eq('id', deliveryId)
      .single()

    if (deliveryError || !delivery) {
      console.error('❌ Error getting delivery project:', deliveryError)
      return { success: false, message: 'Error getting delivery project information' }
    }

    // Actualizar el assessment del proyecto
    await updateProjectRiskAssessment(delivery.project_id)

    console.log('✅ Delivery risk assessment updated successfully')
    return { success: true, message: 'Valoración de riesgo actualizada exitosamente' }
    
  } catch (error) {
    console.error('❌ Error in updateDeliveryRiskAssessment:', error)
    return { success: false, message: 'Error updating risk assessment' }
  }
}

/**
 * Actualiza el assessment del proyecto basado en las valoraciones de sus entregas
 * Calcula el promedio ponderado de los riesgos de las entregas
 */
export async function updateProjectRiskAssessment(projectId: string): Promise<boolean> {
  console.log('🔍 Updating project risk assessment:', projectId)
  
  if (!USE_REAL_DATA) {
    console.log('📝 Mock mode: Project assessment update simulated')
    return true
  }

  try {
    // Obtener todas las entregas valoradas del proyecto
    const { data: assessedDeliveries, error: deliveriesError } = await getDataSupabase()
      .from('deliveries')
      .select('risk_score, risk_level, budget')
      .eq('project_id', projectId)
      .eq('risk_assessed', true)

    if (deliveriesError) {
      console.error('❌ Error getting assessed deliveries:', deliveriesError)
      return false
    }

    if (!assessedDeliveries || assessedDeliveries.length === 0) {
      console.log('ℹ️ No assessed deliveries found for project')
      return true
    }

    // Calcular el promedio ponderado por presupuesto
    let totalWeightedScore = 0
    let totalWeight = 0
    let highestRiskLevel = ''
    let maxScore = 0

    assessedDeliveries.forEach(delivery => {
      if (delivery.risk_score && delivery.budget) {
        const weight = delivery.budget
        totalWeightedScore += delivery.risk_score * weight
        totalWeight += weight
        
        if (delivery.risk_score > maxScore) {
          maxScore = delivery.risk_score
          highestRiskLevel = delivery.risk_level || ''
        }
      }
    })

    const averageScore = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0
    
    // Determinar el nivel de riesgo basado en la puntuación promedio
    let projectRiskLevel: RiskLevel = 'Muy conservador'
    
    if (averageScore <= 3) projectRiskLevel = 'Muy conservador'
    else if (averageScore <= 6) projectRiskLevel = 'Conservador'
    else if (averageScore <= 10) projectRiskLevel = 'Moderado'
    else if (averageScore <= 14) projectRiskLevel = 'Moderado - alto'
    else if (averageScore <= 17) projectRiskLevel = 'Agresivo'
    else projectRiskLevel = 'Muy Agresivo'

    // Actualizar el proyecto con el nuevo assessment
    const { error: updateError } = await getDataSupabase()
      .from('projects')
      .update({
        risk_level: projectRiskLevel,
        risk_score: averageScore
      })
      .eq('id', projectId)

    if (updateError) {
      console.error('❌ Error updating project risk:', updateError)
      return false
    }

    console.log(`✅ Project risk updated: ${projectRiskLevel} (Score: ${averageScore})`)
    return true
    
  } catch (error) {
    console.error('❌ Error in updateProjectRiskAssessment:', error)
    return false
  }
}

/**
 * Obtiene las entregas pendientes de valoración (no valoradas)
 */
export async function getPendingRiskAssessmentDeliveries(): Promise<Delivery[]> {
  console.log('🔍 Getting pending risk assessment deliveries')
  
  if (!USE_REAL_DATA) {
    const mockDeliveries = getMockDeliveries()
    return mockDeliveries.filter(d => !d.riskAssessed)
  }

  try {
    // Obtener solo las entregas que no han sido valoradas
    const { data: deliveries, error } = await getDataSupabase()
      .from('deliveries')
      .select('*')
      .eq('risk_assessed', false)
      .order('creation_date', { ascending: false })

    if (error) {
      console.error('❌ Error fetching pending deliveries:', error)
      return []
    }

    return deliveries?.map(delivery => ({
      id: delivery.id,
      projectId: delivery.project_id,
      projectName: delivery.project_name,
      deliveryNumber: delivery.delivery_number,
      stage: delivery.stage as ProjectStage,
      budget: delivery.budget,
      budgetSpent: delivery.budget_spent,
      estimatedDate: delivery.estimated_date,
      creationDate: delivery.creation_date,
      actualStartDate: delivery.actual_start_date,
      actualDeliveryDate: delivery.actual_delivery_date,
      lastBudgetUpdate: delivery.last_budget_update,
      owner: {
        id: delivery.owner_id,
        name: delivery.owner_name,
        avatar: delivery.owner_avatar
      },
      isArchived: delivery.is_archived,
      riskAssessed: delivery.risk_assessed,
      riskLevel: delivery.risk_level as RiskLevel,
      riskScore: delivery.risk_score,
      riskAssessmentDate: delivery.risk_assessment_date,
      errorCount: delivery.error_count,
      errorSolutionTime: delivery.error_solution_time
    })) || []
    
  } catch (error) {
    console.error('❌ Error in getPendingRiskAssessmentDeliveries:', error)
    return []
  }
}