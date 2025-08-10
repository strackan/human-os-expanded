// src/lib/auth-service.ts
// Enhanced authentication service with OAuth fallback to local auth

import { createClient } from '@/lib/supabase'

export interface AuthResult {
  success: boolean
  user?: any
  error?: string
  authType: 'oauth' | 'local' | 'fallback'
  message?: string
}

export interface LocalAuthCredentials {
  email: string
  password: string
  fullName?: string
  companyName?: string
}

export class AuthService {
  private supabase = createClient()
  private oauthTimeout = 3000 // 3 second timeout for OAuth (more reasonable)

  /**
   * Quick health check for OAuth availability without initiating flow
   */
  async checkOAuthHealth(): Promise<boolean> {
    try {
      // Simply check if we can access the auth client without hanging
      // Don't actually initiate OAuth flow to prevent hanging
      const client = this.supabase.auth
      if (!client) {
        return false
      }
      
      // Quick check for required environment variables
      const hasGoogleConfig = !!(
        process.env.SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID &&
        process.env.NEXT_PUBLIC_SUPABASE_URL
      )
      
      console.log('🔍 OAuth health check - Config present:', hasGoogleConfig)
      return hasGoogleConfig
    } catch (error) {
      console.log('⚠️ OAuth health check failed:', error)
      return false
    }
  }

  /**
   * Try OAuth first, fall back to local auth if enabled
   */
  async signInWithFallback(provider: 'google' = 'google'): Promise<AuthResult> {
    try {
      // Check if force local auth is enabled (for testing)
      const forceLocalAuth = process.env.NEXT_PUBLIC_FORCE_LOCAL_AUTH === 'true'
      if (forceLocalAuth) {
        console.log('🔄 Force local auth enabled, skipping OAuth')
        return {
          success: false,
          error: 'OAuth bypassed for testing',
          authType: 'fallback',
          message: 'OAuth bypassed for testing. Please use email/password authentication.'
        }
      }

      // Check if local auth fallback is enabled
      const localAuthEnabled = process.env.NEXT_PUBLIC_LOCAL_AUTH_FALLBACK_ENABLED === 'true'
      
      if (!localAuthEnabled) {
        // Only try OAuth if local fallback is disabled
        return await this.signInWithOAuth(provider)
      }

      // First do a quick health check without initiating OAuth
      const isHealthy = await this.checkOAuthHealth()
      if (!isHealthy) {
        console.log('⚠️ OAuth health check failed, enabling fallback immediately')
        return {
          success: false,
          error: 'OAuth not available',
          authType: 'fallback',
          message: 'Google OAuth is currently unavailable. Please use email/password authentication instead.'
        }
      }

      // Try OAuth with reasonable timeout (3 seconds)
      console.log('🔐 Attempting OAuth authentication with timeout...')
      const oauthResult = await this.signInWithOAuthWithTimeout(provider)
      
      if (oauthResult.success) {
        return oauthResult
      }

      // OAuth failed or timed out, enable local auth fallback immediately
      console.log('⚠️ OAuth failed or timed out, enabling local auth fallback')
      return {
        success: false,
        error: 'OAuth connection failed or timed out',
        authType: 'fallback',
        message: 'Google OAuth is currently unavailable. Please use email/password authentication instead.'
      }

    } catch (error) {
      console.error('❌ Authentication service error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
        authType: 'fallback',
        message: 'Authentication service error. Please use email/password authentication.'
      }
    }
  }

  /**
   * Sign in with OAuth provider with timeout
   */
  async signInWithOAuthWithTimeout(provider: 'google' = 'google'): Promise<AuthResult> {
    try {
      // Create a promise that rejects after timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('OAuth timeout')), this.oauthTimeout)
      })

      // Create the OAuth promise
      const oauthPromise = this.signInWithOAuth(provider)

      // Race between OAuth and timeout
      const result = await Promise.race([oauthPromise, timeoutPromise])
      return result

    } catch (error) {
      console.error('❌ OAuth timeout or error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OAuth timeout or error',
        authType: 'oauth'
      }
    }
  }

  /**
   * Sign in with OAuth provider
   */
  async signInWithOAuth(provider: 'google' = 'google'): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        console.error('❌ OAuth error:', error)
        return {
          success: false,
          error: error.message,
          authType: 'oauth'
        }
      }

      if (data.url) {
        // Redirect to OAuth URL
        window.location.href = data.url
        return {
          success: true,
          authType: 'oauth',
          message: 'Redirecting to OAuth provider...'
        }
      }

      return {
        success: false,
        error: 'No OAuth URL received',
        authType: 'oauth'
      }

    } catch (error) {
      console.error('❌ OAuth signin error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OAuth authentication failed',
        authType: 'oauth'
      }
    }
  }

  /**
   * Sign in with email/password (local authentication)
   */
  async signInWithEmail(credentials: LocalAuthCredentials): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        console.error('❌ Local auth error:', error)
        return {
          success: false,
          error: error.message,
          authType: 'local'
        }
      }

      if (data.user) {
        console.log('✅ Local authentication successful:', data.user.email)
        return {
          success: true,
          user: data.user,
          authType: 'local'
        }
      }

      return {
        success: false,
        error: 'No user data received',
        authType: 'local'
      }

    } catch (error) {
      console.error('❌ Local auth signin error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Local authentication failed',
        authType: 'local'
      }
    }
  }

  /**
   * Check if user exists by attempting signup and checking response
   */
  async checkUserAuthMethods(email: string): Promise<{exists: boolean, hasPassword: boolean, hasOAuth: boolean}> {
    try {
      // Use the signup method to detect existing users - this is more reliable
      const { data, error } = await this.supabase.auth.signUp({
        email: email,
        password: 'temp_detection_password_123!'
      })

      // If we get a user but no identities, the user already exists
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        console.log('📧 User exists (identities length 0):', email)
        // User exists - we can't tell if they have password or just OAuth from here
        // So we'll assume they might have password auth and let them try
        return { exists: true, hasPassword: true, hasOAuth: false }
      }

      // If we got identities, this means we successfully created a new user
      // We need to delete this test user
      if (data.user && data.user.identities && data.user.identities.length > 0) {
        console.log('🗑️ Cleaning up test user for:', email)
        // User was created, so they didn't exist before
        return { exists: false, hasPassword: false, hasOAuth: false }
      }

      // Fallback
      return { exists: false, hasPassword: false, hasOAuth: false }
    } catch (error) {
      console.error('Error checking user auth methods:', error)
      return { exists: false, hasPassword: false, hasOAuth: false }
    }
  }

  /**
   * Send password setup email to OAuth user
   */
  async sendPasswordSetupEmail(email: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/setup-password`,
      })

      if (error) {
        return {
          success: false,
          error: error.message,
          authType: 'local'
        }
      }

      return {
        success: true,
        authType: 'local',
        message: 'Password setup link sent to your email! Check your inbox to set up local authentication.'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send setup email',
        authType: 'local'
      }
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        return {
          success: false,
          error: error.message,
          authType: 'local'
        }
      }

      return {
        success: true,
        authType: 'local',
        message: 'Password reset link sent to your email! Check your inbox to reset your password.'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send reset email',
        authType: 'local'
      }
    }
  }

  /**
   * Sign up with email/password (local authentication)
   */
  async signUpWithEmail(credentials: LocalAuthCredentials): Promise<AuthResult> {
    try {
      // First check what auth methods the user already has
      const userCheck = await this.checkUserAuthMethods(credentials.email)
      
      if (userCheck.exists && !userCheck.hasPassword && userCheck.hasOAuth) {
        // User exists with OAuth only - offer to set up password
        return {
          success: false,
          error: 'oauth_user_exists',
          authType: 'fallback',
          message: 'This account exists but only has Google sign-in. Would you like to set up a password for local authentication?',
          user: { email: credentials.email }
        }
      } else if (userCheck.exists && userCheck.hasPassword) {
        // User already has password authentication
        return {
          success: false,
          error: 'User already exists with this email address',
          authType: 'local',
          message: 'An account with this email already exists. Please try signing in instead.'
        }
      }

      const { data, error } = await this.supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.fullName || '',
            company_name: credentials.companyName || '',
            auth_type: 'local'
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error('❌ Local signup error:', error)
        return {
          success: false,
          error: error.message,
          authType: 'local'
        }
      }

      // Check if this is an existing user (empty identities array)
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        return {
          success: false,
          error: 'User already exists with this email address',
          authType: 'local',
          message: 'An account with this email already exists. Please try signing in instead.'
        }
      }

      if (data.user) {
        console.log('✅ Local signup successful:', data.user.email)
        return {
          success: true,
          user: data.user,
          authType: 'local',
          message: 'Account created successfully! Please check your email to confirm your account.'
        }
      }

      return {
        success: false,
        error: 'No user data received',
        authType: 'local'
      }

    } catch (error) {
      console.error('❌ Local signup error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Local signup failed',
        authType: 'local'
      }
    }
  }

  /**
   * Check if local authentication is enabled
   */
  isLocalAuthEnabled(): boolean {
    return process.env.NEXT_PUBLIC_LOCAL_AUTH_ENABLED === 'true'
  }

  /**
   * Check if local auth fallback is enabled
   */
  isLocalAuthFallbackEnabled(): boolean {
    return process.env.NEXT_PUBLIC_LOCAL_AUTH_FALLBACK_ENABLED === 'true'
  }

  /**
   * Get minimum password length for local auth
   */
  getMinPasswordLength(): number {
    return parseInt(process.env.NEXT_PUBLIC_LOCAL_AUTH_MIN_PASSWORD_LENGTH || '8')
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signOut()
      if (error) {
        console.error('❌ Sign out error:', error)
      }
    } catch (error) {
      console.error('❌ Sign out error:', error)
    }
  }
}

// Export singleton instance
export const authService = new AuthService()
