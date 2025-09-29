// src/lib/supabase-server.ts (SERVER ONLY)
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Server-side Supabase client for API routes and server components
export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies()
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
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
              // Only log in development and only for auth-related cookies
              if (process.env.NODE_ENV === 'development' && name.includes('auth')) {
                console.warn(`Cookie ${name} could not be set in this context:`, error instanceof Error ? error.message : String(error))
              }
            }
          })
        },
      },
    }
  )
}

// Service role client for server-side operations that bypass RLS
export const createServiceRoleClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase service role environment variables')
  }
  
  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Helper function to get current user on server with timeout
export const getCurrentUser = async () => {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Use Promise.race to prevent hanging
    const userPromise = supabase.auth.getUser()
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('getUser timeout')), 3000)
    )
    
    const { data: { user }, error } = await Promise.race([userPromise, timeoutPromise]) as any
    return { user, error }
  } catch (error) {
    console.error('Error getting current user:', error)
    return { user: null, error }
  }
}

// Helper function to get session on server
export const getSession = async () => {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  } catch (error) {
    console.error('Error getting session:', error)
    return { session: null, error }
  }
}

// Helper function to get current session (alias for getSession)
export const getCurrentSession = async () => {
  return getSession()
}

// Helper function to validate session consistency
export const validateSessionConsistency = async () => {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      return { isValid: false, error }
    }
    
    if (!session) {
      return { isValid: false, error: new Error('No session found') }
    }
    
    // Check if session is expired
    if (session.expires_at && new Date(session.expires_at * 1000) < new Date()) {
      return { isValid: false, error: new Error('Session expired') }
    }
    
    return { isValid: true, session }
  } catch (error) {
    console.error('Error validating session consistency:', error)
    return { isValid: false, error }
  }
}

// Helper function to check auth cookies
export const checkAuthCookies = async () => {
  try {
    const cookieStore = await cookies()
    const authCookies = cookieStore.getAll().filter(cookie => 
      cookie.name.includes('auth') || cookie.name.includes('supabase')
    )
    
    return {
      hasAuthCookies: authCookies.length > 0,
      cookieCount: authCookies.length,
      cookies: authCookies
    }
  } catch (error) {
    console.error('Error checking auth cookies:', error)
    return {
      hasAuthCookies: false,
      cookieCount: 0,
      cookies: [],
      error
    }
  }
}