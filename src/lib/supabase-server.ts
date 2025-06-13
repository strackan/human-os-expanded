// src/lib/supabase-server.ts (SERVER ONLY)
import { createServerClient } from '@supabase/ssr'
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
              // Handle read-only cookie store in some contexts
              console.error(`Failed to set cookie ${name}:`, error)
            }
          })
        },
      },
    }
  )
}

// Helper function to get current user on server
export const getCurrentUser = async () => {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}