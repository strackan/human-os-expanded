'use client';

/**
 * Founders Auth Context
 *
 * Replaces Zustand stores (auth.ts + user.ts) from the desktop app.
 * Uses Supabase SSR cookies for auth instead of Tauri keyring.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { ProductType, UserStatus } from './types';

// =============================================================================
// CONTEXT SHAPE
// =============================================================================

interface FoundersAuthState {
  isAuthenticated: boolean;
  userId: string | null;
  token: string | null;
  product: ProductType | null;
  sessionId: string | null;
  status: UserStatus | null;
  loading: boolean;
  statusLoading: boolean;
  error: string | null;
  fetchStatus: () => Promise<void>;
  signOut: () => Promise<void>;
}

const FoundersAuthContext = createContext<FoundersAuthState | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

export function FoundersAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductType | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user status from API
  const fetchStatus = useCallback(async (accessToken?: string) => {
    const tokenToUse = accessToken || token;
    if (!tokenToUse) return;

    setStatusLoading(true);
    try {
      const response = await fetch('/api/user/status', {
        headers: { Authorization: `Bearer ${tokenToUse}` },
      });

      if (!response.ok) {
        throw new Error(`Status fetch failed: ${response.status}`);
      }

      const data: UserStatus = await response.json();
      setStatus(data);

      // Extract session ID and product from status
      if (data.contexts?.active) {
        setSessionId(data.contexts.active);
      }
      if (data.products?.founder_os?.enabled) {
        setProduct('founder_os');
      }
    } catch (err) {
      console.error('[FoundersAuth] Failed to fetch status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
    } finally {
      setStatusLoading(false);
    }
  }, [token]);

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          setIsAuthenticated(true);
          setUserId(session.user.id);
          setToken(session.access_token);
          setLoading(false);

          // Fetch status with the token
          await fetchStatus(session.access_token);
        } else {
          setIsAuthenticated(false);
          setLoading(false);
        }
      } catch (err) {
        console.error('[FoundersAuth] Session check failed:', err);
        setIsAuthenticated(false);
        setLoading(false);
        setError(err instanceof Error ? err.message : 'Session check failed');
      }
    };

    checkSession();

    // Listen for auth state changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        if (session) {
          setIsAuthenticated(true);
          setUserId(session.user.id);
          setToken(session.access_token);
          // Re-fetch status when auth changes
          await fetchStatus(session.access_token);
        } else {
          setIsAuthenticated(false);
          setUserId(null);
          setToken(null);
          setStatus(null);
          setSessionId(null);
          setProduct(null);
        }
      }
    );

    return () => { subscription.unsubscribe(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserId(null);
    setToken(null);
    setStatus(null);
    setSessionId(null);
    setProduct(null);
  }, []);

  return (
    <FoundersAuthContext.Provider
      value={{
        isAuthenticated,
        userId,
        token,
        product,
        sessionId,
        status,
        loading,
        statusLoading,
        error,
        fetchStatus,
        signOut,
      }}
    >
      {children}
    </FoundersAuthContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useFoundersAuth(): FoundersAuthState {
  const context = useContext(FoundersAuthContext);
  if (!context) {
    throw new Error('useFoundersAuth must be used within a FoundersAuthProvider');
  }
  return context;
}

// =============================================================================
// ROUTING HELPER
// =============================================================================

/**
 * Determine where to route the user based on their status.
 * Adapted from desktop's getRecommendedRoute() in stores/user.ts
 */
export function getRecommendedRoute(status: UserStatus | null): string {
  if (!status || !status.found) {
    return '/founders';
  }

  const { products, contexts } = status;

  if (products.founder_os.enabled) {
    const sculptor = products.founder_os.sculptor;
    const identity = products.founder_os.identity_profile;

    if (sculptor?.completed && !identity?.completed) {
      const tutorialCompleted = typeof window !== 'undefined'
        ? localStorage.getItem('founder-os-tutorial-completed')
        : null;
      if (!tutorialCompleted) {
        const activeSession = contexts?.active;
        return activeSession
          ? `/founders/tutorial?session=${activeSession}`
          : '/founders/tutorial';
      }
      return '/founders/production';
    }

    if (identity?.completed) {
      return '/founders/production';
    }

    return '/founders/production';
  }

  return '/founders';
}
