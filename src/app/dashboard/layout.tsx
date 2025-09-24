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
      console.log('🔐 No authenticated user found, redirecting to signin')
      router.push('/signin')
    }
  }, [user, loading, router])

  const handleSignOut = async () => {
    console.log('🔐 Dashboard layout - Sign out clicked')
    try {
      await signOut('global')
      console.log('✅ Dashboard layout signout completed')
      // The signOut function handles the redirect automatically
    } catch (error) {
      console.error('❌ Dashboard layout signout error:', error)
      // Fallback redirect on error
      router.push('/signin')
    }
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
      <main>
        {children}
      </main>
    </div>
  )
}