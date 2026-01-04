'use client';

/**
 * Set Password Page
 * After clicking magic link, user lands here to set their password
 * Must be authenticated to access this page
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [, _setUserName] = useState<string | null>(null);

  // Check if user is authenticated
  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // Not authenticated - redirect to start page
        router.push('/assessment/start');
        return;
      }

      setUserEmail(session.user.email || null);
      // User name is available via userEmail
      setIsAuthChecking(false);
    }

    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      // Get current session to access user metadata
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError('Session expired. Please start over.');
        return;
      }

      const inviteCode = session.user.user_metadata?.invite_code;

      // Update user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        // Handle "password must be different" error more gracefully
        if (updateError.message.toLowerCase().includes('different')) {
          setError('Please choose a different password. Try adding numbers or special characters.');
        } else {
          setError(updateError.message);
        }
        return;
      }

      // Create or update profile for this user
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Member',
          membership_tier: 'core',
          user_role: 'member',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        // Don't fail - profile creation is optional
      }

      // If we have an invite code, mark it as used and link to user
      if (inviteCode) {
        const { error: inviteError } = await supabase
          .from('pending_invites')
          .update({
            user_id: session.user.id,
            used_at: new Date().toISOString(),
          })
          .eq('invite_code', inviteCode.toUpperCase());

        if (inviteError) {
          console.error('Error linking invite to user:', inviteError);
          // Don't fail the whole process - just log the error
        }
      }

      // Success! Redirect to assessment interview
      // The interview page will handle starting the assessment
      router.push('/assessment/interview');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set password';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Email Verified!
            </h1>
            <p className="text-gray-300">
              {userEmail && (
                <>
                  <span className="text-white font-medium">{userEmail}</span>
                  <br />
                </>
              )}
              Now set your password to continue
            </p>
          </div>

          {/* Password Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 bg-gray-900/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="At least 8 characters"
              />
              <p className="mt-1 text-xs text-gray-400">
                Use a strong password with letters, numbers, and symbols
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 bg-gray-900/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="Re-enter your password"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !password || !confirmPassword}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-purple-500/50"
            >
              {isLoading ? 'Setting Password...' : 'Continue to Assessment →'}
            </button>
          </form>

          {/* Security Note */}
          <div className="mt-6 pt-6 border-t border-purple-500/20">
            <p className="text-gray-400 text-xs text-center">
              Your password is encrypted and securely stored. You can change it later in your account settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
