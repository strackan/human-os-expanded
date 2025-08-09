// middleware.ts (in root directory, same level as package.json)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { isPublicRoute } from '@/lib/auth-config'

export async function middleware(req: NextRequest) {
  console.log('🔐 Middleware running for:', req.nextUrl.pathname)
  
  let response = NextResponse.next()
  
  // Check if environment variables are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables in middleware')
    // For development, allow the request to continue
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Development mode: allowing request to continue without auth check')
      return response
    }
    // For production, redirect to error page
    return NextResponse.redirect(new URL('/error', req.url))
  }
  
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() { 
          return req.cookies.getAll() 
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              req.cookies.set(name, value)
              response.cookies.set(name, value, options)
            } catch (error) {
              // Only log auth-related cookie errors in development
              if (process.env.NODE_ENV === 'development' && name.includes('auth')) {
                console.warn(`Cookie ${name} could not be set in middleware:`, error instanceof Error ? error.message : String(error))
              }
            }
          })
        },
      },
    }
  )

  const pathname = req.nextUrl.pathname
  
  // Skip auth check for public routes
  if (isPublicRoute(pathname)) {
    console.log('🔐 Public route, skipping auth check:', pathname)
    return response
  }

  // Check authentication
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
        return response
      }
      return response
    } else {
      console.log('🔐 No valid session, redirecting to signin for path:', pathname)
      const redirectUrl = new URL('/signin', req.url)
      redirectUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(redirectUrl)
    }
  } catch (error) {
    console.log('🔐 Session check error, redirecting to signin:', error)
    const redirectUrl = new URL('/signin', req.url)
    redirectUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(redirectUrl)
  }
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