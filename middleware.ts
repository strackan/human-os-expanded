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

  // Use getUser() instead of getSession() for better security
  const { data: { user }, error } = await supabase.auth.getUser()
  const pathname = req.nextUrl.pathname

  // Public routes
  const publicRoutes = ['/signin', '/auth/callback', '/clear-cookies.html']
  const isPublic = publicRoutes.some(route => pathname.startsWith(route))
  const isStatic = pathname.startsWith('/_next') || pathname === '/favicon.ico' || pathname.startsWith('/logo.png')
  const isApi = pathname.startsWith('/api/')

  // If not authenticated and not public/static/api, redirect to signin
  if (!user && !isPublic && !isStatic && !isApi) {
    console.log('🔐 Redirecting to signin - no user for path:', pathname)
    const redirectUrl = new URL('/signin', req.url)
    redirectUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If authenticated and on signin, redirect to dashboard or next
  if (user && pathname === '/signin') {
    console.log('🔐 Redirecting to dashboard - user already logged in')
    const next = req.nextUrl.searchParams.get('next') || '/'
    return NextResponse.redirect(new URL(next, req.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}