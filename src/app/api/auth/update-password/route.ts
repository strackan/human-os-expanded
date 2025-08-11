import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json()

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'Email and new password are required' },
        { status: 400 }
      )
    }

    console.log('🔐 API: Updating password for:', email)
    console.log('🔐 New password length:', newPassword.length)

    // Create Supabase client with service role key for admin operations
    const supabase = createServiceRoleClient()

    // Try to use the admin API to directly update the password
    try {
      console.log('🔐 API: Attempting direct password update for:', email)
      
      // First, try to get the user by email using listUsers
      const { data: usersData, error: userError } = await supabase.auth.admin.listUsers()
      
      if (userError || !usersData.users) {
        console.log('❌ API: User lookup error:', email, userError)
        return NextResponse.json(
          { error: 'No account found with this email address' },
          { status: 404 }
        )
      }

      // Filter users by email
      const matchingUser = usersData.users.find(user => user.email === email)
      
      if (!matchingUser) {
        console.log('❌ API: User not found:', email)
        return NextResponse.json(
          { error: 'No account found with this email address' },
          { status: 404 }
        )
      }

      const userData = { user: matchingUser }
      console.log('✅ API: User found:', userData.user.email)

      // Update the user's password
      console.log('🔐 API: Attempting to update password for user ID:', userData.user.id)
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        userData.user.id,
        { password: newPassword }
      )

      if (updateError) {
        console.error('❌ API: Password update failed:', updateError)
        return NextResponse.json(
          { error: updateError.message || 'Failed to update password' },
          { status: 500 }
        )
      }

      console.log('✅ API: Password update response:', updateData)
      console.log('✅ API: Password updated successfully for:', email)
      
      // Let's also verify the user still exists and can be retrieved
      const { data: verifyData, error: verifyError } = await supabase.auth.admin.getUserById(userData.user.id)
      if (verifyError) {
        console.error('⚠️ API: Could not verify user after update:', verifyError)
      } else {
        console.log('✅ API: User verification successful after password update')
      }

      return NextResponse.json({
        success: true,
        message: 'Password updated successfully! You can now sign in with your new password.'
      })

    } catch (adminError) {
      console.log('⚠️ API: Admin API failed, falling back to email reset:', adminError)
      
      // Fallback to email reset if admin API fails
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
      })

      if (resetError) {
        console.error('❌ API: Reset password failed:', resetError)
        return NextResponse.json(
          { error: resetError.message || 'Failed to initiate password reset' },
          { status: 500 }
        )
      }

      console.log('✅ API: Password reset initiated for:', email)

      return NextResponse.json({
        success: true,
        message: 'Password reset initiated. Please check your email for the reset link.'
      })
    }

  } catch (error) {
    console.error('❌ API: Password update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
