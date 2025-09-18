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
  const [lastActivity, setLastActivity] = useState<number>(Date.now())

  useEffect(() => {
    setMounted(true)
  }, [])

  // Monitoreo de actividad del usuario para timeout de 1 hora
  useEffect(() => {
    if (!mounted || !user) return

    // Eventos que indican actividad del usuario
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    const updateActivity = () => {
      setLastActivity(Date.now())
    }

    // Agregar listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, true)
    })

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity, true)
      })
    }
  }, [mounted, user])

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

    // Función para inicializar la sesión con manejo robusto de errores
    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing authentication...')
        
        // Intentar obtener sesión inicial con timeout más generoso para producción
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Auth initialization timeout')), 30000)
        })
        
        const authPromise = getCurrentUser()
        const user = await Promise.race([authPromise, timeoutPromise]) as any
        
        console.log('👤 Current user:', user?.email || 'none')
        setUser(user)
        
        if (user) {
          try {
            const profile = await getUserProfile(user.id)
            setProfile(profile)
            console.log('✅ Profile loaded:', profile?.email)
          } catch (profileError) {
            console.error('❌ Profile loading error:', profileError)
            // No bloquear por errores de perfil
            setProfile(null)
          }
        }
        
        setLoading(false)
        console.log('✅ Auth initialization complete')
      } catch (error) {
        console.error('❌ useAuth: Error initializing auth:', error)
        
        // Para Multiple GoTrueClient, ignorar el error pero continuar
        if (error.message?.includes('Multiple GoTrueClient')) {
          console.log('⚠️ Multiple GoTrueClient detected - continuing anyway')
          setUser(null)
          setProfile(null)
          setLoading(false)
          // NO redirigir, permitir que el usuario haga login manual
        } else if (error.message?.includes('timeout')) {
          console.log('⏰ Auth timeout - allowing manual login')
          setUser(null)
          setProfile(null)
          setLoading(false)
        } else {
          // Para otros errores graves
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
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

  // Manejo automático de sesiones expiradas
  useEffect(() => {
    if (!mounted || !isSupabaseConfigured || !supabase || !user) return
    
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Session check error:', error)
          
          // Si hay error de JWT o token expirado, desloguear automáticamente
          if (error.message?.includes('JWT') || 
              error.message?.includes('expired') || 
              error.message?.includes('invalid_token') ||
              error.message?.includes('token_expired')) {
            console.log('🚪 Token expired or invalid - auto logout')
            await handleAutoLogout('Token expirado')
            return
          }
        }

        // Verificar inactividad de 1 hora (3600000 ms)
        const inactiveTime = Date.now() - lastActivity
        const inactiveMinutes = Math.floor(inactiveTime / 1000 / 60)
        
        if (inactiveTime > 60 * 60 * 1000) { // 1 hora de inactividad
          console.log(`🚪 User inactive for ${inactiveMinutes} minutes - auto logout`)
          await handleAutoLogout('Sesión expirada por inactividad (1 hora)')
          return
        }
        
        // Log de inactividad para debug
        if (inactiveMinutes > 50) {
          console.warn(`⏰ User inactive for ${inactiveMinutes} minutes (will logout at 60 minutes)`)
        }
        
        if (session?.expires_at) {
          const expiresAt = session.expires_at * 1000
          const minutesLeft = Math.round((expiresAt - Date.now()) / 1000 / 60)
          console.log(`⏰ Session expires at: ${new Date(expiresAt).toLocaleString()}`)
          console.log(`⏱️ Session valid for: ${minutesLeft} minutes`)
          
          // Si la sesión ya expiró, desloguear
          if (minutesLeft <= 0) {
            console.log('🚪 Session expired - auto logout')
            await handleAutoLogout('Sesión expirada')
            return
          }
          
          // Para sesiones de 1 hora: alertar si quedan menos de 5 minutos
          if (minutesLeft < 5 && minutesLeft > 0) {
            console.warn(`⚠️ Session expires in ${minutesLeft} minutes - autoRefresh should handle this`)
          }
          
          // Si han pasado más de 50 minutos (cerca de 1 hora), preparar para expiración
          if (minutesLeft < 10 && minutesLeft > 5) {
            console.log(`⏰ Session expiring soon: ${minutesLeft} minutes remaining`)
          }
        } else if (user) {
          // Si no hay sesión pero tenemos un usuario, algo está mal
          console.log('⚠️ No session found but user exists - cleaning up')
          await handleAutoLogout('Sesión inválida')
        }
      } catch (error) {
        console.error('❌ Session check failed:', error)
        // En caso de error grave, también desloguear
        await handleAutoLogout('Error de sesión')
      }
    }
    
    // Función para manejar logout automático
    const handleAutoLogout = async (reason: string) => {
      console.log(`🚪 Auto logout: ${reason}`)
      
      // Limpiar estado inmediatamente
      setUser(null)
      setProfile(null)
      setLoading(false)
      
      try {
        // Limpiar storage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('axa-supabase-auth-token')
          localStorage.removeItem('sb-' + process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF + '-auth-token')
          sessionStorage.clear()
          console.log('🧹 Storage cleared')
        }
        
        // Logout de Supabase
        await supabase.auth.signOut()
        console.log('✅ Signed out from Supabase')
        
        // Mostrar mensaje al usuario y redirigir
        if (typeof window !== 'undefined') {
          // Usar setTimeout para asegurar que el estado se actualice
          setTimeout(() => {
            alert(`${reason}. Por favor, inicia sesión nuevamente.`)
            window.location.href = '/login'
          }, 100)
        }
        
      } catch (logoutError) {
        console.error('❌ Error during auto logout:', logoutError)
        // Aunque falle el logout, redirigir
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            window.location.href = '/login'
          }, 100)
        }
      }
    }
    
    // Revisar inmediatamente y luego cada 1 minuto (para timeout de 1 hora)
    checkSession()
    const interval = setInterval(checkSession, 1 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [mounted, user, isSupabaseConfigured])

  const handleSignOut = async () => {
    console.log('👋 Simple logout...')
    
    try {
      // Limpiar estado local
      setUser(null)
      setProfile(null)
      setLoading(false)
      
      // Logout de Supabase
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut()
        console.log('✅ Logged out')
      }
      
      // Solo limpiar el storage específico de auth
      if (typeof window !== 'undefined') {
        localStorage.removeItem('axa-supabase-auth-token')
        console.log('🧹 Auth token cleared')
      }
      
    } catch (error) {
      console.error('❌ Logout error:', error)
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