// src/app/api/debug-session/route.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔍 Debug session route called')
    const cookieStore = await cookies()
    
    // Use the same SSR approach as your frontend
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Can be ignored for route handlers
            }
          },
        },
      }
    )
    
    // Get both session and user
    const [sessionResult, userResult] = await Promise.all([
      supabase.auth.getSession(),
      supabase.auth.getUser()
    ])
    
    const session = sessionResult.data.session
    const user = userResult.data.user
    const sessionError = sessionResult.error
    const userError = userResult.error
    
    console.log('🔍 Session debug results:', { 
      hasSession: !!session,
      hasUser: !!user,
      userEmail: user?.email || session?.user?.email,
      sessionError: sessionError?.message,
      userError: userError?.message,
      cookies: cookieStore.getAll().map(c => c.name)
    })
    
    return NextResponse.json({ 
      success: true,
      session: {
        hasSession: !!session,
        hasUser: !!user,
        userEmail: user?.email || session?.user?.email,
        sessionError: sessionError?.message,
        userError: userError?.message,
        cookies: cookieStore.getAll().map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' }))
      }
    })
  } catch (error) {
    console.error('❌ Debug session error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
} 