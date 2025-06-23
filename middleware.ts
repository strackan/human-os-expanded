// middleware.ts (in root directory, same level as package.json)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

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

  // Define route types
  const publicRoutes = ['/signin', '/auth/callback', '/clear-cookies.html']
  const isPublic = publicRoutes.some(route => pathname.startsWith(route))
  
  // Skip auth check for these routes entirely
  if (isPublic) {
    console.log('🔐 Public route, skipping auth check:', pathname)
    return response
  }

  // Use getUser() instead of getSession() for better security
  const { data: { user }, error } = await supabase.auth.getUser()
  
  // Log detailed auth state for debugging
  console.log('🔐 Auth check result:', { 
    pathname, 
    hasUser: !!user, 
    error: error?.message,
    cookies: req.cookies.getAll().map(c => c.name) 
  })

  // If not authenticated, redirect to signin
  if (!user || error) {
    console.log('🔐 Redirecting to signin - no valid user for path:', pathname)
    const redirectUrl = new URL('/signin', req.url)
    redirectUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If authenticated and on signin page, redirect to next or dashboard
  if (user && pathname === '/signin') {
    console.log('🔐 Redirecting authenticated user away from signin')
    const next = req.nextUrl.searchParams.get('next') || '/dashboard'
    return NextResponse.redirect(new URL(next, req.url))
  }

  console.log('🔐 Allowing access to:', pathname)
  return response
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