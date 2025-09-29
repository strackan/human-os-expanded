// src/app/login/page.tsx
'use client'

import { useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import AuthButton from '@/components/auth/AuthButton'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkSession = async () => {
      console.log('🔍 Login page - checking session...')
      const { data: { session }, error } = await supabase.auth.getSession()
      console.log('📝 Login page - session check:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
        error: error?.message
      })
    }
    
    checkSession()
  }, [supabase])

  console.log('🔍 Login page render:', { user: !!user, loading, userEmail: user?.email })

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Checking authentication status...</p>
          <p className="text-sm text-gray-500 mt-2">Loading: {loading ? 'true' : 'false'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Renubu
        </h1>
        <p className="text-gray-600 mb-8">
          Commercial Success Intelligence Platform
        </p>
        {user ? (
          <div>
            <p className="text-green-600 mb-4">✅ You are logged in as {user.email}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div>
            <p className="text-gray-500 mb-4">Please sign in to continue</p>
            <AuthButton />
          </div>
        )}
      </div>
    </div>
  )
}