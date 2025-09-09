"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { signIn } from '@/lib/auth'
import { Loader2 } from 'lucide-react'

interface LoginFormProps {
  onForgotPassword?: () => void
}

export function LoginForm({ onForgotPassword }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    console.log('🚀 Login attempt for:', email)
    
    try {
      const { data, error: authError } = await signIn(email, password)
      
      console.log('📊 Login result:', { data: !!data, error: !!authError })
      console.log('👤 User data:', data?.user ? 'Present' : 'Missing')
      
      if (authError) {
        console.error('❌ Auth error:', authError)
        setError(authError.message || 'Error al iniciar sesión')
        setIsLoading(false)
      } else if (data?.user) {
        console.log('✅ Login successful, redirecting...')
        // Set loading to false before redirect to prevent stuck state
        setIsLoading(false)
        router.push('/')
        router.refresh()
      } else {
        console.warn('⚠️ No user data returned')
        // Handle case where no user data is returned
        setError('No se recibieron datos de usuario')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('💥 Unexpected error during login:', error)
      setError('Error inesperado durante el login')
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Iniciar Sesión</CardTitle>
        <CardDescription>
          Ingresa tus credenciales para acceder al dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Iniciar Sesión
          </Button>

          {onForgotPassword && (
            <Button
              type="button"
              variant="link"
              className="w-full"
              onClick={onForgotPassword}
              disabled={isLoading}
            >
              ¿Olvidaste tu contraseña?
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  )
}