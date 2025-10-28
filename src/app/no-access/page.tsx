'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import Link from 'next/link';
import { ShieldAlertIcon } from 'lucide-react';

export default function NoAccessPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="mx-auto h-24 w-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <ShieldAlertIcon className="h-12 w-12 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-2">
            You don't have permission to access this application.
          </p>
          {user?.email && (
            <p className="text-sm text-gray-500 mb-6">
              Signed in as: <span className="font-medium">{user.email}</span>
            </p>
          )}
          <div className="bg-white rounded-lg p-4 border border-red-200 mb-6">
            <p className="text-sm text-gray-700">
              If you believe this is an error, please contact your workspace administrator to request an invitation.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => signOut()}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            Sign Out
          </button>
          <Link
            href="/"
            className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Return to Home
          </Link>
        </div>

        <p className="text-xs text-gray-500 mt-8">
          Need help? Contact support@renubu.com
        </p>
      </div>
    </div>
  );
}
