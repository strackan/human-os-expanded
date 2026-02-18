'use client';

/**
 * Founders Sign-In Page
 *
 * Signs into an existing Supabase account and claims activation if needed.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function FoundersSigninPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [activationCode, setActivationCode] = useState<string | null>(null);

  useEffect(() => {
    setActivationCode(sessionStorage.getItem('activationCode'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Sign in failed');

      // If we have an activation code that hasn't been redeemed, claim it
      const alreadyRedeemed = sessionStorage.getItem('alreadyRedeemed');
      if (activationCode && !alreadyRedeemed) {
        try {
          const claimResponse = await fetch('/api/activation/claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: activationCode,
              userId: authData.user.id,
            }),
          });
          const claimResult = await claimResponse.json();
          if (!claimResult.success) {
            console.warn('[Signin] Claim failed:', claimResult.error);
          }
        } catch (claimErr) {
          console.warn('[Signin] Claim error (non-fatal):', claimErr);
        }
      }

      // Clear temp storage
      sessionStorage.removeItem('activationCode');
      sessionStorage.removeItem('sessionId');
      sessionStorage.removeItem('preview');
      sessionStorage.removeItem('product');
      sessionStorage.removeItem('alreadyRedeemed');
      sessionStorage.removeItem('humanOsUserId');
      sessionStorage.removeItem('existingUserId');

      // Navigate to gate page — auth context detects session and routes
      router.push('/founders');
    } catch (err: unknown) {
      console.error('Signin error:', err);
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!formData.email.trim()) {
      setError('Please enter your email address first');
      return;
    }

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/auth/set-password`,
      });
      if (resetError) throw resetError;
      setResetSent(true);
      setError(null);
    } catch (err) {
      console.error('Reset error:', err);
      setError('Failed to send reset email');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-md animate-founders-slide-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">Sign in to your Founder OS account</p>
        </div>

        <div className="founders-card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="founders-input w-full"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="founders-input w-full"
                placeholder="Your password"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm animate-founders-fade-in">
                {error}
              </div>
            )}

            {resetSent && (
              <div className="p-3 bg-green-900/30 border border-green-700 rounded-lg text-green-300 text-sm animate-founders-fade-in">
                Password reset email sent. Check your inbox.
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="founders-btn-primary w-full mt-6"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-4 text-center space-y-2">
            <button
              onClick={handleResetPassword}
              className="text-gray-500 hover:text-gray-400 text-sm"
            >
              Forgot password?
            </button>
            <p className="text-gray-500 text-sm">
              Need an account?{' '}
              <button
                onClick={() => router.push('/founders/signup')}
                className="text-purple-400 hover:text-purple-300"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
