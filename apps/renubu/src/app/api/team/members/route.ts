// /src/app/api/team/members/route.ts
/**
 * Team Members API
 *
 * GET /api/team/members
 * - Returns all team members (admin only)
 *
 * GET /api/team/members?search=query
 * - Search team members by name/email (any authenticated user)
 * - Supports escalation and assignment use cases
 */
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const searchQuery = request.nextUrl.searchParams.get('search')

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

    // Get current user's profile to check company
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id, is_admin, status')
      .eq('id', user.id)
      .single()

    if (profileError || !currentProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Search mode: any authenticated user can search team members
    if (searchQuery && searchQuery.length >= 2) {
      const { data: members, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('company_id', currentProfile.company_id)
        .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(10)

      if (error) {
        console.error('Supabase search error:', error)
        throw error
      }

      return NextResponse.json({ members: members || [] })
    }

    // Full list mode: admin only
    if (!currentProfile.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get all team members from the same company
    const { data: members, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, status, is_admin, created_at')
      .eq('company_id', currentProfile.company_id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    return NextResponse.json(members || [])
  } catch (error: unknown) {
    console.error('API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
