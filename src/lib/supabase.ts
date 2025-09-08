import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_service_key'

export const isSupabaseConfigured = supabaseUrl !== 'https://dummy.supabase.co' && supabaseAnonKey !== 'dummy_key'

// Mejor gestión de instancias con cleanup
let supabaseInstance: SupabaseClient | null = null
let supabaseAdminInstance: SupabaseClient | null = null
let isInitialized = false

// Función para limpiar y reiniciar cliente
export const resetSupabaseClient = () => {
  console.log('🔄 Resetting Supabase client...')
  if (supabaseInstance) {
    // No hay método público de cleanup, pero podemos crear nueva instancia
    supabaseInstance = null
  }
  isInitialized = false
}

// Función mejorada para obtener el cliente Supabase
export const getSupabaseClient = () => {
  if (!isSupabaseConfigured) {
    console.warn('⚠️ Supabase not configured')
    return null
  }

  if (!supabaseInstance || !isInitialized) {
    console.log('🆕 Creating fresh Supabase client instance')
    
    // Crear nueva instancia con mejores configuraciones
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'axa-supabase-auth-token',
        debug: process.env.NODE_ENV === 'development'
      },
      global: {
        headers: {
          'X-Client-Info': 'axa-portfolio-dashboard'
        }
      }
    })
    
    isInitialized = true
    
    // Log para debugging
    supabaseInstance.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Supabase Auth Event:', event)
      if (event === 'TOKEN_REFRESHED') {
        console.log('✅ Token refreshed at:', new Date().toISOString())
      }
      if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out, cleaning up...')
        resetSupabaseClient()
      }
    })
  }
  
  return supabaseInstance
}

// Cliente Supabase normal para operaciones de usuario - usar la función directamente
export { getSupabaseClient as supabase }

// Cliente Supabase admin (sin cambios)
export const supabaseAdmin = (() => {
  if (!supabaseAdminInstance && isSupabaseConfigured) {
    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    })
  }
  return supabaseAdminInstance
})()

// Función para forzar refresh de sesión
export const forceSessionRefresh = async () => {
  const client = getSupabaseClient()
  if (client) {
    console.log('🔄 Forcing session refresh...')
    try {
      const { data, error } = await client.auth.refreshSession()
      if (error) {
        console.error('❌ Force refresh failed:', error)
        return false
      }
      console.log('✅ Force refresh successful')
      return true
    } catch (error) {
      console.error('❌ Force refresh error:', error)
      return false
    }
  }
  return false
}

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          name: string
          description: string
          stage: string
          risk_level: string
          risk_score: number | null
          budget: number
          budget_spent: number
          projected_deliveries: number | null
          start_date: string
          end_date: string
          owner_id: string
          owner_name: string
          owner_avatar: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          stage: string
          risk_level: string
          risk_score?: number | null
          budget: number
          budget_spent?: number
          projected_deliveries?: number | null
          start_date: string
          end_date: string
          owner_id: string
          owner_name: string
          owner_avatar: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          stage?: string
          risk_level?: string
          risk_score?: number | null
          budget?: number
          budget_spent?: number
          projected_deliveries?: number | null
          start_date?: string
          end_date?: string
          owner_id?: string
          owner_name?: string
          owner_avatar?: string
          created_at?: string
          updated_at?: string
        }
      }
      deliveries: {
        Row: {
          id: string
          project_id: string
          project_name: string
          delivery_number: number
          stage: string
          budget: number
          budget_spent: number | null
          estimated_date: string
          creation_date: string
          last_budget_update: string | null
          owner_id: string
          owner_name: string
          owner_avatar: string
          is_archived: boolean | null
          risk_assessed: boolean | null
          risk_level: string | null
          risk_score: number | null
          risk_assessment_date: string | null
          error_count: number | null
          error_solution_time: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          project_name: string
          delivery_number: number
          stage: string
          budget: number
          budget_spent?: number | null
          estimated_date: string
          creation_date: string
          last_budget_update?: string | null
          owner_id: string
          owner_name: string
          owner_avatar: string
          is_archived?: boolean | null
          risk_assessed?: boolean | null
          risk_level?: string | null
          risk_score?: number | null
          risk_assessment_date?: string | null
          error_count?: number | null
          error_solution_time?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          project_name?: string
          delivery_number?: number
          stage?: string
          budget?: number
          budget_spent?: number | null
          estimated_date?: string
          creation_date?: string
          last_budget_update?: string | null
          owner_id?: string
          owner_name?: string
          owner_avatar?: string
          is_archived?: boolean | null
          risk_assessed?: boolean | null
          risk_level?: string | null
          risk_score?: number | null
          risk_assessment_date?: string | null
          error_count?: number | null
          error_solution_time?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          role: string
          avatar: string
          assigned_project_ids: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email: string
          role: string
          avatar: string
          assigned_project_ids?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          role?: string
          avatar?: string
          assigned_project_ids?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      project_metrics: {
        Row: {
          id: string
          project_id: string
          month: string
          deliveries: number
          errors: number
          budget: number
          spent: number
          error_solution_time: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          month: string
          deliveries: number
          errors: number
          budget: number
          spent: number
          error_solution_time?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          month?: string
          deliveries?: number
          errors?: number
          budget?: number
          spent?: number
          error_solution_time?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      budget_history: {
        Row: {
          id: string
          delivery_id: string
          amount: number
          update_date: string
          created_at: string
        }
        Insert: {
          id?: string
          delivery_id: string
          amount: number
          update_date: string
          created_at?: string
        }
        Update: {
          id?: string
          delivery_id?: string
          amount?: number
          update_date?: string
          created_at?: string
        }
      }
    }
  }
}