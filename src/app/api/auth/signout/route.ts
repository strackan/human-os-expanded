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
    // Sign out from Supabase with timeout
    const signoutPromise = supabase.auth.signOut()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Server signout timeout')), 5000)
    )
    
    const { error } = await Promise.race([signoutPromise, timeoutPromise]) as any
    
    if (error) {
      console.error('Sign out error:', error)
      // Don't return error, continue with redirect anyway
    } else {
      console.log('✅ Server-side Supabase signout successful')
    }

    // Create redirect response that clears all auth cookies
    const response = NextResponse.redirect(new URL('/signin', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'))
    
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

    console.log('✅ Signout completed successfully, redirecting to /signin')
    return response
  } catch (error) {
    console.error('Unexpected error during sign out:', error)
    // Even if there's an error, redirect to signin
    const response = NextResponse.redirect(new URL('/signin', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'))
    console.log('✅ Signout failed but redirecting to /signin anyway')
    return response
  }
} 