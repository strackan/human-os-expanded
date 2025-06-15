// src/app/login/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import AuthButton from '@/components/auth/AuthButton'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!loading) {
      console.log('📊 Auth state:', { 
        hasUser: !!user, 
        loading,
        userId: user?.id
      })
      
      if (user) {
        console.log('🔄 Redirecting to dashboard...')
        router.push('/dashboard')
      }
    }
  }, [user, loading, router])

  // Show loading state with more information
  if (loading) {
    console.log('⏳ Showing loading state...')
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Checking authentication status...</p>
        </div>
      </div>
    )
  }

  // Don't show login form if user is already authenticated
  if (user) {
    console.log('👤 User already authenticated, showing redirect message')
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Already logged in</h2>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  console.log('🎯 Rendering login form')
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Sign in to Renubu
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Commercial Success Intelligence Platform
          </p>
        </div>
        <div className="mt-8 space-y-6 bg-white py-8 px-6 shadow rounded-lg">
          <div className="text-center">
            <AuthButton />
          </div>
        </div>
      </div>
    </div>
  )
}