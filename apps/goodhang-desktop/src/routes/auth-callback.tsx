import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { claimActivationKey, storeSession, storeDeviceRegistration, type ProductType } from '@/lib/tauri';
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
      console.log('=== AUTH CALLBACK STARTED ===');
      try {
        // Get the session from the URL hash (Supabase puts it there after OAuth)
        console.log('[AuthCallback] Getting Supabase session...');
        const { data: { session }, error: sessionError } =
          await supabase.auth.getSession();
        console.log('[AuthCallback] Session result:', { hasSession: !!session, error: sessionError?.message });

        if (sessionError) throw sessionError;
        if (!session || !session.user) {
          throw new Error('No session found after authentication');
        }

        // Get stored activation data
        const activationCode = sessionStorage.getItem('activationCode');
        const sessionId = sessionStorage.getItem('sessionId');
        const existingUserId = sessionStorage.getItem('existingUserId');
        const humanOsUserId = sessionStorage.getItem('humanOsUserId');
        const alreadyRedeemed = sessionStorage.getItem('alreadyRedeemed') === 'true';

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

        // Only claim if not already redeemed (re-authentication case)
        if (!alreadyRedeemed) {
          const claimResult = await claimActivationKey(
            activationCode,
            session.user.id
          );

          if (!claimResult.success) {
            throw new Error(claimResult.error || 'Failed to claim activation key');
          }
        } else {
          console.log('[AuthCallback] Skipping claim - key already redeemed, re-authenticating');
        }

        // Get product before clearing storage
        const product = sessionStorage.getItem('product') as ProductType | null;

        // Use human_os_user_id for founder_os data operations, fallback to auth user id
        const effectiveUserId = humanOsUserId || session.user.id;
        console.log('[AuthCallback] User IDs:', { authUserId: session.user.id, humanOsUserId, effectiveUserId });

        console.log('[AuthCallback] Retrieved from sessionStorage:', {
          activationCode,
          product,
          hasRefreshToken: !!session.refresh_token,
          refreshToken: session.refresh_token ? session.refresh_token.substring(0, 20) + '...' : null
        });

        // Store device registration permanently (this survives app restarts)
        // Includes refresh token for automatic session restoration
        if (product && session.refresh_token) {
          console.log('[AuthCallback] Storing device registration...');
          try {
            await storeDeviceRegistration(
              activationCode,
              effectiveUserId,
              product,
              session.refresh_token
            );
            console.log('[AuthCallback] Device registration stored successfully!');
          } catch (storeErr) {
            console.error('[AuthCallback] Failed to store device registration:', storeErr);
          }
        } else {
          console.warn('[AuthCallback] Skipping device registration storage:', {
            hasProduct: !!product,
            hasRefreshToken: !!session.refresh_token
          });
        }

        // Store session securely (includes token for API calls)
        const token = session.access_token || '';
        const effectiveSessionId = sessionId || 'no-session';
        await storeSession(effectiveUserId, effectiveSessionId, token);

        // Update auth store
        setSession(effectiveUserId, effectiveSessionId, token);

        // Clear temp storage
        sessionStorage.removeItem('activationCode');
        sessionStorage.removeItem('sessionId');
        sessionStorage.removeItem('preview');
        sessionStorage.removeItem('existingUserId');
        sessionStorage.removeItem('humanOsUserId');
        sessionStorage.removeItem('product');
        sessionStorage.removeItem('alreadyRedeemed');

        // Navigate to root — centralized routing in App.tsx will use
        // getRecommendedRoute() to decide tutorial vs production vs results
        navigate('/');
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
