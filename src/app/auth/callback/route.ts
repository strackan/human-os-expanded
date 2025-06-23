// src/app/auth/callback/route.ts
import { NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  // Extract search parameters and origin from the request URL
  const { searchParams, origin } = new URL(request.url)

  // Get the authorization code and the 'next' redirect path
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/tasks/do"

  console.log('🔄 Auth callback triggered:', { hasCode: !!code, next, origin })

  if (code) {
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

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      console.log('✅ Session created successfully, redirecting to:', next)
      // Create redirect response and copy cookies from the auth response
      const redirectResponse = NextResponse.redirect(`${origin}${next}`)
      
      // Copy all cookies from the auth response to the redirect response
      response.cookies.getAll().forEach(cookie => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
      })
      
      return redirectResponse
    } else {
      console.error('❌ Session exchange failed:', error)
      // Log more details for debugging
      console.error('❌ Error details:', {
        message: error.message,
        status: error.status,
        name: error.name
      })
    }
  } else {
    console.error('❌ No authorization code received')
  }

  // If there's no code or an error occurred, redirect to an error page
  console.log('🔄 Redirecting to error page')
  return NextResponse.redirect(`${origin}/signin?error=auth_failed`)
}