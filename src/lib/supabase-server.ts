// src/lib/supabase-server.ts (SERVER ONLY)

/**
 * 🤖 AGENT REMINDER - CRITICAL SECURITY:
 * When querying with these clients, ALWAYS filter by user_id or organization_id!
 *
 * ❌ BAD:  .from('customers').select('*')
 * ✅ GOOD: .from('customers').select('*').eq('user_id', userId)
 *
 * See .claude/QA-GUIDE.md section 4 for security checklist
 */

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

/**
 * Get authenticated Supabase client for API routes (TWO-CLIENT PATTERN)
 *
 * This is the DEFAULT way to handle authentication + RLS bypass in demo mode.
 *
 * Pattern from renubu.demo:
 * - Always use server client for authentication (auth.getUser())
 * - Use service role client for DB queries in demo mode (bypasses RLS)
 * - This separates authentication from RLS bypass
 *
 * @returns Object with user and supabase client
 *
 * @example
 * ```ts
 * export async function GET() {
 *   const { user, supabase, error } = await getAuthenticatedClient();
 *   if (error || !user) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   }
 *
 *   // Now use supabase for DB queries (bypasses RLS in demo mode)
 *   const { data } = await supabase.from('customers').select('*');
 *   return NextResponse.json(data);
 * }
 * ```
 */
export async function getAuthenticatedClient() {
  try {
    // Check if demo mode or auth bypass is enabled (following renubu.demo pattern)
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';

    // Always use server client for authentication
    const authSupabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return {
        user: null,
        supabase: authSupabase,
        error: authError || new Error('No user found')
      };
    }

    // Use service role client for database queries in demo mode to bypass RLS
    const supabase = (isDemoMode || authBypassEnabled)
      ? createServiceRoleClient()
      : authSupabase;

    return {
      user,
      supabase,
      error: null,
      isDemoMode: isDemoMode || authBypassEnabled
    };
  } catch (error) {
    console.error('Error in getAuthenticatedClient:', error);
    return {
      user: null,
      supabase: await createServerSupabaseClient(),
      error: error instanceof Error ? error : new Error('Unknown error')
    };
  }
}

/**
 * Get user's company_id from profiles table
 *
 * Helper to get the company_id for multi-tenant filtering.
 * Uses the supabase client from getAuthenticatedClient() which bypasses RLS in demo mode.
 *
 * @param userId - The user ID to look up
 * @param supabase - The Supabase client to use (from getAuthenticatedClient)
 * @returns The company_id or null
 *
 * @example
 * ```ts
 * const { user, supabase } = await getAuthenticatedClient();
 * const companyId = await getUserCompanyId(user.id, supabase);
 * if (!companyId) {
 *   return NextResponse.json({ error: 'No company' }, { status: 403 });
 * }
 * ```
 */
export async function getUserCompanyId(userId: string, supabase: any): Promise<string | null> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .single();

    return profile?.company_id || null;
  } catch (error) {
    console.error('Error getting user company_id:', error);
    return null;
  }
}