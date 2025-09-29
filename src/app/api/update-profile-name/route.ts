// /src/app/api/update-profile-name/route.ts - ONE TIME USE
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
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

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Parse the name from user metadata
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || ''
    console.log('Full name from metadata:', fullName)
    
    if (!fullName) {
      return NextResponse.json({ error: 'No full name found in user metadata' }, { status: 400 })
    }

    // Parse "Justin Strackany" into first and last name
    const nameParts = fullName.trim().split(' ').filter((part: string) => part.length > 0)
    
    let first_name = null
    let last_name = null
    
    if (nameParts.length >= 1) {
      first_name = nameParts[0]
    }
    
    if (nameParts.length >= 2) {
      last_name = nameParts[nameParts.length - 1]
    }

    console.log('Parsed names:', { first_name, last_name, full_name: fullName })

    // Update the profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        first_name: first_name,
        last_name: last_name,
        full_name: fullName,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update profile', 
        details: updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      parsed_names: {
        first_name,
        last_name,
        full_name: fullName
      },
      updated_profile: updatedProfile
    })

  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}