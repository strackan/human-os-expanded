// src/lib/auth-config.ts
// Centralized authentication configuration

export const AUTH_CONFIG = {
  // Public routes that don't require authentication
  publicRoutes: [
    '/', // Root landing page
    '/signin',
    '/create-user', // User creation page
    '/auth/callback',
    '/auth/signout',
    '/auth/reset-password',
    '/auth/setup-password',
    '/clear-cookies.html',
    '/debug-auth', // Add debug page
    '/test-auth', // Add test page
    '/test', // Test pages (including /test/calendar)
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml'
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