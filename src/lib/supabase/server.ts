import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './database.types'

export const createClient = async () => {
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
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
              // Only log auth-related cookie errors in development
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