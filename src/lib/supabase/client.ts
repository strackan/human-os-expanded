// Client-side Supabase client
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // During build, if env vars are missing, return a mock client
  // This prevents build failures while allowing runtime to work properly
  if (!url || !key) {
    console.warn('Supabase env vars not found, returning mock client for build');
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-anon-key'
    )
  }

  return createBrowserClient(url, key)
}