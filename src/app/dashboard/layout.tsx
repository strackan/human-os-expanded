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
  const { user, loading } = useAuth()
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

  // AppLayout is already in root layout - don't wrap again!
  return <>{children}</>
}
