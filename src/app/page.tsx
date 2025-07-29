'use client'

import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Welcome to Renubu</h1>
        
        {user ? (
          <div className="space-y-4">
            <p className="text-green-600 font-medium">Welcome back, {user.email}!</p>
            <Link 
              href="/workflows" 
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Workflows
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600 mb-6">
              Sign in to access your customer renewal workflows and insights.
            </p>
            <Link 
              href="/signin" 
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
