// /src/app/api/debug-profile/route.ts - FIXED VERSION using SSR
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('Debug profile route called')
    const cookieStore = await cookies()
    
    // Use the same SSR approach as your frontend
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
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    console.log('Auth check result:', { 
      hasUser: !!user, 
      userError: userError?.message,
      userId: user?.id 
    })
    
    if (userError) {
      return NextResponse.json({ 
        error: 'Auth error', 
        details: userError.message,
        debug: {
          cookies_found: cookieStore.getAll().map(c => c.name),
          error_code: userError.name
        }
      }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ 
        error: 'No authenticated user found',
        debug: {
          cookies_found: cookieStore.getAll().map(c => c.name)
        }
      }, { status: 401 })
    }

    // Get the profile from our database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Get company information if profile has company_id
    let company = null
    let companyError = null
    if (profile?.company_id) {
      const companyResult = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .single()
      company = companyResult.data
      companyError = companyResult.error
    }

    // Simple debug response
    const debugInfo = {
      timestamp: new Date().toISOString(),
      user_basic: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      user_metadata_keys: Object.keys(user.user_metadata || {}),
      user_metadata: user.user_metadata,
      profile_exists: !!profile,
      profile_data: profile,
      profile_error: profileError?.message,
      company_exists: !!company,
      company_data: company,
      company_error: companyError?.message,
      // Google name analysis
      possible_names: {
        metadata_name: user.user_metadata?.name || 'not found',
        metadata_given_name: user.user_metadata?.given_name || 'not found',
        metadata_family_name: user.user_metadata?.family_name || 'not found',
        metadata_first_name: user.user_metadata?.first_name || 'not found',
        profile_first_name: profile?.first_name || 'not found',
        profile_full_name: profile?.full_name || 'not found'
      }
    }

    return NextResponse.json(debugInfo, { status: 200 })
    
  } catch (error) {
    console.error('Debug profile error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}