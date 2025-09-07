"use client"

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string[]
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // No hay usuario logueado
      if (!user) {
        router.push(redirectTo)
        return
      }

      // Verificar roles si se especificaron
      if (requiredRole && profile) {
        if (!requiredRole.includes(profile.role)) {
          router.push('/unauthorized')
          return
        }
      }
    }
  }, [user, profile, loading, router, requiredRole, redirectTo])

  // Mostrar loading mientras verifica autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Usuario no autenticado, se redirigirá en useEffect
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Redirigiendo...</p>
        </div>
      </div>
    )
  }

  // Usuario no tiene permisos
  if (requiredRole && profile && !requiredRole.includes(profile.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acceso Denegado</h1>
          <p className="text-muted-foreground mb-4">
            No tienes permisos para acceder a esta página.
          </p>
          <p className="text-sm text-muted-foreground">
            Rol requerido: {requiredRole.join(', ')} | Tu rol: {profile.role}
          </p>
        </div>
      </div>
    )
  }

  // Usuario autenticado y con permisos
  return <>{children}</>
}