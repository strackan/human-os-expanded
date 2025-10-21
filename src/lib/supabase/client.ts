// Client-side Supabase client
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Provide empty strings as fallback during build time
  // The actual client won't be used until runtime
  return createBrowserClient(url, key)
}