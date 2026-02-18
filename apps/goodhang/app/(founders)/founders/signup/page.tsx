'use client';

/**
 * Founders Signup Page
 *
 * Creates a Supabase account and claims the activation key.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { ClaimResult } from '@/lib/founders/types';

export default function FoundersSignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [activationCode, setActivationCode] = useState<string | null>(null);

  useEffect(() => {
    const code = sessionStorage.getItem('activationCode');
    if (!code) {
      router.replace('/founders');
      return;
    }
    setActivationCode(code);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationCode) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Create Supabase account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { full_name: formData.name },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create account');

      // Claim the activation key via API
      const claimResponse = await fetch('/api/activation/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: activationCode,
          userId: authData.user.id,
        }),
      });

      const claimResult: ClaimResult = await claimResponse.json();
      if (!claimResult.success) {
        throw new Error(claimResult.error || 'Failed to claim activation key');
      }

      // Clear temp storage
      sessionStorage.removeItem('activationCode');
      sessionStorage.removeItem('sessionId');
      sessionStorage.removeItem('preview');
      sessionStorage.removeItem('product');
      sessionStorage.removeItem('alreadyRedeemed');
      sessionStorage.removeItem('humanOsUserId');
      sessionStorage.removeItem('existingUserId');

      // Navigate to gate page — auth context will detect session and route
      router.push('/founders');
    } catch (err: unknown) {
      console.error('Signup error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  if (!activationCode) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-md animate-founders-slide-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Your Account</h1>
          <p className="text-gray-400">One more step to get started with Founder OS</p>
        </div>

        <div className="founders-card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="founders-input w-full"
                placeholder="Your name"
              />
            </div>

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
                minLength={8}
                className="founders-input w-full"
                placeholder="At least 8 characters"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm animate-founders-fade-in">
                {error}
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
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-gray-500 text-xs">
            Already have an account?{' '}
            <button
              onClick={() => router.push('/founders/signin')}
              className="text-purple-400 hover:text-purple-300"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
