import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_service_key'

// Service key only available on server-side via API routes

// Cliente Supabase normal para operaciones de usuario
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: !process.env.NEXT_PUBLIC_SUPABASE_AUTH_DISABLED,
    autoRefreshToken: !process.env.NEXT_PUBLIC_SUPABASE_AUTH_DISABLED,
  }
})

// Cliente Supabase admin para crear usuarios sin auto-login
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
})

export const isSupabaseConfigured = supabaseUrl !== 'https://dummy.supabase.co' && supabaseAnonKey !== 'dummy_key'

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