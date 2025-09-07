"use client"

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DevLogin() {
  const router = useRouter()
  
  useEffect(() => {
    // Simular login exitoso y redirigir
    localStorage.setItem('mockAuth', 'true')
    router.push('/')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Entrando al sistema...</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    </div>
  )
}