// middleware.ts (in root directory, same level as package.json)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
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

  // Use getUser() instead of getSession() for better security
  const { data: { user }, error } = await supabase.auth.getUser()
  const pathname = req.nextUrl.pathname

  console.log('🔐 Middleware - Auth check:', {
    pathname,
    hasUser: !!user,
    userEmail: user?.email,
    error: error?.message,
    cookies: req.cookies.getAll().map(c => c.name)
  })

  // Public routes - updated to include new auth callback route
  const publicRoutes = ['/login', '/signin', '/auth/callback', '/api/auth/callback', '/test-oauth', '/test-oauth-simple', '/debug-env']
  const isPublic = publicRoutes.some(route => pathname.startsWith(route))
  const isStatic = pathname.startsWith('/_next') || pathname.startsWith('/public') || pathname === '/favicon.ico' || pathname.startsWith('/logo.png')

  // If not authenticated and not public/static, redirect to signin
  if (!user && !isPublic && !isStatic) {
    console.log('🔐 Redirecting to signin - no user')
    const redirectUrl = new URL('/signin', req.url)
    redirectUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If authenticated and on login, redirect to dashboard or next
  if (user && pathname === '/login') {
    console.log('🔐 Redirecting to dashboard - user already logged in')
    const next = req.nextUrl.searchParams.get('next') || '/dashboard'
    return NextResponse.redirect(new URL(next, req.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}