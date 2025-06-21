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

  console.log('🔐 Dashboard Layout - Auth state:', {
    hasUser: !!user,
    userEmail: user?.email,
    loading,
    profile: user ? 'has profile' : 'no profile'
  })

  useEffect(() => {
    if (!loading && !user) {
      console.log('🔐 No authenticated user found, redirecting to login')
      router.push('/login')
    }
  }, [user, loading, router])

  const handleSignOut = async () => {
    console.log('🔐 Sign out clicked')
    await signOut()
    router.push('/login')
  }

  // Show loading while checking authentication
  if (loading) {
    console.log('🔐 Dashboard Layout - Showing loading state')
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">Loading: {loading ? 'true' : 'false'}</p>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated
  if (!user) {
    console.log('🔐 Dashboard Layout - No user, returning null')
    return null
  }

  console.log('✅ User authenticated:', user.email)

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