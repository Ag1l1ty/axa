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

  // Simplificado - sin auto-refresh que causa problemas
  useEffect(() => {
    if (!mounted || !isSupabaseConfigured || !supabase || !user) return
    
    // Solo mostrar información de la sesión, sin refresh automático
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.expires_at) {
        const expiresAt = session.expires_at * 1000
        console.log(`⏰ Session expires at: ${new Date(expiresAt).toLocaleString()}`)
        console.log(`⏱️ Session valid for: ${Math.round((expiresAt - Date.now()) / 1000 / 60)} minutes`)
      }
    })
  }, [mounted, user, isSupabaseConfigured])

  const handleSignOut = async () => {
    console.log('👋 Starting simple but effective logout process...')
    
    try {
      // Limpiar el estado local inmediatamente
      setUser(null)
      setProfile(null)
      setLoading(false)
      
      if (isSupabaseConfigured && supabase) {
        console.log('🔄 Calling supabase.auth.signOut...')
        await supabase.auth.signOut({ scope: 'global' })
        console.log('✅ Supabase signOut completed')
      }
      
      // LIMPIEZA AGRESIVA DE CACHE Y STORAGE
      if (typeof window !== 'undefined') {
        try {
          // Limpiar TODO el storage
          localStorage.clear()
          sessionStorage.clear()
          
          // Limpiar cache de navegador si está disponible
          if ('caches' in window) {
            caches.keys().then(names => {
              names.forEach(name => {
                caches.delete(name)
              })
            })
          }
          
          console.log('🧹 Complete storage and cache cleared')
        } catch (storageError) {
          console.warn('⚠️ Storage cleanup error:', storageError)
        }
      }
      
      // HARD REFRESH CON CACHE BUSTING
      console.log('🚀 Executing cache-busting refresh')
      if (typeof window !== 'undefined') {
        // Agregar timestamp para evitar cache
        const timestamp = Date.now()
        window.location.href = `/login?t=${timestamp}`
        
        // Backup: hard reload con cache busting
        setTimeout(() => {
          if (window.location.search.includes('?t=')) {
            window.location.reload(true)
          }
        }, 100)
      }
      
    } catch (error) {
      console.error('❌ Error during logout:', error)
      // Fallback: limpieza completa y refresh con cache busting
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
        
        // Cache busting en fallback también
        const timestamp = Date.now()
        window.location.href = `/login?fallback=${timestamp}`
        window.location.reload(true)
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