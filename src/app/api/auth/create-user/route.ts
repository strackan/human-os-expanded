import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    console.log('🔐 Creating local user:', email)

    // Create Supabase client with service role key for admin operations
    const supabase = createServiceRoleClient()

    // First check if user already exists
    const { data: existingUsers, error: checkError } = await supabase.auth.admin.listUsers()
    
    if (checkError) {
      console.error('❌ Error checking existing users:', checkError)
      return NextResponse.json(
        { error: 'Failed to check existing users' },
        { status: 500 }
      )
    }

    const existingUser = existingUsers?.users?.find(u => u.email === email)
    
    if (existingUser) {
      console.log('⚠️ User already exists:', email)
      
      // If user exists but has no password (OAuth only), update their password
      const hasPassword = existingUser.app_metadata?.provider === 'email' || 
                          existingUser.app_metadata?.providers?.includes('email')
      
      if (!hasPassword) {
        console.log('🔐 Adding password to existing OAuth user')
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          {
            password,
            app_metadata: {
              ...existingUser.app_metadata,
              provider: 'email',
              providers: [...(existingUser.app_metadata?.providers || []), 'email'],
              auth_type: 'local'
            }
          }
        )

        if (updateError) {
          console.error('❌ Failed to add password:', updateError)
          return NextResponse.json(
            { error: 'Failed to add password to existing user' },
            { status: 500 }
          )
        }

        // Update profile to reflect local auth
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            auth_type: 'local',
            is_local_user: true,
            local_auth_enabled: true,
            full_name: fullName || existingUser.user_metadata?.full_name
          })
          .eq('id', existingUser.id)

        if (profileError) {
          console.warn('⚠️ Failed to update profile:', profileError)
        }

        return NextResponse.json({
          success: true,
          message: 'Password added to existing user. You can now sign in with email/password.',
          user: { email, id: existingUser.id }
        })
      } else {
        return NextResponse.json(
          { error: 'User already exists with password authentication' },
          { status: 409 }
        )
      }
    }

    // Create new user
    console.log('🔐 Creating new user with email/password')
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for local development
      app_metadata: {
        provider: 'email',
        providers: ['email'],
        auth_type: 'local'
      },
      user_metadata: {
        full_name: fullName || '',
        auth_type: 'local'
      }
    })

    if (createError) {
      console.error('❌ Failed to create user:', createError)
      return NextResponse.json(
        { error: createError.message || 'Failed to create user' },
        { status: 500 }
      )
    }

    if (!newUser?.user) {
      return NextResponse.json(
        { error: 'Failed to create user - no user returned' },
        { status: 500 }
      )
    }

    console.log('✅ User created:', newUser.user.email)

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: newUser.user.id,
        email: newUser.user.email,
        full_name: fullName || '',
        auth_type: 'local',
        is_local_user: true,
        local_auth_enabled: true
      })

    if (profileError) {
      console.warn('⚠️ Failed to create profile:', profileError)
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully! You can now sign in with your email and password.',
      user: {
        id: newUser.user.id,
        email: newUser.user.email
      }
    })

  } catch (error) {
    console.error('❌ User creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}