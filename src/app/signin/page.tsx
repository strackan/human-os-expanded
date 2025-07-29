"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase"

export default function SignInPage() {
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false)
  const [isEmailLoading, setIsEmailLoading] = useState<boolean>(false)
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const supabase = createClient()

  const searchParams = useSearchParams()
  const next = searchParams.get("next")
  const authError = searchParams.get("error")

  async function signInWithGoogle() {
    setIsGoogleLoading(true)
    setError(null)
    
    try {
      console.log('🔐 Starting Google OAuth flow...')
      
      // Build the redirect URL
      const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
      const redirectUrl = `${baseUrl}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ''}`
      
      console.log('🔗 Redirect URL:', redirectUrl)
      console.log('📋 Next parameter:', next)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        console.error('❌ OAuth error:', error)
        setError(error.message || 'Failed to start authentication')
        throw error
      }
      
      console.log('✅ OAuth flow initiated successfully')
      console.log('🔗 OAuth URL:', data.url)
      
      // Redirect to the OAuth URL
      if (data.url) {
        window.location.href = data.url
      }
      
    } catch (error) {
      console.error('❌ Sign in failed:', error)
      setError('There was an error logging in with Google. Please try again.')
    } finally {
      setIsGoogleLoading(false)
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
      console.log('🔐 Starting email/password authentication...')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('❌ Email auth error:', error)
        setError(error.message || 'Failed to sign in')
        throw error
      }
      
      console.log('✅ Email authentication successful')
      console.log('👤 User:', data.user?.email)
      
      // Redirect to the next page or dashboard
      const redirectTo = next || '/dashboard'
      console.log('🔄 Redirecting to:', redirectTo)
      window.location.href = redirectTo
      
    } catch (error) {
      console.error('❌ Email auth failed:', error)
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

    setIsEmailLoading(true)
    setError(null)
    setMessage(null)
    
    try {
      console.log('🔐 Starting email signup...')
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error('❌ Email signup error:', error)
        setError(error.message || 'Failed to sign up')
        throw error
      }
      
      console.log('✅ Email signup successful')
      setMessage('Check your email to confirm your account!')
      
    } catch (error) {
      console.error('❌ Email signup failed:', error)
      setError('There was an error signing up. Please try again.')
    } finally {
      setIsEmailLoading(false)
    }
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
          {message && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
              <p className="text-sm text-green-600">{message}</p>
            </div>
          )}
          
          {/* Google OAuth (Primary method) */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Sign in with Google</h3>
            <p className="text-sm text-gray-600">Recommended for local development</p>
            
            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={isGoogleLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGoogleLoading ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Sign in with Google
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
          
          {/* Email/Password Sign In (Alternative) */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Sign in with Email</h3>
            <p className="text-sm text-gray-600">Alternative authentication method</p>
            
            <div className="space-y-3">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="Enter your password"
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
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            <p>Google OAuth: Works with local Supabase</p>
            <p>Email/Password: Alternative method</p>
          </div>
        </div>
      </div>
    </div>
  )
} 