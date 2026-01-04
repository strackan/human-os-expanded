import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  console.log("🧐 [Middleware] Incoming request:", request.nextUrl.pathname)

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookies = request.cookies.getAll()
          console.log("🧐 [Middleware] Cookies (getAll):", cookies)
          return cookies
        },
        setAll(cookiesToSet) {
          console.log("🧐 [Middleware] Cookies being set:", cookiesToSet)
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and supabase.auth.getUser().
  // A simple mistake could make your entire app vulnerable to session fixation attacks.

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  console.log("🧐 [Middleware] User fetched:", user ? user.email : "No user")
  if (error) console.error("🧐 [Middleware] Error fetching user:", error)

  // Protected routes check
  const { pathname } = request.nextUrl
  const isAuthRoute = pathname === '/signin'
  const isCallbackRoute = pathname === '/auth/callback'
  const isHeroRoute = pathname === '/hero'
  const isJoinRoute = pathname.startsWith('/join') // Public careers/talent application pages
  const isApiRoute = pathname.startsWith('/api/') // API routes handle their own auth
  const isPublicRoute = pathname === '/' || isAuthRoute || isCallbackRoute || isHeroRoute || isJoinRoute || isApiRoute

  console.log("🧐 [Middleware] Route check:", { pathname, isAuthRoute, isCallbackRoute, isJoinRoute, isPublicRoute })

  if (!user && !isPublicRoute) {
    console.log("🧐 [Middleware] No user and not public → redirecting to /signin")
    const url = request.nextUrl.clone()
    url.pathname = '/signin'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute && !isCallbackRoute) {
    console.log("🧐 [Middleware] User already logged in → redirecting to /dashboard")
    const url = request.nextUrl.clone()
    url.pathname = '/login-success'
    return NextResponse.redirect(url)
  }

  console.log("🧐 [Middleware] Passing through, returning supabaseResponse")
  return supabaseResponse
}
