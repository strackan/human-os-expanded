// src/app/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  console.log('🔄 Auth callback triggered')
  
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  console.log('📝 Callback params:', { 
    hasCode: !!code, 
    next,
    origin,
    url: request.url,
    error,
    errorDescription
  })

  if (error) {
    console.error('❌ Auth error received:', { error, errorDescription })
    return NextResponse.redirect(`${origin}/login?error=${error}`)
  }

  if (code) {
    console.log('✅ Auth code received, exchanging for session')
    
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                cookieStore.set(name, value, options)
              } catch (error) {
                console.error(`Failed to set cookie ${name}:`, error)
              }
            })
          },
        },
      }
    )

    const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!sessionError) {
      console.log('✅ Session created successfully:', { 
        user: data?.user?.email,
        session: !!data?.session
      })
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      console.error('❌ Session exchange failed:', sessionError)
    }
  } else {
    console.error('❌ No auth code received in callback')
  }

  // Return to login with error if something went wrong
  console.log('🔄 Redirecting to login due to error')
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}