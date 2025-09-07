"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { resetPassword } from '@/lib/auth'
import { Loader2, ArrowLeft } from 'lucide-react'

interface ForgotPasswordFormProps {
  onBack?: () => void
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const { error: resetError } = await resetPassword(email)

    if (resetError) {
      setError(resetError.message || 'Error al enviar el email de recuperación')
    } else {
      setSuccess(true)
    }
    
    setIsLoading(false)
  }

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Email Enviado</CardTitle>
          <CardDescription>
            Revisa tu email para las instrucciones de recuperación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Se ha enviado un email a <strong>{email}</strong> con las instrucciones para recuperar tu contraseña.
            </AlertDescription>
          </Alert>
          
          {onBack && (
            <Button
              type="button"
              variant="outline"
              className="w-full mt-4"
              onClick={onBack}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Login
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Recuperar Contraseña</CardTitle>
        <CardDescription>
          Ingresa tu email para recibir instrucciones de recuperación
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

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Email de Recuperación
            </Button>

            {onBack && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={onBack}
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Login
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}