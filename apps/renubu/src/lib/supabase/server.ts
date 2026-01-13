import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { shouldUseServiceRoleKey, getDemoModeStatus } from '@/lib/demo-mode-config'

export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check .env.local and restart your dev server.'
    );
  }

  // Check if we should use service role key (only in demo mode on localhost)
  const useServiceRole = shouldUseServiceRoleKey();
  const keyToUse = useServiceRole && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : supabaseKey;

  if (useServiceRole) {
    console.log('🎮 [DEMO MODE] Using service role key to bypass RLS (localhost only)');
    console.log(getDemoModeStatus());
  }

  return createServerClient(
    supabaseUrl,
    keyToUse,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
} 