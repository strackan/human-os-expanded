import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { claimActivationKey, storeSession } from '@/lib/tauri';
import { useAuthStore } from '@/lib/stores/auth';

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

interface Preview {
  tier: string;
  archetypeHint: string;
  overallScoreRange: string;
}

export default function SigninPage() {
  const navigate = useNavigate();
  const { setSession } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const activationCode = sessionStorage.getItem('activationCode');
  const sessionId = sessionStorage.getItem('sessionId');
  const existingUserId = sessionStorage.getItem('existingUserId');

  useEffect(() => {
    if (!activationCode) {
      navigate('/activate');
      return;
    }
    // Load preview data if available
    const previewStr = sessionStorage.getItem('preview');
    if (previewStr) {
      try {
        setPreview(JSON.parse(previewStr));
      } catch {
        // Ignore parse errors
      }
    }
  }, [activationCode, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationCode) return;

    setLoading(true);
    setError(null);

    try {
      // Sign in with email/password
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to sign in');

      // Verify user matches the activation key's user
      if (existingUserId && authData.user.id !== existingUserId) {
        throw new Error(
          'This activation key belongs to a different account. Please sign in with the account you used to take the assessment.'
        );
      }

      // Claim the activation key
      const claimResult = await claimActivationKey(
        activationCode,
        authData.user.id
      );

      if (!claimResult.success) {
        throw new Error(claimResult.error || 'Failed to claim activation key');
      }

      // Store session securely
      const token = authData.session?.access_token || '';
      const effectiveSessionId = sessionId || 'no-session';
      await storeSession(authData.user.id, effectiveSessionId, token);

      // Update auth store with token
      setSession(authData.user.id, effectiveSessionId, token);

      // Clear temp storage
      sessionStorage.removeItem('activationCode');
      sessionStorage.removeItem('sessionId');
      sessionStorage.removeItem('preview');
      sessionStorage.removeItem('existingUserId');

      // Navigate to results
      navigate(sessionId ? '/results' : '/');
    } catch (err: unknown) {
      console.error('Signin error:', err);
      const message =
        err instanceof Error ? err.message : 'Failed to sign in. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (oauthError) throw oauthError;
      // OAuth will redirect the user
    } catch (err: unknown) {
      console.error('LinkedIn signin error:', err);
      const message =
        err instanceof Error ? err.message : 'Failed to sign in with LinkedIn';
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">
            Sign in to reveal your character profile
          </p>
        </div>

        {/* Preview Card */}
        {preview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-gh-purple-900/30 to-gh-dark-800 rounded-2xl p-6 mb-6 border border-gh-purple-500/30"
          >
            <div className="text-center">
              <div className="text-sm text-gh-purple-400 uppercase tracking-wider mb-1">
                Your Assessment
              </div>
              <div className="text-2xl font-bold text-white mb-2">
                {preview.archetypeHint}
              </div>
              <div className="flex items-center justify-center gap-3 text-sm">
                <span className="px-2 py-1 bg-gh-purple-600/20 text-gh-purple-300 rounded">
                  {preview.tier}
                </span>
                <span className="text-gray-400">
                  Score: {preview.overallScoreRange}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        <div className="bg-gh-dark-800 rounded-2xl p-8 shadow-xl">
          {/* LinkedIn Sign In Button */}
          <button
            onClick={handleLinkedInSignIn}
            disabled={loading}
            className="w-full py-3 px-4 bg-[#0077B5] hover:bg-[#006097] disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-3 mb-6"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
            </svg>
            Continue with LinkedIn
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gh-dark-800 text-gray-500">
                or sign in with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                className="w-full px-4 py-3 bg-gh-dark-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gh-purple-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                className="w-full px-4 py-3 bg-gh-dark-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gh-purple-500"
                placeholder="Your password"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gh-purple-600 hover:bg-gh-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In & Reveal Character'
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-gray-500 text-sm">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-gh-purple-400 hover:text-gh-purple-300"
            >
              Create one
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
