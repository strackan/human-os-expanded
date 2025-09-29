// src/app/api/check-config/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
    supabase_anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
    service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing',
    node_env: process.env.NODE_ENV,
    url_preview: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 50) + '...',
    anon_key_preview: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
  })
}