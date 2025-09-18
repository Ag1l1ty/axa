import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_service_key'

// Check if auth is explicitly disabled
const isAuthDisabled = process.env.NEXT_PUBLIC_SUPABASE_AUTH_DISABLED === 'true'

export const isSupabaseConfigured = !isAuthDisabled && supabaseUrl !== 'https://dummy.supabase.co' && supabaseAnonKey !== 'dummy_key'

// Singleton simple usando lazy initialization
let _supabase: any = null

export const supabase = (() => {
  if (_supabase) return _supabase
  
  if (!isSupabaseConfigured) return null
  
  _supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'axa-supabase-auth-token',
      debug: false,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'axa-singleton-client'
      }
    },
    db: {
      schema: 'public'
    },
    realtime: {
      params: {
        eventsPerSecond: 2
      }
    }
  })
  
  return _supabase
})()

// Cliente admin singleton
let _supabaseAdmin: any = null

export const supabaseAdmin = (() => {
  if (_supabaseAdmin) return _supabaseAdmin
  
  if (!isSupabaseConfigured) return null
  
  _supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'axa-admin-singleton'
      }
    }
  })
  
  return _supabaseAdmin
})()

// Getter para compatibilidad
export const getSupabaseClient = () => supabase

// Reset de singleton instances
export const resetSupabaseClient = () => {
  console.log('🔄 Resetting singleton client instances')
  
  // Reset variables singleton
  _supabase = null
  _supabaseAdmin = null
  
  // Limpiar storage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('axa-supabase-auth-token')
    localStorage.removeItem(`sb-${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF}-auth-token`)
    sessionStorage.clear()
    console.log('✅ Client instances and storage cleared')
  }
}

export type { Database }