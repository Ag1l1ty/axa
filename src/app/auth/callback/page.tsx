"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"

type CallbackState = 'loading' | 'success' | 'error'

export default function AuthCallbackPage() {
  const [state, setState] = useState<CallbackState>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Verificar si hay parámetros de error
        const error = searchParams?.get('error')
        const errorDescription = searchParams?.get('error_description')
        
        if (error) {
          console.error('Auth callback error:', error, errorDescription)
          setState('error')
          setMessage(errorDescription || 'Error en la verificación del email')
          return
        }

        // Procesar el callback de autenticación
        if (supabase) {
          console.log('🔄 Processing auth callback...')
          
          const { data, error: authError } = await supabase.auth.getSession()
          
          if (authError) {
            console.error('Session error:', authError)
            setState('error')
            setMessage('Error al procesar la sesión de autenticación')
            return
          }

          if (data.session) {
            console.log('✅ Email confirmed successfully')
            setState('success')
            setMessage('¡Email confirmado exitosamente! Redirigiendo...')
            
            // Redirigir al dashboard después de 2 segundos
            setTimeout(() => {
              router.push('/')
            }, 2000)
          } else {
            // Si no hay sesión, verificar si hay códigos de confirmación
            const accessToken = searchParams?.get('access_token')
            const refreshToken = searchParams?.get('refresh_token')
            
            if (accessToken && refreshToken) {
              console.log('✅ Email confirmed, setting session...')
              const { error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              })
              
              if (sessionError) {
                console.error('Error setting session:', sessionError)
                setState('error')
                setMessage('Error al establecer la sesión')
              } else {
                setState('success')
                setMessage('¡Email confirmado exitosamente! Redirigiendo...')
                setTimeout(() => {
                  router.push('/')
                }, 2000)
              }
            } else {
              setState('error')
              setMessage('No se encontraron datos de confirmación válidos')
            }
          }
        } else {
          setState('error')
          setMessage('Cliente de autenticación no disponible')
        }
      } catch (error) {
        console.error('Callback processing error:', error)
        setState('error')
        setMessage('Error inesperado durante la confirmación')
      }
    }

    handleAuthCallback()
  }, [searchParams, router])

  const handleRetry = () => {
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">
            {state === 'loading' && 'Confirmando Email'}
            {state === 'success' && 'Email Confirmado'}
            {state === 'error' && 'Error de Confirmación'}
          </CardTitle>
          <CardDescription className="text-center">
            {state === 'loading' && 'Procesando la confirmación de tu email...'}
            {state === 'success' && 'Tu cuenta ha sido activada exitosamente'}
            {state === 'error' && 'Hubo un problema al confirmar tu email'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {state === 'loading' && (
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-sm text-gray-600">
                Por favor espera mientras confirmamos tu email...
              </p>
            </div>
          )}
          
          {state === 'success' && (
            <div className="flex flex-col items-center space-y-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <Alert>
                <AlertDescription className="text-green-700">
                  {message}
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          {state === 'error' && (
            <div className="flex flex-col items-center space-y-4">
              <XCircle className="h-8 w-8 text-red-500" />
              <Alert variant="destructive">
                <AlertDescription>
                  {message}
                </AlertDescription>
              </Alert>
              <Button 
                onClick={handleRetry}
                variant="outline"
                className="w-full"
              >
                Ir al Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}