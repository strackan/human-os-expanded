import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('OAuth callback error:', error)
      return NextResponse.redirect(`${origin}/signin?error=auth_failed`)
    }
    
    // Redirect to client-side page for session handling
    return NextResponse.redirect(`${origin}/auth/callback?success=true&next=${encodeURIComponent(next)}`)
  }

  return NextResponse.redirect(`${origin}/signin?error=no_code`)
}