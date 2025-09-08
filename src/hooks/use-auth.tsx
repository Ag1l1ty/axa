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
            // Si falla el profile, intentar refresh
            setProfile(null)
          }
        }
        
        setLoading(false)
        console.log('✅ Auth initialization complete')
      } catch (error) {
        console.error('❌ useAuth: Error initializing auth:', error)
        
        // En caso de error grave, limpiar estado y redirigir
        if (error.message?.includes('Multiple GoTrueClient') || error.message?.includes('JWT')) {
          console.log('🔄 Multiple client error detected - clearing state')
          setUser(null)
          setProfile(null)
          
          // Limpiar localStorage y forzar refresh
          if (typeof window !== 'undefined') {
            localStorage.removeItem('axa-supabase-auth-token')
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
            // Si falla el profile, intentar refrescar sesión
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
                // Si falla la renovación, cerrar sesión
                console.log('🚪 Auto-logout due to failed session refresh')
                await handleSignOut()
              } else {
                console.log('✅ Session refreshed successfully')
                // Configurar el próximo refresh
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
    console.log('👋 Starting logout process...')
    
    try {
      // Primero limpiar el estado local
      setUser(null)
      setProfile(null)
      setLoading(true)
      
      if (isSupabaseConfigured && supabase) {
        console.log('🔄 Calling supabase.auth.signOut()...')
        await supabase.auth.signOut()
        console.log('✅ Supabase signOut completed')
      }
      
      // Limpiar localStorage manualmente
      if (typeof window !== 'undefined') {
        localStorage.removeItem('axa-supabase-auth-token')
        console.log('🧹 Cleared localStorage')
      }
      
      // Forzar recarga de la página para limpiar completamente el estado
      console.log('🔄 Redirecting to login in 1 second...')
      setTimeout(() => {
        console.log('🚀 Executing redirect to login')
        window.location.href = '/login'
      }, 1000)
      
    } catch (error) {
      console.error('❌ Error during logout:', error)
      // En caso de error, forzar limpieza y redirect
      setUser(null)
      setProfile(null)
      if (typeof window !== 'undefined') {
        localStorage.clear()
        window.location.href = '/login'
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