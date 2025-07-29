// src/app/api/auth/status/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser, getCurrentSession, validateSessionConsistency, checkAuthCookies } from '@/lib/supabase-server'

export async function GET() {
  try {
    console.log('🔍 Auth status API: Checking server-side authentication...')
    
    // Check for auth cookies first
    const cookieCheck = await checkAuthCookies()
    
    // Use the new validation function for comprehensive session checking
    const validation = await validateSessionConsistency()
    
    // Also get individual user and session data for detailed debugging
    const { user, error: userError } = await getCurrentUser()
    const { session, error: sessionError } = await getCurrentSession()
    
    console.log('🔍 Auth status API: Server-side results:', {
      hasAuthCookies: cookieCheck.hasAuthCookies,
      authCookieNames: cookieCheck.cookies.map(c => c.name),
      validationValid: validation.isValid,
      validationError: validation.error,
      hasUser: !!user,
      hasSession: !!session,
      userError: userError ? String(userError) : null,
      sessionError: sessionError ? String(sessionError) : null
    })
    
    return NextResponse.json({
      authenticated: validation.isValid && !!validation.user,
      user: validation.user ? {
        id: validation.user.id,
        email: validation.user.email,
        created_at: validation.user.created_at
      } : null,
      session: validation.session ? {
        access_token: validation.session.access_token ? 'present' : 'missing',
        refresh_token: validation.session.refresh_token ? 'present' : 'missing',
        expires_at: validation.session.expires_at,
        expires_in: validation.session.expires_at ? 
          Math.max(0, validation.session.expires_at - Math.floor(Date.now() / 1000)) : null
      } : null,
      cookies: {
        hasAuthCookies: cookieCheck.hasAuthCookies,
        authCookieNames: cookieCheck.cookies.map(c => c.name),
        error: cookieCheck.error
      },
      validation: {
        isValid: validation.isValid,
        error: validation.error,
        sessionExists: !!validation.session,
        userExists: !!validation.user
      },
      errors: {
        user: userError ? String(userError) : null,
        session: sessionError ? String(sessionError) : null,
        validation: validation.error,
        cookies: cookieCheck.error
      },
      server_side: {
        has_user: !!user,
        has_session: !!session,
        validation_valid: validation.isValid,
        has_auth_cookies: cookieCheck.hasAuthCookies,
        user_error: userError ? String(userError) : null,
        session_error: sessionError ? String(sessionError) : null,
        validation_error: validation.error,
        cookie_error: cookieCheck.error
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('🔍 Auth status API: Unexpected error:', error)
    return NextResponse.json({
      authenticated: false,
      user: null,
      session: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      cookies: {
        hasAuthCookies: false,
        authCookieNames: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      validation: {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionExists: false,
        userExists: false
      },
      server_side: {
        has_user: false,
        has_session: false,
        validation_valid: false,
        has_auth_cookies: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString()
    })
  }
} 