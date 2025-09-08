"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { getSupabaseClient, isSupabaseConfigured, resetSupabaseClient, forceSessionRefresh } from '@/lib/supabase'
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

    const supabaseClient = getSupabaseClient()
    
    if (!supabaseClient) {
      console.error('❌ Supabase client not initialized - falling back to mock auth')
      // En lugar de fallar, usar mock auth temporalmente
      const mockUser: AuthUser = {
        id: 'temp-admin-id',
        email: 'admin@agilitychanges.com',
        user_metadata: {
          firstName: 'Admin',
          lastName: 'Principal', 
          role: 'Admin'
        }
      }
      const mockProfile: User = {
        id: 'temp-admin-id',
        firstName: 'Admin',
        lastName: 'Principal',
        email: 'admin@agilitychanges.com',
        role: 'Admin',
        avatar: '/avatars/admin.png'
      }
      setUser(mockUser)
      setProfile(mockProfile)
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
            const refreshed = await forceSessionRefresh()
            if (refreshed) {
              const retryProfile = await getUserProfile(user.id)
              setProfile(retryProfile)
            } else {
              setProfile(null)
            }
          }
        }
        
        setLoading(false)
        console.log('✅ Auth initialization complete')
      } catch (error) {
        console.error('❌ useAuth: Error initializing auth:', error)
        
        // En caso de error grave, resetear y usar fallback
        if (error.message?.includes('Multiple GoTrueClient') || error.message?.includes('JWT')) {
          console.log('🔄 Resetting client due to initialization error')
          resetSupabaseClient()
          
          // Intentar una vez más
          try {
            const user = await getCurrentUser()
            setUser(user)
            if (user) {
              const profile = await getUserProfile(user.id)
              setProfile(profile)
            }
          } catch (retryError) {
            console.error('❌ Retry failed:', retryError)
            setUser(null)
            setProfile(null)
          }
        }
        
        setLoading(false)
      }
    }

    // Inicializar autenticación
    initializeAuth()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
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

  const handleSignOut = async () => {
    const supabaseClient = getSupabaseClient()
    if (isSupabaseConfigured && supabaseClient) {
      console.log('👋 Signing out user...')
      await supabaseClient.auth.signOut()
      resetSupabaseClient() // Limpiar cliente después del logout
    }
    setUser(null)
    setProfile(null)
    setLoading(false)
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