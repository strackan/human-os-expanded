import { NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Create response object
    let response = NextResponse.next()
    
    // Create Supabase client using the same pattern as middleware
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

    // Sign out the user
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('❌ Sign out error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ User signed out successfully')
    
    // Redirect to signin page
    return NextResponse.redirect(new URL('/signin', request.url))
  } catch (error) {
    console.error('❌ Sign out failed:', error)
    return NextResponse.json({ error: 'Sign out failed' }, { status: 500 })
  }
} 