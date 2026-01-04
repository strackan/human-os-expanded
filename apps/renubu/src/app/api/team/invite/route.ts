// /src/app/api/team/invite/route.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
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

    // Get current user's profile to check admin status and company
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id, is_admin, status')
      .eq('id', user.id)
      .single()

    if (profileError || !currentProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check if user is admin
    if (!currentProfile.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get email from request
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Check if user already exists with this email
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email, status, company_id')
      .eq('email', email)
      .maybeSingle()

    if (existingProfile) {
      if (existingProfile.company_id === currentProfile.company_id) {
        return NextResponse.json(
          { error: 'User already exists in your company' },
          { status: 400 }
        )
      } else {
        return NextResponse.json(
          { error: 'User already belongs to another company' },
          { status: 400 }
        )
      }
    }

    // Create pending invitation profile
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        email: email.toLowerCase(),
        company_id: currentProfile.company_id,
        status: 2, // Pending
        is_admin: false
      })
      .select('id, email, status, created_at')
      .single()

    if (insertError) {
      console.error('Error creating invitation:', insertError)
      throw insertError
    }

    // TODO: Send invitation email here
    // For now, we just create the pending profile

    return NextResponse.json({
      success: true,
      invitation: newProfile
    })
  } catch (error: unknown) {
    console.error('API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
