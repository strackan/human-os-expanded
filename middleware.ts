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
    // Use getSession() for basic middleware checks to prevent hanging
    // The client-side will handle proper user validation via API route
    const { data: { session }, error } = await supabase.auth.getSession()

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
    console.log('🔐 Session check error, redirecting to signin:', error)
    
    // Check if we should allow local auth fallback
    if (localAuthFallbackEnabled && pathname.startsWith('/auth/')) {
      console.log('🔄 Local auth fallback enabled, allowing auth routes after error')
      return res
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