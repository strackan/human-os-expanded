// /src/app/api/team/[userId]/promote/route.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const cookieStore = await cookies()
    const { userId } = await params

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

    // Get current user's profile to check admin status
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id, is_admin, status')
      .eq('id', user.id)
      .single()

    if (profileError || !currentProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check if current user is admin
    if (!currentProfile.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get the target user
    const { data: targetUser, error: targetError } = await supabase
      .from('profiles')
      .select('id, company_id, is_admin')
      .eq('id', userId)
      .single()

    if (targetError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if target user is in the same company
    if (targetUser.company_id !== currentProfile.company_id) {
      return NextResponse.json({ error: 'User not in your company' }, { status: 403 })
    }

    // Get the new admin status from request
    const { is_admin } = await request.json()

    if (typeof is_admin !== 'boolean') {
      return NextResponse.json({ error: 'is_admin must be a boolean' }, { status: 400 })
    }

    // Update the user's admin status
    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({ is_admin })
      .eq('id', userId)
      .select('id, email, is_admin')
      .single()

    if (updateError) {
      console.error('Error updating admin status:', updateError)
      throw updateError
    }

    return NextResponse.json({
      success: true,
      user: updated
    })
  } catch (error: unknown) {
    console.error('API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
