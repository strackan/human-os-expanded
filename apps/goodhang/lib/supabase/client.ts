import { createBrowserClient } from '@supabase/ssr'

// Cache the client to avoid recreation
let cachedClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  // Return cached client if available
  if (cachedClient) {
    return cachedClient;
  }

  // During SSR/build prerendering, env vars may not be available
  // Return a placeholder that will be replaced on client-side hydration
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Return a mock client for SSR that will be replaced during hydration
    // This prevents build errors while maintaining type safety
    if (typeof window === 'undefined') {
      return createBrowserClient(
        'https://placeholder.supabase.co',
        'placeholder-key'
      );
    }
    throw new Error('Supabase URL and Anon Key are required');
  }

  cachedClient = createBrowserClient(url, key);
  return cachedClient;
}
