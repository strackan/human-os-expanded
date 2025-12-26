import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Check for NextAuth session cookies with different possible names
  // NextAuth uses different cookie names based on environment and configuration
  const possibleCookieNames = [
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
    'authjs.session-token',
    '__Secure-authjs.session-token'
  ];
  
  let sessionToken = null;
  for (const cookieName of possibleCookieNames) {
    sessionToken = request.cookies.get(cookieName)?.value;
    if (sessionToken) {
      break;
    }
  }
  
  // If no session token found, redirect to sign-in
  if (!sessionToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Session token exists - let the pages handle detailed validation
  // This avoids Edge Runtime limitations with database operations
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Protect all app routes except:
     * - / (sign-in page)
     * - /api/* (API routes handle their own auth)
     * - /_next/* (Next.js internal files)
     * - /favicon.ico and other static assets
     */
    '/dashboard/:path*',
    '/entry/:path*', 
    '/entries/:path*',
    '/tasks/:path*',
    '/moods/:path*',
    '/settings/:path*',
    '/snippets/:path*',
    '/sidebar-demo/:path*',
    '/admin/:path*'
  ],
}; 