// src/app/dashboard/layout.tsx
'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  // Start timing when component mounts
  const startTime = performance.now()
  console.log('⏱️ [LAYOUT] DashboardLayout mount started at', new Date().toISOString())

  useEffect(() => {
    // End timing after user + loading state settles
    if (!loading) {
      const endTime = performance.now()
      console.log(
        `⏱️ [LAYOUT] Auth state settled in ${(endTime - startTime).toFixed(2)} ms`,
        { hasUser: !!user, userEmail: user?.email }
      )
    }

    if (!loading && !user) {
      console.log('🔐 [LAYOUT] No authenticated user found, redirecting to signin')
      router.push('/signin')
    }
  }, [user, loading, router, startTime])

  const handleSignOut = async () => {
    console.log('🔐 [LAYOUT] Sign out clicked')
    try {
      await signOut('global')
      console.log('✅ [LAYOUT] Signout completed')
    } catch (error) {
      console.error('❌ [LAYOUT] Signout error:', error)
      router.push('/signin')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Renubu Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <button
                onClick={handleSignOut}
                className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1 rounded transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
