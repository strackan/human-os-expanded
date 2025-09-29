// src/app/api/auth/debug/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    const debugInfo = {
      // Environment variables
      nodeEnv: process.env.NODE_ENV,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'missing',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'missing',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'missing',
      
      // Authentication state
      hasSession: !!session,
      hasUser: !!user,
      sessionError: sessionError?.message || null,
      userError: userError?.message || null,
      
      // User info (if available)
      userEmail: user?.email || null,
      userId: user?.id || null,
      
      // Session info (if available)
      sessionExpiresAt: session?.expires_at || null,
      sessionRefreshToken: !!session?.refresh_token,
      sessionAccessToken: !!session?.access_token,
      
      // Timestamp
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(debugInfo)
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 