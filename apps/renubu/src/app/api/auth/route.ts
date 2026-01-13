import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth error:', error.message)
        return NextResponse.redirect(`${requestUrl.origin}/signin?error=${error.message}`)
      }

      return NextResponse.redirect(`${requestUrl.origin}/`)
    } catch (error) {
      console.error('Auth error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/signin?error=Authentication failed`)
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/signin`)
} 