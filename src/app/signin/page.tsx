'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  
  const next = searchParams.get('next') || '/dashboard'

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Preserve all URL parameters in the OAuth redirect
      const urlParams = new URLSearchParams(window.location.search)
      const templateGroup = urlParams.get('templateGroup')
      const templateGroupId = urlParams.get('templateGroupId')
      const templateId = urlParams.get('templateId')
      const template = urlParams.get('template')

      // Store parameters in sessionStorage as backup
      const paramsToStore = {
        templateGroup,
        templateGroupId,
        templateId,
        template,
        next
      }
      
      // Only store non-null values
      const filteredParams = Object.fromEntries(
        Object.entries(paramsToStore).filter(([, value]) => value !== null)
      )
      
      if (Object.keys(filteredParams).length > 0) {
        sessionStorage.setItem('auth_redirect_params', JSON.stringify(filteredParams))
      }

      // Build the redirect URL with all parameters
      let redirectUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      
      if (templateGroup) {
        redirectUrl += `&templateGroup=${encodeURIComponent(templateGroup)}`
      }
      if (templateGroupId) {
        redirectUrl += `&templateGroupId=${encodeURIComponent(templateGroupId)}`
      }
      if (templateId) {
        redirectUrl += `&templateId=${encodeURIComponent(templateId)}`
      }
      if (template) {
        redirectUrl += `&template=${encodeURIComponent(template)}`
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      })

      if (error) throw error
    } catch (error) {
      console.error('Google sign in error:', error)
      setError('Failed to sign in with Google')
    } finally {
      setIsLoading(false)
    }
  }

  const signInWithEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const start = performance.now()
      console.log("🧐 [EMAIL LOGIN] Starting sign-in at", new Date().toISOString())
  
      setIsLoading(true)
      setError(null)
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      const mid = performance.now()
      console.log(`🧐 [EMAIL LOGIN] Supabase response in ${(mid - start).toFixed(2)} ms`)

      if (error) throw error
  
      // 🚫 Commented out direct navigation — let RouteGuard handle it
      // router.push(next)
      // router.refresh()
      // setTimeout(() => {
      //   console.log("🧐 [EMAIL LOGIN] 1s after router.push, current user:", supabase.auth.getSession())
      // }, 1000)

      console.log(`🧐 [EMAIL LOGIN] Sign-in complete, waiting for RouteGuard to redirect`)
  
      const end = performance.now()
      console.log(`🧐 [EMAIL LOGIN] Total flow took ${(end - start).toFixed(2)} ms`)
      
    } catch (error: any) {
      console.error('Email sign in error:', error)
      setError(error.message || 'Failed to sign in')
    } finally {
      setIsLoading(false)
    }
  }

  const MIN_PASS = 8; // Supabase allows 6+, but 8 is safer

  const signUp = async (e?: React.FormEvent) => {
    e?.preventDefault?.();

    try {
      setIsLoading(true);
      setError(null);
      setMessage(null);

      // 1) Validate inputs early to avoid "anonymous" style errors
      if (!email?.trim()) {
        setError('Please enter an email address.');
        return;
      }
      if (!password || password.length < MIN_PASS) {
        setError(`Please enter a password of at least ${MIN_PASS} characters.`);
        return;
      }

      // 2) Build redirect (used if email confirmations are ON)
      const emailRedirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : undefined;

      console.log('🧐 [SignIn] Sign-up attempt:', {
        email,
        passLen: password.length,
        emailRedirectTo,
      });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
          // include optional metadata if you have a name input:
          // data: { full_name: name ?? null },
        },
      });

      console.log('🧐 [SignIn] SignUp response:', { data, error });

      if (error) {
        // Surface the exact reason to us/devtools and a friendly message to the user
        console.error('[SIGNUP ERROR]', { code: (error as any).code, message: error.message });
        // Some common messages: "Signups not allowed for this instance", "Anonymous sign-ins are disabled"
        setError(error.message || 'Failed to sign up');
        return;
      }

      // 3) If confirmations are OFF, a session is created immediately
      if (data.session) {
        router.push('/dashboard');
        return;
      }

      // 4) If confirmations are ON, user must click the email link
      setMessage('Check your email for the confirmation link, then log in.');
    } catch (err: any) {
      console.error('🧐 [SignIn] Sign up error (catch):', err);
      setError(err?.message || 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      console.log("🧐 [SignIn] Password reset attempt for email:", email)

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      console.log("🧐 [SignIn] ResetPassword response:", { data, error })

      if (error) throw error
      setMessage('Check your email for the password reset link!')
    } catch (error: any) {
      console.error('🧐 [SignIn] Reset password error:', error)
      setError(error.message || 'Failed to send reset email')
    } finally {
      setIsLoading(false)
    }
  }

  // ✅ UI restored
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Sign in to Renubu
          </h2>
        </div>
        
        <div className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          
          {message && (
            <div className="rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800">{message}</p>
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            onClick={signInWithGoogle}
            disabled={isLoading}
            className="group relative flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-gray-50 px-2 text-gray-700">Or continue with</span>
            </div>
          </div>

          {/* Email Sign In Form */}
          <form className="space-y-4" onSubmit={signInWithEmail}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-600">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-600">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border text-gray-900"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={signUp}
                disabled={isLoading}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Create new account
              </button>
              
              <button
                type="button"
                onClick={resetPassword}
                disabled={isLoading}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Forgot password?
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

