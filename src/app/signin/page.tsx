"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { authService, type LocalAuthCredentials } from "@/lib/auth-service"

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
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState<string>("")

  const searchParams = useSearchParams()
  const next = searchParams.get("next")
  const authError = searchParams.get("error")

  useEffect(() => {
    // Check if local auth is enabled
    setLocalAuthEnabled(authService.isLocalAuthEnabled())
  }, [])

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
      
      if (result.success && result.user) {
        console.log('✅ Local authentication successful:', result.user.email)
        setMessage('Authentication successful! Redirecting...')
        
        // Redirect to the next page or dashboard
        const redirectTo = next || '/dashboard'
        console.log('🔄 Redirecting to:', redirectTo)
        window.location.href = redirectTo
      } else {
        setError(result.error || 'Failed to sign in')
      }
      
    } catch (error) {
      console.error('❌ Local auth failed:', error)
      setError('There was an error signing in. Please try again.')
    } finally {
      setIsEmailLoading(false)
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
        setMessage(result.message)
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
        setMessage(result.message)
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
    setShowForgotPassword(true)
    setForgotPasswordEmail(email) // Pre-fill with current email
    setError(null)
    setMessage(null)
  }

  async function sendPasswordReset() {
    if (!forgotPasswordEmail) {
      setError('Please enter your email address')
      return
    }

    setIsEmailLoading(true)
    setError(null)
    setMessage(null)
    
    try {
      const result = await authService.sendPasswordResetEmail(forgotPasswordEmail)
      
      if (result.success) {
        setMessage(result.message)
        setShowForgotPassword(false)
        setError(null)
      } else {
        setError(result.error || 'Failed to send reset email')
      }
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error)
      setError('There was an error sending the reset email. Please try again.')
    } finally {
      setIsEmailLoading(false)
    }
  }

  function dismissForgotPassword() {
    setShowForgotPassword(false)
    setForgotPasswordEmail("")
    setError(null)
    setMessage(null)
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
          {message && !showPasswordSetup && !showForgotPassword && (
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

          {/* Forgot Password Modal */}
          {showForgotPassword && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">Reset Password</h3>
              <p className="text-sm text-yellow-800 mb-3">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                />
                
                {error && showForgotPassword && (
                  <p className="text-sm text-red-600">{error}</p>
                )}
                
                {message && showForgotPassword && (
                  <p className="text-sm text-green-600">{message}</p>
                )}
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={sendPasswordReset}
                    disabled={isEmailLoading || !forgotPasswordEmail}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    {isEmailLoading ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Send Reset Link
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={dismissForgotPassword}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Google OAuth (Primary method) */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Sign in with Google</h3>
            <p className="text-sm text-gray-600">Recommended for local development</p>
            
            <div className="space-y-2">
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

              {/* Skip OAuth button for immediate local auth */}
              <button
                type="button"
                onClick={showLocalAuthForm}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-md transition-colors text-sm"
              >
                ⚡ Skip OAuth - Use Email/Password
              </button>

              {/* Show local auth fallback button if OAuth fails */}
              {showLocalAuthFallback && (
                <button
                  type="button"
                  onClick={showLocalAuthForm}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-md transition-colors"
                >
                  🔄 Use Email/Password Instead
                </button>
              )}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Or</span>
            </div>
          </div>
          
          {/* Email/Password Authentication (Alternative/Fallback) */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {showLocalAuthFallback ? 'Email/Password Authentication' : 'Sign in with Email'}
            </h3>
            <p className="text-sm text-gray-600">
              {showLocalAuthFallback 
                ? 'Use this method while Google OAuth is unavailable' 
                : 'Alternative authentication method'
              }
            </p>
            
            <div className="space-y-3">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              {isSignUp && (
                <>
                  <input
                    type="text"
                    placeholder="Full Name (optional)"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Company Name (optional)"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </>
              )}
              
              <input
                type="password"
                placeholder={`Enter your password (min ${authService.getMinPasswordLength()} characters)`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={signInWithEmail}
                  disabled={isEmailLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isEmailLoading ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                  )}
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={signUpWithEmail}
                  disabled={isEmailLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isEmailLoading ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  )}
                  Sign Up
                </button>
              </div>
              
              {/* Additional links */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={toggleSignUpMode}
                  className="block w-full text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
                
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={showForgotPasswordForm}
                    className="block w-full text-sm text-gray-600 hover:text-gray-800 underline"
                  >
                    Forgot your password?
                  </button>
                )}
              </div>
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
    </div>
  )
} 