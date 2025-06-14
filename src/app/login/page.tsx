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

  // Clean up any stale sessions on login page load
  useEffect(() => {
    const cleanupSession = async () => {
      console.log('🧹 Starting session cleanup...')
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('📝 Current session state:', { 
          hasSession: !!session, 
          hasUser: !!session?.user,
          error: error?.message 
        })
        
        if (session) {
          console.log('👋 Signing out from stale session')
          await supabase.auth.signOut()
        }
      } catch (error) {
        console.error('❌ Error cleaning up session:', error)
      }
    }
    cleanupSession()
  }, [supabase])

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!loading) {
      console.log('📊 Auth state:', { 
        hasUser: !!user, 
        loading 
      })
      
      if (user) {
        console.log('🔄 Redirecting to dashboard...')
        router.push('/dashboard')
      }
    }
  }, [user, loading, router])

  // Show loading state with more information
  if (loading) {
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Already logged in</h2>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

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