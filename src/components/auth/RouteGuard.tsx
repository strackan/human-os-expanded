'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { isPublicRoute } from '@/lib/auth-config'

interface RouteGuardProps {
  children: React.ReactNode
}

export default function RouteGuard({ children }: RouteGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Check if DEMO_MODE is enabled
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

  useEffect(() => {
    console.log('🛡️ RouteGuard check:', { 
      pathname, 
      isPublicRoute: isPublicRoute(pathname), 
      hasUser: !!user, 
      loading,
      userEmail: user?.email,
      isDemoMode
    })

    // If DEMO_MODE is enabled, skip all auth checks
    if (isDemoMode) {
      console.log('🎮 DEMO MODE: Skipping auth check for:', pathname)
      return
    }

    // 🆕 Fix: redirect signed-in users away from /signin
    if (user && pathname === '/signin') {
      console.log('🛡️ Signed in user stuck on /signin, redirecting to /dashboard')
      router.replace('/dashboard')
      return
    }

    // Don't redirect if we're still loading or on a public route
    if (loading || isPublicRoute(pathname)) {
      console.log('🛡️ Skipping redirect - loading or public route')
      return
    }

    // If no user and not on a public route, redirect to signin
    if (!user) {
      console.log('🛡️ No user found, redirecting to signin from:', pathname)
      const redirectUrl = `/signin?next=${encodeURIComponent(pathname)}`
      router.replace(redirectUrl) // Use replace to avoid back button issues
      return
    }

    // If authenticated and on root page, allow access
    if (user && pathname === '/') {
      console.log('🛡️ Authenticated user on root, allowing access')
      return
    }

    console.log('🛡️ User authenticated, allowing access to:', pathname)
  }, [user, loading, pathname, router, isDemoMode])

  // If DEMO_MODE is enabled, always render children
  if (isDemoMode) {
    return <>{children}</>
  }

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render children if not authenticated and not on public route
  if (!user && !isPublicRoute(pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    )
  }

  // Render children if authenticated or on public route
  return <>{children}</>
}
