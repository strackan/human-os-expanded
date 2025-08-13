"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { authService, type LocalAuthCredentials } from "@/lib/auth-service"
import PasswordResetModal from "@/components/auth/PasswordResetModal"

export default function SignInPage() {
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false)
  const [isEmailLoading, setIsEmailLoading] = useState<boolean>(false)
  const [isOAuthChecking, setIsOAuthChecking] = useState<boolean>(false)
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [fullName, setFullName] = useState<string>("")
  const [companyName, setCompanyName] = useState<string>("")
  const [isSignUp, setIsSignUp] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [showLocalAuthFallback, setShowLocalAuthFallback] = useState<boolean>(false)
  const [localAuthEnabled, setLocalAuthEnabled] = useState<boolean>(false)
  const [showPasswordSetup, setShowPasswordSetup] = useState<boolean>(false)
  const [existingOAuthEmail, setExistingOAuthEmail] = useState<string>("")
  const [showPasswordResetModal, setShowPasswordResetModal] = useState<boolean>(false)
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false)

  const searchParams = useSearchParams()
  const router = useRouter()
  const next = searchParams.get("next")
  const authError = searchParams.get("error")

  useEffect(() => {
    // Check if DEMO_MODE is enabled - if so, redirect immediately
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
    if (isDemoMode) {
      console.log('🎮 DEMO MODE: Skipping signin, redirecting to:', next || '/dashboard')
      const redirectTo = next || '/dashboard'
      router.push(redirectTo)
      return
    }
    
    // Check if local auth is enabled
    setLocalAuthEnabled(authService.isLocalAuthEnabled())
    
    // Clear any existing error states when component mounts
    setError(null)
    setMessage(null)
    
    // Note: Removed redundant auth check to prevent conflicts
    
    // If user navigated back to signin, clear any hanging auth state
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token')
    }
  }, [next, router])

  // Handle Enter key press in form fields
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isEmailLoading) {
      e.preventDefault()
      signInWithEmail()
    }
  }

  async function signInWithGoogle() {
    setIsGoogleLoading(true)
    setIsOAuthChecking(true)
    setError(null)
    setMessage(null)
    
    try {
      console.log('🔐 Starting Google OAuth flow with timeout...')
      setMessage('Checking OAuth availability...')
      
      // Add a backup timeout that shows local auth if OAuth takes too long
      const backupTimeout = setTimeout(() => {
        console.log('⚠️ Backup timeout triggered, showing local auth')
        setShowLocalAuthFallback(true)
        setMessage('OAuth is taking too long. Please use email/password authentication instead.')
        setError(null)
        setIsGoogleLoading(false)
        setIsOAuthChecking(false)
      }, 2000) // 2 second backup timeout
      
      const result = await authService.signInWithFallback('google')
      
      // Clear the backup timeout since we got a result
      clearTimeout(backupTimeout)
      
      if (result.success) {
        // OAuth is working, user will be redirected
        setMessage(result.message || 'Redirecting to Google...')
        return
      }
      
      if (result.authType === 'fallback') {
        // OAuth failed or timed out, show local auth fallback immediately
        setShowLocalAuthFallback(true)
        setMessage(result.message || 'Google OAuth is unavailable. Please use email/password authentication.')
        setError(null)
        console.log('🔄 OAuth timeout detected, showing local auth fallback')
      } else {
        // OAuth failed for other reasons
        setError(result.error || 'Failed to start Google authentication')
      }
      
    } catch (error) {
      console.error('❌ Google signin failed:', error)
      // On any error, show local auth fallback
      setShowLocalAuthFallback(true)
      setMessage('Google OAuth encountered an error. Please use email/password authentication instead.')
      setError(null)
    } finally {
      setIsGoogleLoading(false)
      setIsOAuthChecking(false)
    }
  }

  async function signInWithEmail() {
    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }

    if (isEmailLoading || isRedirecting) {
      return // Prevent multiple sign-in attempts
    }

    setIsEmailLoading(true)
    setError(null)
    setMessage(null)
    
    try {
      console.log('🔐 Starting local email authentication...')
      
      const credentials: LocalAuthCredentials = {
        email,
        password,
        fullName,
        companyName
      }
      
      const result = await authService.signInWithEmail(credentials)
      console.log('🔐 Sign-in result:', result)
      
      if (result.success && result.user) {
        console.log('✅ Local authentication successful:', result.user.email)
        setMessage('Authentication successful! Redirecting...')
        setIsRedirecting(true)
        
        // Simple redirect after short delay
        const redirectTo = next || '/tasks/do'
        console.log('🔄 Redirecting to:', redirectTo)
        
        setTimeout(() => {
          router.push(redirectTo)
        }, 500)
        
      } else {
        console.error('❌ Sign-in failed:', result.error)
        setError(result.error || 'Failed to sign in')
        setIsRedirecting(false)
      }
      
    } catch (error) {
      console.error('❌ Local auth failed:', error)
      setError('There was an error signing in. Please try again.')
    } finally {
      setIsEmailLoading(false)
      setIsRedirecting(false)
    }
  }

  async function signUpWithEmail() {
    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }

    // Check password length
    const minLength = authService.getMinPasswordLength()
    if (password.length < minLength) {
      setError(`Password must be at least ${minLength} characters long`)
      return
    }

    setIsEmailLoading(true)
    setError(null)
    setMessage(null)
    
    try {
      console.log('🔐 Starting local email signup...')
      
      const credentials: LocalAuthCredentials = {
        email,
        password,
        fullName,
        companyName
      }
      
      const result = await authService.signUpWithEmail(credentials)
      
      if (result.success && result.user) {
        console.log('✅ Local signup successful:', result.user.email)
        setMessage(result.message || 'Account created successfully! Please check your email to confirm your account.')
        setError(null)
      } else if (result.error === 'oauth_user_exists') {
        // User exists with OAuth only - show password setup option
        setShowPasswordSetup(true)
        setExistingOAuthEmail(email)
        setError(null)
        setMessage(result.message || 'Account found with Google sign-in. Please set up a password.')
      } else {
        setError(result.error || 'Failed to sign up')
      }
      
    } catch (error) {
      console.error('❌ Local signup failed:', error)
      setError('There was an error signing up. Please try again.')
    } finally {
      setIsEmailLoading(false)
    }
  }

  function toggleSignUpMode() {
    setIsSignUp(!isSignUp)
    setError(null)
    setMessage(null)
  }

  function showLocalAuthForm() {
    setShowLocalAuthFallback(true)
    setError(null)
    setMessage('Please use email/password authentication while Google OAuth is unavailable.')
  }

  async function sendPasswordSetup() {
    if (!existingOAuthEmail) return

    setIsEmailLoading(true)
    setError(null)
    setMessage(null)
    
    try {
      const result = await authService.sendPasswordSetupEmail(existingOAuthEmail)
      
      if (result.success) {
        setMessage(result.message || 'Password setup email sent successfully!')
        setShowPasswordSetup(false)
        setError(null)
      } else {
        setError(result.error || 'Failed to send setup email')
      }
    } catch (error) {
      console.error('❌ Failed to send password setup email:', error)
      setError('There was an error sending the setup email. Please try again.')
    } finally {
      setIsEmailLoading(false)
    }
  }

  function dismissPasswordSetup() {
    setShowPasswordSetup(false)
    setExistingOAuthEmail("")
    setError(null)
    setMessage(null)
  }

  function showForgotPasswordForm() {
    // Instead of showing email form, directly show the password reset modal
    setShowPasswordResetModal(true)
    setError(null)
    setMessage(null)
  }



  // If in DEMO_MODE, show loading while redirecting
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  if (isDemoMode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Demo Mode Active - Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center max-w-md w-full mx-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Renubu
        </h1>
        <p className="text-gray-600 mb-8">
          Commercial Success Intelligence Platform
        </p>
        
        <div className="space-y-6">
          <p className="text-gray-500">Please sign in to continue</p>
          
          {/* Show auth error if present */}
          {(error || authError) && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-sm text-red-600">
                {error || (authError === 'auth_failed' ? 'Authentication failed. Please try again.' : authError)}
              </p>
            </div>
          )}

          {/* Show success message */}
          {message && !showPasswordSetup && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
              <p className="text-sm text-green-600">{message}</p>
            </div>
          )}

          {/* Password Setup Modal */}
          {showPasswordSetup && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Account Found!</h3>
              <p className="text-sm text-blue-800 mb-3">
                We found your account with Google sign-in. Would you like to set up a password for local authentication?
              </p>
              <p className="text-xs text-blue-600 mb-4">
                Email: <strong>{existingOAuthEmail}</strong>
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={sendPasswordSetup}
                  disabled={isEmailLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {isEmailLoading ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Yes, Set Up Password
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={dismissPasswordSetup}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors text-sm"
                >
                  No, Use Google Only
                </button>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                💡 Setting up a password allows you to sign in even when Google OAuth isn't available.
              </p>
            </div>
          )}


          
          {/* Google OAuth */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={isGoogleLoading || isOAuthChecking}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {(isGoogleLoading || isOAuthChecking) ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {isOAuthChecking ? 'Checking OAuth...' : 'Sign in with Google'}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Or</span>
            </div>
          </div>
          
          {/* Email/Password Authentication */}
          <div className="space-y-4">
            <div className="space-y-3">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                aria-label="Email address"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <input
                type="password"
                placeholder={`Enter your password (min ${authService.getMinPasswordLength()} characters)`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                aria-label="Password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <button
                type="button"
                onClick={signInWithEmail}
                disabled={isEmailLoading || isRedirecting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                aria-label={isEmailLoading ? "Signing in..." : isRedirecting ? "Redirecting..." : "Sign in"}
              >
                {isEmailLoading || isRedirecting ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                )}
                {isEmailLoading ? "Signing in..." : isRedirecting ? "Redirecting..." : "Sign In"}
              </button>
              
              <button
                type="button"
                onClick={showForgotPasswordForm}
                className="block w-full text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Reset Password
              </button>
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            <p>Google OAuth: Primary authentication method</p>
            <p>Email/Password: Fallback when OAuth is unavailable</p>
            {localAuthEnabled && (
              <p className="text-green-600 font-medium">✅ Local authentication enabled</p>
            )}
            {authService.isLocalAuthFallbackEnabled() && (
              <p className="text-blue-600 font-medium">🔄 OAuth fallback enabled</p>
            )}
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      <PasswordResetModal
        isOpen={showPasswordResetModal}
        onClose={() => setShowPasswordResetModal(false)}
        email={email || ""}
      />
    </div>
  )
} 