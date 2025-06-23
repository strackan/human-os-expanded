import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
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

  try {
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Sign out error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Create response that clears all auth cookies
    const response = NextResponse.json({ success: true })
    
    // Clear all auth-related cookies
    const allCookies = cookieStore.getAll()
    allCookies.forEach(cookie => {
      if (cookie.name.includes('auth-token') || cookie.name.includes('supabase') || cookie.name.includes('sb-')) {
        response.cookies.set(cookie.name, '', {
          expires: new Date(0),
          path: '/',
        })
        console.log(`Cleared cookie: ${cookie.name}`)
      }
    })

    return response
  } catch (error) {
    console.error('Unexpected error during sign out:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 