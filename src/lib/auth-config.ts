// src/lib/auth-config.ts
// Centralized authentication configuration

export const AUTH_CONFIG = {
  // Public routes that don't require authentication
  publicRoutes: [
    '/', // Root landing page
    '/signin',
    '/auth/callback', 
    '/auth/signout',
    '/clear-cookies.html',
    '/test-signout',
    '/auth-success',
    '/manual-auth',
    '/debug-auth-state',
    '/debug-env',
    '/api/debug-session', // Debug session route
    '/test-auth-flow', // Test auth flow page
    '/test-oauth-setup', // OAuth setup test page
    '/test-oauth',
    '/test-oauth-simple',
    '/test-oauth-debug',
    '/test-oauth-flow',
    '/test-pkce',
    '/test-simple-auth',
    '/test-auth',
    '/clear-auth',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    // Supabase internal callback URLs (for local development)
    '/auth/v1/callback'
  ],

  // Default redirect paths
  defaultRedirects: {
    authenticated: '/dashboard',
    unauthenticated: '/signin'
  },

  // OAuth configuration
  oauth: {
    providers: ['google'],
    redirectTo: '/auth/callback'
  }
}

// Helper function to check if a route is public
export function isPublicRoute(pathname: string): boolean {
  return AUTH_CONFIG.publicRoutes.some(route => 
    pathname === route || (route !== '/' && pathname.startsWith(route))
  )
}

// Helper function to get the next redirect URL
export function getNextRedirect(pathname: string, defaultPath: string = '/dashboard'): string {
  // If the current path is public, redirect to default
  if (isPublicRoute(pathname)) {
    return defaultPath
  }
  
  // Otherwise, redirect back to the original path
  return pathname
} 