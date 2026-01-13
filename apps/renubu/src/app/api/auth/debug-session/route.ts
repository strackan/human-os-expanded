import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    console.log('🔍 Debug: Checking session status')
    
    // Create Supabase client with service role key
    const supabase = createServiceRoleClient()
    
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.log('❌ Debug: Session error:', error)
      return NextResponse.json({
        hasSession: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }
    
    if (session) {
      console.log('✅ Debug: Session found for user:', session.user.email)
      return NextResponse.json({
        hasSession: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          created_at: session.user.created_at,
          last_sign_in_at: session.user.last_sign_in_at
        },
        session: {
          expires_at: session.expires_at,
          refresh_token: session.refresh_token ? 'present' : 'missing'
        },
        timestamp: new Date().toISOString()
      })
    } else {
      console.log('⚠️ Debug: No session found')
      return NextResponse.json({
        hasSession: false,
        message: 'No active session',
        timestamp: new Date().toISOString()
      })
    }
    
  } catch (error) {
    console.error('❌ Debug: Session check error:', error)
    return NextResponse.json({
      hasSession: false,
      error: 'Session check failed',
      timestamp: new Date().toISOString()
    })
  }
}
