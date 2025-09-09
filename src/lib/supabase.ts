import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_service_key'

export const isSupabaseConfigured = supabaseUrl !== 'https://dummy.supabase.co' && supabaseAnonKey !== 'dummy_key'

// Variable para controlar instancia única
let supabaseInstance: SupabaseClient<Database> | null = null

// Función para crear cliente con configuración mejorada
const createSupabaseClient = (): SupabaseClient<Database> | null => {
  if (!isSupabaseConfigured) {
    console.warn('⚠️ Supabase not configured')
    return null
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: {
        getItem: (key: string) => {
          if (typeof window === 'undefined') return null
          return localStorage.getItem(`axa-${key}`)
        },
        setItem: (key: string, value: string) => {
          if (typeof window === 'undefined') return
          localStorage.setItem(`axa-${key}`, value)
        },
        removeItem: (key: string) => {
          if (typeof window === 'undefined') return
          localStorage.removeItem(`axa-${key}`)
        }
      },
      storageKey: 'supabase.auth.token'
    }
  })
}

// Inicializar cliente una sola vez
if (!supabaseInstance) {
  supabaseInstance = createSupabaseClient()
}

export const supabase = supabaseInstance

// Cliente admin (no cambia)
export const supabaseAdmin = isSupabaseConfigured ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
}) : null

// Getter para compatibilidad
export const getSupabaseClient = () => supabase

// Reset mejorado del cliente
export const resetSupabaseClient = async (): Promise<SupabaseClient<Database> | null> => {
  console.log('🔄 Resetting Supabase client completely...')
  
  if (supabaseInstance) {
    try {
      // Cerrar sesión local silenciosamente
      await supabaseInstance.auth.signOut({ scope: 'local' })
      console.log('✅ Previous session cleared')
    } catch (error) {
      console.warn('⚠️ Error during session cleanup:', error)
    }
  }
  
  // Limpiar storage personalizado
  if (typeof window !== 'undefined') {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('axa-') || key.includes('supabase')) {
          localStorage.removeItem(key)
        }
      })
      console.log('🧹 Storage cleared')
    } catch (error) {
      console.warn('⚠️ Error clearing storage:', error)
    }
  }
  
  // Crear nueva instancia limpia
  supabaseInstance = createSupabaseClient()
  console.log('✅ New Supabase client created')
  
  return supabaseInstance
}

export type { Database }