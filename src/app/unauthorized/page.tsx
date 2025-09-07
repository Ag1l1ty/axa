"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'

export default function UnauthorizedPage() {
  const { profile } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md mx-auto text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <Shield className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl">Acceso Denegado</CardTitle>
          <CardDescription>
            No tienes permisos para acceder a esta página
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile && (
            <div className="text-sm text-gray-600 bg-gray-100 p-3 rounded-lg">
              <p><strong>Usuario:</strong> {profile.firstName} {profile.lastName}</p>
              <p><strong>Rol actual:</strong> {profile.role}</p>
              <p><strong>Email:</strong> {profile.email}</p>
            </div>
          )}
          
          <p className="text-sm text-gray-600">
            Contacta al administrador si crees que esto es un error.
          </p>

          <div className="space-y-2">
            <Link href="/">
              <Button className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}