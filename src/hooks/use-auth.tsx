"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured, resetSupabaseClient } from '@/lib/supabase'
import { getCurrentUser, getUserProfile } from '@/lib/auth'
import type { AuthUser, User } from '@/lib/types'

interface AuthContextType {
  user: AuthUser | null
  profile: User | null
  loading: boolean
  signOut: () => Promise<void>
  isManager: boolean
  isProjectManager: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const authDisabled = process.env.NEXT_PUBLIC_SUPABASE_AUTH_DISABLED === 'true'
    
    if (!isSupabaseConfigured || authDisabled) {
      // Modo desarrollo sin Supabase - crear usuario mock
      const mockUser: AuthUser = {
        id: 'dev-user-1',
        email: 'admin@demo.com',
        user_metadata: {
          firstName: 'Demo',
          lastName: 'Admin',
          role: 'Admin'
        }
      }
      const mockProfile: User = {
        id: 'dev-user-1',
        firstName: 'Demo',
        lastName: 'Admin',
        email: 'admin@demo.com',
        role: 'Admin',
        avatar: '/avatars/01.png'
      }
      setUser(mockUser)
      setProfile(mockProfile)
      setLoading(false)
      return
    }

    if (!supabase) {
      console.error('❌ Supabase client not initialized')
      setUser(null)
      setProfile(null)
      setLoading(false)
      return
    }

    // Función para inicializar la sesión con retry
    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing authentication...')
        
        // Obtener sesión inicial
        const user = await getCurrentUser()
        console.log('👤 Current user:', user?.email || 'none')
        
        setUser(user)
        
        if (user) {
          try {
            const profile = await getUserProfile(user.id)
            setProfile(profile)
            console.log('✅ Profile loaded:', profile?.email)
          } catch (profileError) {
            console.error('❌ Profile loading error:', profileError)
            setProfile(null)
          }
        }
        
        setLoading(false)
        console.log('✅ Auth initialization complete')
      } catch (error) {
        console.error('❌ useAuth: Error initializing auth:', error)
        
        // En caso de error grave, limpiar estado y redirigir
        if (error.message?.includes('Multiple GoTrueClient') || error.message?.includes('JWT')) {
          console.log('🔄 Multiple client error detected - resetting client')
          setUser(null)
          setProfile(null)
          
          // Reset del cliente y redirect
          if (typeof window !== 'undefined') {
            try {
              await resetSupabaseClient()
            } catch (resetError) {
              console.error('❌ Error resetting client:', resetError)
            }
            
            console.log('🔄 Redirecting to login due to client error')
            setTimeout(() => {
              window.location.href = '/login'
            }, 1000)
          }
        } else {
          // Para otros errores, simplemente limpiar estado
          setUser(null)
          setProfile(null)
        }
        
        setLoading(false)
      }
    }

    // Inicializar autenticación
    initializeAuth()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.email)
        console.log('📅 Session expires at:', session?.expires_at ? new Date(session.expires_at * 1000) : 'N/A')
        
        if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed successfully')
        }
        
        if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out')
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }
        
        if (session?.user) {
          const authUser = session.user as AuthUser
          setUser(authUser)
          try {
            const userProfile = await getUserProfile(authUser.id)
            setProfile(userProfile)
            console.log('✅ Profile loaded for:', authUser.email)
          } catch (error) {
            console.error('❌ Error getting profile after auth change:', error)
            if (error.message?.includes('JWT') || error.message?.includes('expired')) {
              console.log('🔄 Attempting to refresh session due to token error')
              try {
                await supabase.auth.refreshSession()
              } catch (refreshError) {
                console.error('❌ Failed to refresh session:', refreshError)
                setUser(null)
                setProfile(null)
              }
            } else {
              setProfile(null)
            }
          }
        } else {
          setUser(null)
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [mounted])

  // Effect para renovación automática de sesión
  useEffect(() => {
    if (!mounted || !isSupabaseConfigured || !supabase || !user) return

    let refreshTimer: NodeJS.Timeout | null = null

    const setupSessionRefresh = () => {
      // Limpiar timer existente
      if (refreshTimer) {
        clearTimeout(refreshTimer)
      }

      // Obtener la sesión actual
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.expires_at) {
          const expiresAt = session.expires_at * 1000 // Convertir a millisegundos
          const now = Date.now()
          const timeUntilExpiry = expiresAt - now
          
          // Renovar 5 minutos antes de que expire (o inmediatamente si ya pasó)
          const refreshIn = Math.max(timeUntilExpiry - 5 * 60 * 1000, 1000)
          
          console.log(`⏰ Session expires at: ${new Date(expiresAt).toLocaleString()}`)
          console.log(`🔄 Will refresh session in: ${Math.round(refreshIn / 1000)} seconds`)
          
          refreshTimer = setTimeout(async () => {
            try {
              console.log('🔄 Auto-refreshing session...')
              const { data, error } = await supabase.auth.refreshSession()
              
              if (error) {
                console.error('❌ Failed to refresh session:', error)
                console.log('🚪 Auto-logout due to failed session refresh')
                await handleSignOut()
              } else {
                console.log('✅ Session refreshed successfully')
                setupSessionRefresh()
              }
            } catch (error) {
              console.error('❌ Error during session refresh:', error)
              await handleSignOut()
            }
          }, refreshIn)
        }
      })
    }

    setupSessionRefresh()

    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer)
      }
    }
  }, [mounted, user, isSupabaseConfigured])

  const handleSignOut = async () => {
    console.log('👋 Starting enhanced logout process...')
    
    try {
      // Primero limpiar el estado local inmediatamente
      setUser(null)
      setProfile(null)
      setLoading(false)
      
      if (isSupabaseConfigured && supabase) {
        console.log('🔄 Calling supabase.auth.signOut with global scope...')
        // Usar scope 'global' para limpiar en todos los tabs
        await supabase.auth.signOut({ scope: 'global' })
        console.log('✅ Supabase signOut completed')
        
        // Reset completo del cliente para evitar múltiples instancias
        console.log('🔄 Resetting Supabase client to prevent multiple instances...')
        try {
          await resetSupabaseClient()
          console.log('✅ Supabase client reset completed')
        } catch (resetError) {
          console.warn('⚠️ Client reset error (non-critical):', resetError)
        }
      }
      
      // Limpiar localStorage y sessionStorage más agresivamente
      if (typeof window !== 'undefined') {
        try {
          // Lista completa de keys a limpiar
          const keysToRemove = [
            'axa-supabase-auth-token',
            'supabase.auth.token',
            'sb-' + (process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] || '') + '-auth-token'
          ]
          
          keysToRemove.forEach(key => {
            localStorage.removeItem(key)
            sessionStorage.removeItem(key)
          })
          
          // Limpiar cualquier key que contenga palabras relacionadas
          const allLocalKeys = Object.keys(localStorage)
          const allSessionKeys = Object.keys(sessionStorage)
          
          // Combinar arrays sin spread operator para compatibilidad
          const allKeys = allLocalKeys.concat(allSessionKeys)
          allKeys.forEach(key => {
            if (key.includes('supabase') || key.includes('auth') || key.startsWith('axa-') || key.startsWith('sb-')) {
              localStorage.removeItem(key)
              sessionStorage.removeItem(key)
            }
          })
          
          console.log('🧹 All authentication storage cleared')
        } catch (storageError) {
          console.warn('⚠️ Storage cleanup error:', storageError)
        }
      }
      
      // Pequeño delay para asegurar que todo se procese
      // Hard reset del navegador para limpiar completamente el estado
      console.log('🚀 Executing HARD reset - clearing all state and reloading')
      if (typeof window !== 'undefined') {
        // Forzar recarga completa que limpia TODO el estado de JavaScript
        window.location.replace('/login')
        // Backup: si replace no funciona, usar href + reload
        setTimeout(() => {
          window.location.href = '/login'
          window.location.reload()
        }, 100)
      }
      
    } catch (error) {
      console.error('❌ Error during logout:', error)
      // En caso de error, forzar limpieza total y redirect
      setUser(null)
      setProfile(null)
      setLoading(false)
      
      if (typeof window !== 'undefined') {
        try {
          localStorage.clear()
          sessionStorage.clear()
        } catch (clearError) {
          console.error('❌ Error clearing storage:', clearError)
        }
        // Hard reset también en caso de error
        window.location.replace('/login')
        setTimeout(() => window.location.reload(), 100)
      }
    }
  }

  const isManager = profile?.role === 'Admin' || profile?.role === 'Portfolio Manager'
  const isProjectManager = profile?.role === 'PM/SM'

  const value = {
    user,
    profile,
    loading,
    signOut: handleSignOut,
    isManager,
    isProjectManager,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}