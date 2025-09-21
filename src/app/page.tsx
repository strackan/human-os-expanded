'use client'

import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Check if DEMO_MODE is enabled
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  
  // In DEMO_MODE or when authenticated, redirect to workflows
  useEffect(() => {
    if (isDemoMode) {
      router.push('/workflows');
    } else if (user) {
      router.push('/dashboard');
    } else {
      // Redirect unauthenticated users to the hero page
      router.push('/hero');
    }
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
          <div className="space-y-4">
            <p className="text-gray-600 mb-6">
              Redirecting to our beautiful landing page...
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              If you're not redirected automatically, <Link href="/hero" className="text-blue-600 hover:underline">click here</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
