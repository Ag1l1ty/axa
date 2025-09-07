"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
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

    // Obtener sesión inicial
    getCurrentUser().then((user) => {
      setUser(user)
      if (user) {
        getUserProfile(user.id).then((profile) => {
          setProfile(profile)
          setLoading(false)
        }).catch((error) => {
          console.error('useAuth: Error getting user profile:', error)
          setLoading(false)
        })
      } else {
        setLoading(false)
      }
    }).catch((error) => {
      console.error('useAuth: Error getting current user:', error)
      setLoading(false)
    })

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase!.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const authUser = session.user as AuthUser
          setUser(authUser)
          const userProfile = await getUserProfile(authUser.id)
          setProfile(userProfile)
        } else {
          setUser(null)
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [mounted])

  const handleSignOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setProfile(null)
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