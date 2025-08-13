'use client'

import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';

export default function Workflows() {
  const { user } = useAuth();
  
  // Check if DEMO_MODE is enabled
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Renubu Workflows</h1>
        
        {/* Show welcome message if user is authenticated or in demo mode */}
        {(isDemoMode || user) && (
          <div className="mb-6 text-center">
            <p className="text-green-600 font-medium">
              {isDemoMode ? 'Demo Mode Active' : `Welcome back, ${user?.email}!`}
            </p>
            <Link 
              href="/dashboard" 
              className="inline-block mt-2 text-blue-600 hover:text-blue-700 underline"
            >
              Go to Dashboard
            </Link>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Revenue Architects Card */}
          <Link 
            href="/revenue-architects" 
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white py-3 px-4">
              <h2 className="font-bold">Revenue Architects</h2>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600">
                Identify renewal opportunities and surface upsell recommendations using real-time data.
              </p>
            </div>
          </Link>
          {/* AI-Powered Card */}
          <Link 
            href="/ai-powered" 
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-4">
              <h2 className="font-bold">AI-Powered</h2>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600">
                Automate routine tasks for CSMs, freeing up time for strategic work.
              </p>
            </div>
          </Link>
          {/* Impact Engineers Card */}
          <Link 
            href="/impact-engineers" 
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 px-4">
              <h2 className="font-bold">Impact Engineers</h2>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600">
                Measure and communicate value delivered to customers based on signals.
              </p>
            </div>
          </Link>
          {/* Original Workflow */}
          <Link 
            href="/renewals-hq" 
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="bg-gradient-to-r from-gray-700 to-gray-900 text-white py-3 px-4">
              <h2 className="font-bold">Original Workflow</h2>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600">
                The standard renewals workflow example.
              </p>
            </div>
          </Link>
        </div>
        
        {/* Show sign in link if user is not authenticated */}
        {!user && (
          <div className="mt-8 text-center">
            <Link 
              href="/signin" 
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              Sign In to Access Workflows
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 