"use client"

import { useState } from 'react'
import { LoginForm } from '@/components/auth/login-form'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export default function LoginPage() {
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            AXA Portfolio Insights
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sistema de gestión de portafolio
          </p>
        </div>
        
        {showForgotPassword ? (
          <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />
        ) : (
          <LoginForm onForgotPassword={() => setShowForgotPassword(true)} />
        )}
      </div>
    </div>
  )
}