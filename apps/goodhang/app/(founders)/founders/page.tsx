'use client';

/**
 * Founders Gate Page (/founders)
 *
 * Entry point for Founder OS. Validates activation codes and routes users
 * to signup/signin. If already authenticated, redirects based on status.
 */

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFoundersAuth, getRecommendedRoute } from '@/lib/founders/auth-context';
import type { ValidationResult } from '@/lib/founders/types';

export default function FoundersGatePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    }>
      <FoundersGateContent />
    </Suspense>
  );
}

function FoundersGateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading: authLoading, status, statusLoading } = useFoundersAuth();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && !statusLoading && isAuthenticated && status) {
      const route = getRecommendedRoute(status);
      router.replace(route);
    }
  }, [authLoading, statusLoading, isAuthenticated, status, router]);

  // Check for code in URL
  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode) {
      setCode(urlCode);
      handleValidate(urlCode);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleValidate = async (activationCode?: string) => {
    const codeToValidate = activationCode || code;
    if (!codeToValidate.trim()) {
      setError('Please enter an activation code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/activation/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToValidate.trim() }),
      });

      const result: ValidationResult = await response.json();

      if (result.valid) {
        // Store activation data in sessionStorage
        sessionStorage.setItem('activationCode', codeToValidate.trim());
        if (result.sessionId) sessionStorage.setItem('sessionId', result.sessionId);
        if (result.product) sessionStorage.setItem('product', result.product);
        if (result.preview) sessionStorage.setItem('preview', JSON.stringify(result.preview));
        if (result.hasExistingUser && result.userId) sessionStorage.setItem('existingUserId', result.userId);
        if (result.humanOsUserId) sessionStorage.setItem('humanOsUserId', result.humanOsUserId);
        if (result.alreadyRedeemed) sessionStorage.setItem('alreadyRedeemed', 'true');

        // Route to signin for existing users, signup for new
        if (result.hasExistingUser) {
          router.push('/founders/signin');
        } else {
          router.push('/founders/signup');
        }
      } else {
        setError(result.error || 'Invalid activation code');
      }
    } catch (err) {
      console.error('Validation error:', err);
      setError('Failed to validate code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCode = (value: string) => {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleaned.startsWith('FO')) {
      if (cleaned.length <= 2) return cleaned;
      if (cleaned.length <= 6) return `FO-${cleaned.slice(2)}`;
      return `FO-${cleaned.slice(2, 6)}-${cleaned.slice(6, 10)}`;
    }
    if (cleaned.length <= 4) return cleaned;
    if (cleaned.length <= 8) return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8, 12)}`;
  };

  if (authLoading) {
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
          <h1 className="text-4xl font-bold text-white mb-2">Founder OS</h1>
          <p className="text-gray-400">Enter your activation code to continue</p>
        </div>

        <div className="founders-card p-8">
          <div className="mb-6">
            <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-2">
              Activation Code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(formatCode(e.target.value))}
              onKeyDown={(e) => { if (e.key === 'Enter') handleValidate(); }}
              placeholder="Enter activation code"
              className="w-full px-4 py-3 bg-[var(--gh-dark-900)] border border-gray-700 rounded-lg text-white text-center text-xl font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={14}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm text-center animate-founders-fade-in">
              {error}
            </div>
          )}

          <button
            onClick={() => handleValidate()}
            disabled={loading || !code.trim()}
            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                Validating...
              </span>
            ) : (
              'Activate'
            )}
          </button>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
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
    </div>
  );
}
