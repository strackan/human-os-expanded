import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { claimActivationKey, storeSession, storeDeviceRegistration, type ProductType } from '@/lib/tauri';
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

export default function SignupPage() {
  const navigate = useNavigate();
  const { setSession } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const activationCode = sessionStorage.getItem('activationCode');
  const sessionId = sessionStorage.getItem('sessionId');

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
      // Create Supabase account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create account');

      // Claim the activation key
      const claimResult = await claimActivationKey(
        activationCode,
        authData.user.id
      );

      if (!claimResult.success) {
        throw new Error(claimResult.error || 'Failed to claim activation key');
      }

      // Get product before clearing storage
      const product = sessionStorage.getItem('product') as ProductType | null;
      const refreshToken = authData.session?.refresh_token;

      // Use human_os_user_id for founder_os data operations, fallback to auth user id
      const effectiveUserId = claimResult.humanOsUserId || authData.user.id;
      console.log('[Signup] User IDs:', { authUserId: authData.user.id, humanOsUserId: claimResult.humanOsUserId, effectiveUserId });

      // Store device registration permanently (survives app restarts)
      if (product && refreshToken) {
        console.log('[Signup] Storing device registration...', { userId: effectiveUserId, product });
        try {
          await storeDeviceRegistration(activationCode, effectiveUserId, product, refreshToken);
          console.log('[Signup] Device registration stored successfully!');
        } catch (err) {
          console.error('[Signup] Failed to store device registration:', err);
        }
      } else {
        console.warn('[Signup] Skipping device registration:', { hasProduct: !!product, hasRefreshToken: !!refreshToken });
      }

      // Store session securely (use sessionId if available, otherwise use a placeholder)
      const token = authData.session?.access_token || '';
      const effectiveSessionId = sessionId || 'no-session';
      await storeSession(effectiveUserId, effectiveSessionId, token);

      // Update auth store with token
      setSession(effectiveUserId, effectiveSessionId, token);

      // Clear temp storage
      sessionStorage.removeItem('activationCode');
      sessionStorage.removeItem('sessionId');
      sessionStorage.removeItem('preview');
      sessionStorage.removeItem('product');
      sessionStorage.removeItem('alreadyRedeemed');

      // Navigate based on product type
      if (sessionId) {
        navigate('/results');
      } else if (product === 'founder_os') {
        navigate('/founder-os/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      console.error('Signup error:', err);
      const message = err instanceof Error ? err.message : 'Failed to create account. Please try again.';
      setError(message);
    } finally {
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
          <h1 className="text-3xl font-bold text-white mb-2">
            Create Your Account
          </h1>
          <p className="text-gray-400">
            One more step to reveal your character
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="w-full px-4 py-3 bg-gh-dark-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gh-purple-500"
                placeholder="Your name"
              />
            </div>

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
                minLength={8}
                className="w-full px-4 py-3 bg-gh-dark-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gh-purple-500"
                placeholder="At least 8 characters"
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
              className="w-full py-3 px-4 bg-gh-purple-600 hover:bg-gh-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors mt-6"
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
                  Creating account...
                </span>
              ) : (
                'Create Account & Reveal Character'
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-gray-500 text-xs">
            By creating an account, you agree to our Terms of Service and
            Privacy Policy.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
