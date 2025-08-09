// src/app/api/auth/refresh/route.ts
import { NextResponse } from 'next/server'
import { validateSessionConsistency, getCurrentUser } from '@/lib/supabase-server'

export async function POST() {
  try {
    console.log('🔄 Session refresh API: Validating session consistency...')
    
    const validation = await validateSessionConsistency()
    const { user, error: userError } = await getCurrentUser()
    
    console.log('🔍 Session refresh results:', {
      isValid: validation.isValid,
      error: validation.error,
      hasUser: !!user,
      userError: userError ? String(userError) : null
    })
    
    if (validation.isValid && user) {
      console.log('✅ Session is valid for user:', user.email)
      
      return NextResponse.json({
        success: true,
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        session: {
          expires_at: validation.session?.expires_at,
          expires_in: validation.session?.expires_at ? 
            Math.max(0, validation.session.expires_at - Math.floor(Date.now() / 1000)) : null
        },
        timestamp: new Date().toISOString()
      })
    } else {
      console.log('⚠️ Session validation failed:', validation.error)
      
      return NextResponse.json({
        success: false,
        authenticated: false,
        error: validation.error || 'Session validation failed',
        user: null,
        session: null,
        timestamp: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error('🔍 Session refresh API: Unexpected error:', error)
    
    return NextResponse.json({
      success: false,
      authenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      user: null,
      session: null,
      timestamp: new Date().toISOString()
    })
  }
} 