// Ejemplo de cómo proteger la página de configuración

"use client"

import { ProtectedRoute } from '@/components/auth/protected-route'
import { ConfigurePage } from './original-page' // Tu página original

export default function ProtectedConfigurePage() {
  return (
    <ProtectedRoute requiredRole={['Admin', 'Portfolio Manager']}>
      <ConfigurePage />
    </ProtectedRoute>
  )
}