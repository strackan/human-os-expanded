import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  // Get the origin from the request headers
  const origin = request.headers.get('origin') || 'http://localhost:3200'
  return NextResponse.redirect(new URL('/', origin))
}
