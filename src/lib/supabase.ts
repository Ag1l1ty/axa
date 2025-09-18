import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_service_key'

// Check if auth is explicitly disabled
const isAuthDisabled = process.env.NEXT_PUBLIC_SUPABASE_AUTH_DISABLED === 'true'

export const isSupabaseConfigured = !isAuthDisabled && supabaseUrl !== 'https://dummy.supabase.co' && supabaseAnonKey !== 'dummy_key'

// Singleton robusto que maneja Multiple GoTrueClient gracefully
let _supabase: any = null
let _clientId: string | null = null

// Generar ID único para este cliente
const generateClientId = () => `axa-client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export const supabase = (() => {
  if (_supabase) return _supabase
  
  if (!isSupabaseConfigured) return null
  
  // Limpiar storage anterior si existe
  if (typeof window !== 'undefined') {
    try {
      // Limpiar tokens antiguos que puedan causar conflictos
      const oldKeys = Object.keys(localStorage).filter(key => 
        key.includes('supabase') || key.includes('sb-')
      )
      oldKeys.forEach(key => {
        if (key !== 'axa-supabase-auth-token') {
          localStorage.removeItem(key)
        }
      })
    } catch (e) {
      console.warn('⚠️ Could not clean localStorage:', e)
    }
  }
  
  _clientId = generateClientId()
  console.log('🆕 Creating Supabase client with ID:', _clientId)
  
  _supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // Deshabilitado para evitar conflictos
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'axa-supabase-auth-token',
      debug: false,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': _clientId
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
  
  // Suprimir warnings de Multiple GoTrueClient en consola
  if (typeof window !== 'undefined') {
    const originalConsoleWarn = console.warn
    console.warn = (...args) => {
      const message = args.join(' ')
      if (message.includes('Multiple GoTrueClient instances detected') ||
          message.includes('Multiple GoTrueClient')) {
        // Silenciar este warning específico
        return
      }
      originalConsoleWarn.apply(console, args)
    }
  }
  
  console.log('✅ Supabase client created successfully with Multiple GoTrueClient handling')
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