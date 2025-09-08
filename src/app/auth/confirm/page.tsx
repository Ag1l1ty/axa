"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Mail, ArrowLeft } from 'lucide-react'

export default function ConfirmEmailPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle>Confirma tu Email</CardTitle>
          <CardDescription>
            Te hemos enviado un email de confirmación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              <strong>Revisa tu bandeja de entrada</strong>
              <br />
              Hemos enviado un email de confirmación a tu dirección de correo. 
              Haz clic en el enlace del email para activar tu cuenta.
            </AlertDescription>
          </Alert>

          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>¿No ves el email?</strong></p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Revisa tu carpeta de spam</li>
              <li>Verifica que la dirección de email sea correcta</li>
              <li>El email puede tardar unos minutos en llegar</li>
            </ul>
          </div>

          <div className="pt-4 border-t">
            <Button 
              onClick={() => router.push('/login')}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}