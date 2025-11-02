import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    console.log('🔍 API: Checking user authentication for:', email)

    // Create Supabase client with service role key
    const supabase = createServiceRoleClient()

    // First, check if the user exists using listUsers
    const { data: usersData, error: userError } = await supabase.auth.admin.listUsers()
    
    if (userError || !usersData.users) {
      console.log('❌ API: User lookup error:', email, userError)
      return NextResponse.json(
        { 
          exists: false,
          error: 'No account found with this email address' 
        },
        { status: 404 }
      )
    }

    // Filter users by email
    const matchingUser = usersData.users.find(user => user.email === email)
    
    if (!matchingUser) {
      console.log('❌ API: User not found:', email)
      return NextResponse.json(
        { 
          exists: false,
          error: 'No account found with this email address' 
        }, 
        { status: 404 }
      )
    }

    const userData = { user: matchingUser }
    console.log('✅ API: User found:', userData.user.email)
    console.log('✅ API: User ID:', userData.user.id)
    console.log('✅ API: User created at:', userData.user.created_at)
    console.log('✅ API: User last sign in:', userData.user.last_sign_in_at)

    // Try to authenticate with the provided password
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        console.log('❌ API: Authentication failed:', authError.message)
        return NextResponse.json({
          exists: true,
          authenticated: false,
          error: authError.message,
          userInfo: {
            id: userData.user.id,
            email: userData.user.email,
            created_at: userData.user.created_at,
            last_sign_in_at: userData.user.last_sign_in_at
          }
        })
      }

      console.log('✅ API: Authentication successful!')
      return NextResponse.json({
        exists: true,
        authenticated: true,
        userInfo: {
          id: userData.user.id,
          email: userData.user.email,
          created_at: userData.user.created_at,
          last_sign_in_at: userData.user.last_sign_in_at
        }
      })

    } catch (authError) {
      console.error('❌ API: Authentication error:', authError)
      return NextResponse.json({
        exists: true,
        authenticated: false,
        error: 'Authentication failed',
        userInfo: {
          id: userData.user.id,
          email: userData.user.email,
          created_at: userData.user.created_at,
          last_sign_in_at: userData.user.last_sign_in_at
        }
      })
    }

  } catch (error) {
    console.error('❌ API: Check user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
