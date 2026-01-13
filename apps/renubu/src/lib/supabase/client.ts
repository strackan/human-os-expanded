// Client-side Supabase client
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('[Supabase Client] Creating client with:', {
    hasUrl: !!url,
    hasKey: !!key,
    url: url?.substring(0, 30) + '...' || 'missing'
  });

  // During build, if env vars are missing, return a mock client
  // This prevents build failures while allowing runtime to work properly
  if (!url || !key) {
    console.warn('[Supabase Client] ⚠️ Supabase env vars not found, returning mock client');
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-anon-key'
    )
  }

  console.log('[Supabase Client] ✓ Creating real Supabase client');
  return createBrowserClient(url, key)
}