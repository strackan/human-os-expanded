// src/app/api/debug-auth/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Check authentication step by step
    const authResult = await supabase.auth.getUser()
    
    if (authResult.error) {
      return NextResponse.json({
        step: 'auth_check',
        success: false,
        error: authResult.error.message,
        cookies: Array.from(cookieStore.getAll()).map(c => c.name)
      })
    }

    if (!authResult.data.user) {
      return NextResponse.json({
        step: 'user_check',
        success: false,
        error: 'No user found',
        cookies: Array.from(cookieStore.getAll()).map(c => c.name)
      })
    }

    const user = authResult.data.user

    // Check profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({
        step: 'profile_check',
        success: false,
        error: profileError.message,
        user_id: user.id,
        user_email: user.email
      })
    }

    // Check company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', profile.company_id)
      .single()

    if (companyError) {
      return NextResponse.json({
        step: 'company_check',
        success: false,
        error: companyError.message,
        profile
      })
    }

    // All good!
    return NextResponse.json({
      step: 'complete',
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      profile,
      company,
      message: 'Authentication working correctly!'
    })

  } catch (error) {
    return NextResponse.json({
      step: 'exception',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}