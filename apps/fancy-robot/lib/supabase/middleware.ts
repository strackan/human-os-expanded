import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          if (value === undefined || value === null || value === '') return;
          request.cookies.set(name, value)
        })
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => {
          if (value === undefined || value === null || value === '') return;
          supabaseResponse.cookies.set(name, value, options)
        })
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  // Protect /new-site/dashboard/* — redirect to /new-site/login if unauthenticated
  if (request.nextUrl.pathname.startsWith('/new-site/dashboard') && !user) {
    const loginUrl = new URL('/new-site/login', request.url)
    loginUrl.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect /new-site/login to /new-site/dashboard if already authenticated
  if (request.nextUrl.pathname === '/new-site/login' && user) {
    return NextResponse.redirect(new URL('/new-site/dashboard', request.url))
  }

  return supabaseResponse
}
