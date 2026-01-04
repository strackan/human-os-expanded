'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

/**
 * InWorkflowAuth Component
 *
 * Reusable authentication component designed to be embedded within workflow modals,
 * artifacts, or any in-page flow where you don't want to redirect users away.
 *
 * Features:
 * - Email/password sign in & sign up (inline, no redirect)
 * - Google OAuth via popup window (preserves parent window state)
 * - Automatic session restoration
 * - Customizable callback on successful authentication
 * - Error handling and loading states
 *
 * Usage:
 * ```tsx
 * <InWorkflowAuth
 *   onAuthSuccess={(user) => {
 *     console.log('User authenticated:', user)
 *     // Continue workflow...
 *   }}
 *   title="Sign in to continue"
 *   description="Create an account or sign in to save your progress"
 * />
 * ```
 */

interface InWorkflowAuthProps {
  onAuthSuccess?: (user: User) => void;
  onAuthError?: (error: string) => void;
  title?: string;
  description?: string;
  showSignUp?: boolean;
  className?: string;
}

export default function InWorkflowAuth({
  onAuthSuccess,
  onAuthError,
  title = 'Sign in to continue',
  description = 'Create an account or sign in to save your progress',
  showSignUp = true,
  className = '',
}: InWorkflowAuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  const supabase = createClient();

  // Check if user just returned from OAuth (when popup was blocked)
  useEffect(() => {
    const checkOAuthReturn = async () => {
      const returnUrl = sessionStorage.getItem('oauth_return_url');

      // If we have a stored return URL, user just returned from OAuth
      if (returnUrl) {
        console.log('✅ Detected OAuth return, checking session...');
        sessionStorage.removeItem('oauth_return_url');
        sessionStorage.removeItem('oauth_return_origin');

        // Check if authentication succeeded
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('❌ Error checking session after OAuth return:', error);
          setError('Failed to restore session. Please try again.');
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          console.log('✅ OAuth successful, user authenticated:', session.user.email);
          onAuthSuccess?.(session.user);
        } else {
          console.log('⚠️ No session found after OAuth return');
          setIsLoading(false);
        }
      }
    };

    checkOAuthReturn();
  }, [supabase, onAuthSuccess]);

  // Listen for OAuth popup completion
  useEffect(() => {
    const handleOAuthMessage = async (event: MessageEvent) => {
      // Security: Verify origin matches your domain
      if (event.origin !== window.location.origin) {
        console.warn('Received message from untrusted origin:', event.origin);
        return;
      }

      if (event.data?.type === 'OAUTH_SUCCESS') {
        console.log('✅ OAuth success message received from popup');

        // Refresh session to get the new auth state
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          setError('Failed to restore session after OAuth');
          onAuthError?.('Failed to restore session after OAuth');
          return;
        }

        if (session?.user) {
          console.log('✅ Session restored, user authenticated:', session.user.email);
          onAuthSuccess?.(session.user);
        }
      } else if (event.data?.type === 'OAUTH_ERROR') {
        console.error('❌ OAuth error from popup:', event.data.error);
        setError(event.data.error || 'OAuth authentication failed');
        onAuthError?.(event.data.error || 'OAuth authentication failed');
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [supabase, onAuthSuccess, onAuthError]);

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Store current location for return after OAuth
      // This ensures we return to the correct origin (localhost, staging, or prod)
      sessionStorage.setItem('oauth_return_url', window.location.href);
      sessionStorage.setItem('oauth_return_origin', window.location.origin);

      // Build OAuth URL with popup mode and return URL
      const redirectUrl = `${window.location.origin}/auth/callback?mode=popup&returnUrl=${encodeURIComponent(window.location.href)}`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false, // We want the redirect, but in a popup
        },
      });

      if (error) throw error;

      // Open OAuth flow in popup window
      if (data.url) {
        const popup = window.open(
          data.url,
          'oauth-popup',
          'width=600,height=700,left=200,top=100'
        );

        // Check if popup was blocked
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          console.warn('⚠️ Popup blocked - OAuth will open in current window (this is fine)');
          // Show a brief informational message, then clear it
          setMessage('Opening authentication in this window...');
          setTimeout(() => setMessage(null), 2000);
          // Don't throw - let the OAuth continue in the current window
          // The callback will handle returning to the right place
        }

        // Optional: Monitor popup closure
        if (popup) {
          const checkPopup = setInterval(() => {
            if (popup.closed) {
              clearInterval(checkPopup);
              setIsLoading(false);
              console.log('OAuth popup closed');
            }
          }, 500);
        }
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);
      setError(error.message || 'Failed to sign in with Google');
      onAuthError?.(error.message || 'Failed to sign in with Google');
      setIsLoading(false);
    }
  };

  const signInWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      setError(null);
      setMessage(null);

      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        console.log('✅ Email sign in successful:', data.user.email);
        onAuthSuccess?.(data.user);
      }
    } catch (error: any) {
      console.error('Email sign in error:', error);
      setError(error.message || 'Failed to sign in');
      onAuthError?.(error.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      setError(null);
      setMessage(null);

      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }

      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      // If email confirmation is disabled, session is created immediately
      if (data.session) {
        console.log('✅ Sign up successful (instant session):', data.user?.email);
        onAuthSuccess?.(data.user!);
      } else {
        // Email confirmation required
        setMessage('Check your email for a confirmation link, then sign in.');
        setMode('signin');
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      setError(error.message || 'Failed to sign up');
      onAuthError?.(error.message || 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-600">
          {description}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {message && (
        <div className="mb-4 rounded-md bg-green-50 border border-green-200 p-3">
          <p className="text-sm text-green-800">{message}</p>
        </div>
      )}

      {/* Google Sign In Button */}
      <button
        onClick={signInWithGoogle}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      {/* Divider */}
      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-2 text-gray-500">Or continue with email</span>
        </div>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={mode === 'signin' ? signInWithEmail : signUp} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
            </span>
          ) : (
            mode === 'signin' ? 'Sign in' : 'Create account'
          )}
        </button>
      </form>

      {/* Toggle between sign in and sign up */}
      {showSignUp && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError(null);
              setMessage(null);
            }}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      )}
    </div>
  );
}
