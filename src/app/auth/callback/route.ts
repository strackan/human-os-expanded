// src/app/auth/callback/route.ts
import { NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  // Extract search parameters and origin from the request URL
  const { searchParams, origin } = new URL(request.url)

  // Get the OAuth code and next redirect path
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  console.log('🔄 Auth callback triggered:', { code: !!code, next, origin })

  if (!code) {
    console.error('❌ No OAuth code received')
    return NextResponse.redirect(`${origin}/signin?error=no_code`)
  }

  // Create response object first
  let response = NextResponse.next()
  
  // Create a Supabase client using the same pattern as middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Exchange the OAuth code for a session
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('❌ Auth callback error:', error)
    return NextResponse.redirect(`${origin}/signin?error=${encodeURIComponent(error.message)}`)
  }

  if (!data.session) {
    console.error('❌ No session created from OAuth code')
    return NextResponse.redirect(`${origin}/signin?error=no_session`)
  }

  console.log('✅ Auth callback successful, session created for user:', data.session.user.email)
  console.log('✅ Session cookies set:', response.cookies.getAll().map(c => c.name))
  
  // Verify the session was created properly
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    console.error('❌ Session verification failed:', userError)
    return NextResponse.redirect(`${origin}/signin?error=session_verification_failed`)
  }
  
  console.log('✅ Session verified successfully for user:', user.email)
  
  // Copy all cookies from the auth response to ensure they're set
  response.cookies.getAll().forEach(cookie => {
    response.cookies.set(cookie.name, cookie.value, {
      ...cookie,
      httpOnly: false, // Allow client-side access for better sync
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })
  })
  
  // Instead of server-side redirect, return HTML that does immediate client-side redirect
  // This ensures cookies are set before the redirect happens
  const redirectHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Redirecting...</title>
      <script>
        // Immediate redirect - cookies are set before this executes
        window.location.replace('${next}');
      </script>
    </head>
    <body style="margin:0;padding:0;"></body>
    </html>
  `
  
  console.log('✅ Returning redirect HTML for:', next)
  
  return new Response(redirectHtml, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
      'Set-Cookie': response.headers.getSetCookie?.() || []
    }
  })
}