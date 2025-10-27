'use client'

import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  // Check if DEMO_MODE is enabled (memoized to prevent re-calculation)
  const isDemoMode = useMemo(() => process.env.NEXT_PUBLIC_DEMO_MODE === 'true', []);

  // In DEMO_MODE or when authenticated, redirect to dashboard
  useEffect(() => {
    if (isDemoMode || user) {
      console.log('[Home] Redirecting to dashboard', { isDemoMode, hasUser: !!user });
      router.push('/dashboard');
    }
    // If not authenticated and not demo mode, stay on landing page (/)
  }, [isDemoMode, user, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Welcome to Renubu</h1>
        
        {isDemoMode || user ? (
          <div className="space-y-4">
            <p className="text-green-600 font-medium">
              {isDemoMode ? 'Demo Mode Active - Redirecting...' : `Welcome back, ${user?.email}!`}
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-gray-600 text-lg">
              Customer Success Management Platform
            </p>
            <Link
              href="/signin"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Sign In
            </Link>
            <p className="text-sm text-gray-500 mt-4">
              Streamline renewals, drive expansion, reduce churn
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
