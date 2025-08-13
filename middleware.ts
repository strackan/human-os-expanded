// middleware.ts (in root directory, same level as package.json)
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_CONFIG } from '@/lib/auth-config'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Create Supabase client for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { 
          return req.cookies.getAll() 
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              req.cookies.set(name, value)
              res.cookies.set(name, value, options)
            } catch (error) {
              console.warn(`Cookie ${name} could not be set in middleware:`, error)
            }
          })
        },
      },
    }
  )
  
  const { pathname } = req.nextUrl

  // Check if DEMO MODE is enabled - bypasses ALL authentication
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  if (demoMode) {
    console.log('🎮 DEMO MODE: Authentication bypassed for:', pathname)
    return res
  }

  // Check if authentication bypass is enabled (for demo/testing)
  const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true'
  if (authBypassEnabled) {
    console.log('🔓 Auth bypass enabled, allowing access to:', pathname)
    return res
  }

  // Check if this is a public route
  if (AUTH_CONFIG.publicRoutes.includes(pathname)) {
    return res
  }

  // Check if local auth fallback is enabled - use NEXT_PUBLIC for consistency
  const localAuthFallbackEnabled = process.env.NEXT_PUBLIC_LOCAL_AUTH_FALLBACK_ENABLED === 'true'
  
  try {
    // Use a shorter timeout and more aggressive fallback
    const sessionPromise = supabase.auth.getSession()
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Session check timeout')), 1000) // Reduced from 2s to 1s
    )

    const result = await Promise.race([sessionPromise, timeoutPromise])
    const { data: { session }, error } = result as any

    if (session && !error) {
      // Basic session exists, allow access
      console.log('✅ Valid session found for middleware check')
      return res
    } else {
      // No valid session, check if we should allow local auth fallback
      if (localAuthFallbackEnabled && pathname.startsWith('/auth/')) {
        console.log('🔄 Local auth fallback enabled, allowing auth routes')
        return res
      }
      
      // For signin page, allow access even without session
      if (pathname === '/signin') {
        console.log('🔐 Allowing access to signin page')
        return res
      }
      
      // Redirect to signin
      console.log('🔐 No valid session, redirecting to signin')
      const redirectUrl = new URL('/signin', req.url)
      redirectUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(redirectUrl)
    }
  } catch (error) {
    console.log('🔐 Session check error or timeout, defaulting to permissive access:', error)
    
    // On any error/timeout, be more permissive to prevent hanging
    // Allow access to most routes and let the client-side handle auth
    console.log('🔄 Allowing access due to middleware timeout/error - client will handle auth')
    return res
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     * - auth routes (to prevent infinite loops)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|api/|auth/|signin|signout|create-user).*)',
  ],
}