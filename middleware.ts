// middleware.ts (in root directory, same level as package.json)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  console.log('🚀🚀🚀 MIDDLEWARE IS RUNNING:', request.nextUrl.pathname)
  console.log('🔥🔥🔥 THIS SHOULD SHOW UP IN TERMINAL')
  return NextResponse.next()
}

export const config = {
  matcher: '/(.*)',  // Match everything
}