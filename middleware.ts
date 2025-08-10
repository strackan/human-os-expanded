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

  // Check if this is a public route
  if (AUTH_CONFIG.publicRoutes.includes(pathname)) {
    return res
  }

  // Check if local auth fallback is enabled - use NEXT_PUBLIC for consistency
  const localAuthFallbackEnabled = process.env.NEXT_PUBLIC_LOCAL_AUTH_FALLBACK_ENABLED === 'true'
  
  try {
    // Use getUser() instead of getSession() to prevent hanging - per Supabase docs
    const userPromise = supabase.auth.getUser()
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('User check timeout')), 3000) // Reduced timeout
    )

    const { data: { user }, error } = await Promise.race([userPromise, timeoutPromise]) as any

    if (user && !error) {
      // User is authenticated, allow access
      console.log('✅ Authenticated user:', user.email)
      return res
    } else {
      // No valid user, check if we should allow local auth fallback
      if (localAuthFallbackEnabled && pathname.startsWith('/auth/')) {
        console.log('🔄 Local auth fallback enabled, allowing auth routes')
        return res
      }
      
      // Redirect to signin
      console.log('🔐 No valid user, redirecting to signin')
      const redirectUrl = new URL('/signin', req.url)
      redirectUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(redirectUrl)
    }
  } catch (error) {
    console.log('🔐 User check error or timeout, redirecting to signin:', error)
    
    // On timeout or error, check if we should allow local auth fallback
    if (error instanceof Error && error.message.includes('timeout')) {
      console.warn('⚠️ User check timed out, checking local auth fallback')
      
      if (localAuthFallbackEnabled && pathname.startsWith('/auth/')) {
        console.log('🔄 Local auth fallback enabled, allowing auth routes after timeout')
        return res
      }
      
      // For other routes, redirect to signin with fallback message
      const redirectUrl = new URL('/signin', req.url)
      redirectUrl.searchParams.set('next', pathname)
      redirectUrl.searchParams.set('error', 'auth_timeout')
      return NextResponse.redirect(redirectUrl)
    }
    
    // For other errors, redirect to signin
    const redirectUrl = new URL('/signin', req.url)
    redirectUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(redirectUrl)
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
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}