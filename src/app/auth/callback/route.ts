import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  console.log("🧐 AUTH CALLBACK HIT", request.nextUrl.toString())

  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'
  const origin = requestUrl.origin

  console.log("🧐 AUTH CALLBACK PARAMS", {
    fullUrl: request.url,
    code,
    next,
    origin,
  })

  if (code) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("🧐 OAuth exchange failed:", error)
        return NextResponse.redirect(`${origin}/signin?error=auth_failed`)
      }

      console.log("🧐 OAuth exchange succeeded, redirecting user to:", `${origin}${next}`)
      return NextResponse.redirect(`${origin}${next}`) // ✅ Go straight to dashboard (or `next`)
    } catch (err) {
      console.error("🧐 Exception during OAuth exchange:", err)
      return NextResponse.redirect(`${origin}/signin?error=auth_exception`)
    }
  }

  console.error("🧐 No code param found, redirecting with error=no_code")
  return NextResponse.redirect(`${origin}/signin?error=no_code`)
}
