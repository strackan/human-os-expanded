// src/app/auth/signout/route.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  
  // Parse the request body to get scope
  let scope: 'global' | 'local' | 'others' = 'global'
  try {
    const body = await request.json()
    if (body.scope && ['global', 'local', 'others'].includes(body.scope)) {
      scope = body.scope
    }
  } catch (error) {
    console.log('⚠️ Could not parse request body, using default scope')
  }
  
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
    await supabase.auth.signOut({ scope })
    console.log('✅ Server-side signout successful with scope:', scope)
    return NextResponse.json({ success: true, message: 'Signed out successfully', scope })
  } catch (error) {
    console.error('❌ Server-side signout error:', error)
    return NextResponse.json({ success: false, message: 'Signout failed' }, { status: 500 })
  }
}