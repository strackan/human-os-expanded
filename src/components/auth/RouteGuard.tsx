'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'

interface RouteGuardProps {
  children: React.ReactNode
}

export default function RouteGuard({ children }: RouteGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  
  // Define public routes that don't require authentication
  const publicRoutes = ['/signin', '/auth/callback', '/clear-cookies.html', '/debug-auth-state', '/test-oauth', '/auth-success', '/manual-auth', '/']
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || (route !== '/' && pathname.startsWith(route))
  )

  useEffect(() => {
    console.log('🛡️ RouteGuard check:', { 
      pathname, 
      isPublicRoute, 
      hasUser: !!user, 
      loading 
    })

    // Don't redirect if we're still loading or on a public route
    if (loading || isPublicRoute) {
      return
    }

    // If no user and not on a public route, redirect to signin
    if (!user) {
      console.log('🛡️ No user found, redirecting to signin from:', pathname)
      const redirectUrl = `/signin?next=${encodeURIComponent(pathname)}`
      router.replace(redirectUrl) // Use replace to avoid back button issues
      return
    }

    console.log('🛡️ User authenticated, allowing access to:', pathname)
  }, [user, loading, pathname, isPublicRoute, router])

  // Show loading state while checking auth - but only briefly
  if (loading) {
    return (
      <div className="fixed top-0 left-0 w-full h-1 bg-blue-600 animate-pulse z-50"></div>
    )
  }

  // Don't render children if not authenticated and not on public route
  if (!user && !isPublicRoute) {
    return null // Don't show anything, just redirect
  }

  // Render children if authenticated or on public route
  return <>{children}</>
}