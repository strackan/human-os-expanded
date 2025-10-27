// src/app/api/contracts/route.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Can be ignored for route handlers
            }
          },
        },
      }
    )

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get contracts with customer details
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        customers (
          id,
          name,
          industry,
          health_score,
          current_arr
        )
      `)
      .order('end_date', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    return NextResponse.json(data || [])
  } catch (error: unknown) {
    console.error('API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// Temporary shim: if anything issues POST, reuse GET so you don't get 405s
export async function POST(_request: Request) {
  return GET();
}
