import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
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

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make your entire
  // app vulnerable to session fixation attacks.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes check
  const { pathname } = request.nextUrl
  const isAuthRoute = pathname === '/signin'
  const isCallbackRoute = pathname === '/auth/callback'
  const isHeroRoute = pathname === '/hero'
  const isPublicRoute = pathname === '/' || isAuthRoute || isCallbackRoute || isHeroRoute

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/signin'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute && !isCallbackRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login-success'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}