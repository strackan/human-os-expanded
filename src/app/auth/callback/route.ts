// src/app/auth/callback/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  // Extract search parameters and origin from the request URL
  const { searchParams, origin } = new URL(request.url)

  // Get the authorization code and the 'next' redirect path
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  console.log('🔄 Auth callback triggered:', { hasCode: !!code, next, origin })

  if (code) {
    // Create a Supabase client
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      console.log('✅ Session created successfully, redirecting to:', next)
      // If successful, redirect to the 'next' path or home
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      console.error('❌ Session exchange failed:', error)
    }
  } else {
    console.error('❌ No authorization code received')
  }

  // If there's no code or an error occurred, redirect to an error page
  console.log('🔄 Redirecting to error page')
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}