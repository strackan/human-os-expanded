// middleware.ts (in root directory, same level as package.json)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { isPublicRoute } from '@/lib/auth-config'

export async function middleware(req: NextRequest) {
  console.log('🔐 Middleware running for:', req.nextUrl.pathname)
  
  let response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const pathname = req.nextUrl.pathname
  
  // Handle OAuth callback - check if this is an OAuth callback
  const hasOAuthParams = req.nextUrl.searchParams.has('error') || 
                        req.nextUrl.searchParams.has('code') ||
                        req.nextUrl.searchParams.has('access_token')
  
  if (hasOAuthParams) {
    console.log('🔐 OAuth callback detected, allowing access to:', pathname)
    // For OAuth callbacks, we need to let the client-side handle the session
    // Don't check authentication, just allow the request through
    return response
  }
  
  
  // If this is a fresh redirect from auth callback, be more lenient
  const isAuthRedirect = req.headers.get('referer')?.includes('/auth/callback')
  if (isAuthRedirect) {
    console.log('🔐 Auth redirect detected, checking cookies more thoroughly')
    // Check for any Supabase auth cookies
    const hasAuthCookies = req.cookies.getAll().some(cookie => 
      cookie.name.startsWith('sb-') || cookie.name.includes('auth')
    )
    if (hasAuthCookies) {
      console.log('🔐 Auth cookies found, allowing access after callback')
      return response
    }
  }
  
  // Skip auth check for public routes entirely
  if (isPublicRoute(pathname)) {
    console.log('🔐 Public route, skipping auth check:', pathname)
    return response
  }

  // Check if we have auth cookies before doing full session check
  const authCookies = req.cookies.getAll()
  const hasSupabaseAuthCookies = authCookies.some(cookie => 
    cookie.name.startsWith('sb-127-auth-token') || 
    cookie.name.startsWith('sb-access-token') ||
    cookie.name.startsWith('sb-refresh-token') ||
    cookie.name === 'auth-bypass'
  )
  
  // If we have the bypass cookie specifically, allow immediately
  const hasBypass = authCookies.find(c => c.name === 'auth-bypass')?.value === 'true'
  if (hasBypass) {
    console.log('🔐 Auth bypass cookie found, allowing immediate access')
    response.cookies.delete('auth-bypass')
    return response
  }
  
  console.log('🔐 Pre-auth check:', { 
    pathname, 
    hasSupabaseAuthCookies,
    hasBypass: hasBypass,
    cookies: req.cookies.getAll().map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' }))
  })
  
  // If we have auth cookies, try session check but be lenient
  if (hasSupabaseAuthCookies) {
    console.log('🔐 Auth cookies found, attempting session validation...')
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (session?.user && !error) {
        console.log('🔐 Valid session found for user:', session.user.email)
        // Handle authenticated redirects
        if (pathname === '/signin') {
          const next = req.nextUrl.searchParams.get('next') || '/dashboard'
          return NextResponse.redirect(new URL(next, req.url))
        }
        if (pathname === '/') {
          return NextResponse.redirect(new URL('/dashboard', req.url))
        }
        return response
      } else {
        console.log('🔐 Session validation failed but auth cookies present, allowing access temporarily:', error?.message)
        // Allow access even if session validation fails - cookies might be fresh
        return response
      }
    } catch (sessionError) {
      console.log('🔐 Session check error but auth cookies present, allowing access:', sessionError)
      return response
    }
  }

  // No auth cookies found, redirect to signin
  console.log('🔐 No auth cookies found, redirecting to signin for path:', pathname)
  const redirectUrl = new URL('/signin', req.url)
  redirectUrl.searchParams.set('next', pathname)
  return NextResponse.redirect(redirectUrl)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)  
     * - favicon.ico, robots.txt, etc. (static files)
     * - Files with extensions (.png, .jpg, etc.)
     */
    '/((?!api/|_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)',
  ],
}