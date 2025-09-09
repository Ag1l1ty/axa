import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_service_key'

export const isSupabaseConfigured = supabaseUrl !== 'https://dummy.supabase.co' && supabaseAnonKey !== 'dummy_key'

// Cliente con autoRefresh controlado - balance entre funcionalidad y estabilidad
export const supabase = isSupabaseConfigured ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true, // Reactivar para que los 4 horas funcionen
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'axa-supabase-auth-token',
    // Configuraciones para estabilidad
    debug: false,
    flowType: 'pkce'
  }
}) : null

// Cliente admin
export const supabaseAdmin = isSupabaseConfigured ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
}) : null

// Getter para compatibilidad
export const getSupabaseClient = () => supabase

// Reset simple que solo fuerza page reload
export const resetSupabaseClient = () => {
  console.log('🔄 Hard refresh will clear all client instances')
  if (typeof window !== 'undefined') {
    window.location.reload(true)
  }
}

export type { Database }