import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

/**
 * useInWorkflowAuth Hook
 *
 * React hook for checking authentication state within workflow components.
 * Provides convenient methods to check if user is authenticated and get user data.
 *
 * Usage:
 * ```tsx
 * const { user, isAuthenticated, isLoading } = useInWorkflowAuth();
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (!isAuthenticated) return <InWorkflowAuth onAuthSuccess={() => {...}} />;
 *
 * // User is authenticated, show workflow content
 * return <WorkflowContent user={user} />
 * ```
 */
export function useInWorkflowAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
  };
}
