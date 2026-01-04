import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Validate environment variables before creating client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables in middleware');
    return supabaseResponse; // Return early without Supabase initialization
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            // Skip setting cookies with undefined or invalid values
            if (value === undefined || value === null || value === '') {
              console.warn(`Skipping cookie "${name}" with invalid value:`, value);
              return;
            }
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            // Skip setting cookies with undefined or invalid values
            if (value === undefined || value === null || value === '') {
              console.warn(`Skipping response cookie "${name}" with invalid value:`, value);
              return;
            }
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Check membership status for protected routes
  if (user && (
    request.nextUrl.pathname.startsWith('/members') &&
    !request.nextUrl.pathname.startsWith('/members/pending') &&
    !request.nextUrl.pathname.startsWith('/members/directory')
  )) {
    // Get user profile to check membership status
    const { data: profile } = await supabase
      .from('profiles')
      .select('membership_status')
      .eq('id', user.id)
      .single()

    // Redirect pending users to pending page
    if (profile?.membership_status === 'pending') {
      return NextResponse.redirect(new URL('/members/pending', request.url))
    }

    // Block suspended users
    if (profile?.membership_status === 'suspended') {
      return NextResponse.redirect(new URL('/suspended', request.url))
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely.

  return supabaseResponse
}
