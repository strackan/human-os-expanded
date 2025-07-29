// src/lib/supabase-server.ts (SERVER ONLY)
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Server-side Supabase client for API routes and server components
export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies()
  
  return createServerClient(
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
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Helper function to get current user on server
export const getCurrentUser = async () => {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()
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