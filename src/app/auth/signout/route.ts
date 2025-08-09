// src/app/auth/signout/route.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  console.log('🔐 Server-side signout endpoint called')
  
  // Parse the request body to get scope
  let scope: 'global' | 'local' | 'others' = 'global'
  try {
    const body = await request.json()
    if (body.scope && ['global', 'local', 'others'].includes(body.scope)) {
      scope = body.scope
    }
    console.log('🔐 Signout scope:', scope)
  } catch (error) {
    console.log('⚠️ Could not parse request body, using default scope:', error)
  }
  
  const cookieStore = await cookies()
  const response = NextResponse.json({ success: true, message: 'Signed out successfully', scope })
  
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
              response.cookies.set(name, value, options)
            } catch (error) {
              console.error(`Failed to set cookie ${name}:`, error)
            }
          })
        },
      },
    }
  )

  try {
    const result = await supabase.auth.signOut({ scope })
    console.log('✅ Server-side signout successful with scope:', scope, result)
    
    // Clear auth cookies manually as backup
    const authCookies = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token', 'supabase.auth.token']
    authCookies.forEach(cookieName => {
      response.cookies.delete(cookieName)
      response.cookies.set(cookieName, '', { 
        expires: new Date(0),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      })
    })
    
    return response
  } catch (error) {
    console.error('❌ Server-side signout error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Signout failed', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}