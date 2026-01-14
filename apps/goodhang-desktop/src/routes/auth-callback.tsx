import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { claimActivationKey, storeSession } from '@/lib/tauri';
import { useAuthStore } from '@/lib/stores/auth';

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { setSession } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      try {
        // Get the session from the URL hash (Supabase puts it there after OAuth)
        const { data: { session }, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!session || !session.user) {
          throw new Error('No session found after authentication');
        }

        // Get stored activation data
        const activationCode = sessionStorage.getItem('activationCode');
        const sessionId = sessionStorage.getItem('sessionId');
        const existingUserId = sessionStorage.getItem('existingUserId');

        if (!activationCode) {
          // No activation code - just complete the auth
          navigate('/');
          return;
        }

        // Verify user matches the activation key's user (if there was one)
        if (existingUserId && session.user.id !== existingUserId) {
          throw new Error(
            'This activation key belongs to a different account. Please sign in with the account you used to take the assessment.'
          );
        }

        // Claim the activation key
        const claimResult = await claimActivationKey(
          activationCode,
          session.user.id
        );

        if (!claimResult.success) {
          throw new Error(claimResult.error || 'Failed to claim activation key');
        }

        // Store session securely
        const token = session.access_token || '';
        const effectiveSessionId = sessionId || 'no-session';
        await storeSession(session.user.id, effectiveSessionId, token);

        // Update auth store
        setSession(session.user.id, effectiveSessionId, token);

        // Get product before clearing storage
        const product = sessionStorage.getItem('product');

        // Clear temp storage
        sessionStorage.removeItem('activationCode');
        sessionStorage.removeItem('sessionId');
        sessionStorage.removeItem('preview');
        sessionStorage.removeItem('existingUserId');
        sessionStorage.removeItem('product');

        // Navigate based on product type
        if (sessionId) {
          navigate('/results');
        } else if (product === 'founder_os') {
          navigate('/founder-os/onboarding');
        } else {
          navigate('/dashboard');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        const message =
          err instanceof Error ? err.message : 'Authentication failed';
        setError(message);
      }
    }

    handleCallback();
  }, [navigate, setSession]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="w-full max-w-md text-center">
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-400 mb-2">
              Authentication Error
            </h2>
            <p className="text-red-300 mb-4">{error}</p>
            <button
              onClick={() => navigate('/activate')}
              className="px-4 py-2 bg-gh-purple-600 hover:bg-gh-purple-700 text-white rounded-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gh-purple-500 mx-auto mb-4" />
        <p className="text-gray-400">Completing sign in...</p>
      </div>
    </div>
  );
}
