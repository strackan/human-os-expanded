'use client';

import { useSession } from 'next-auth/react';

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="h-full bg-main-bg">
      <div className="h-full p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Settings</h1>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">User Preferences</h2>
            <p className="text-gray-600">Additional settings and preferences coming soon!</p>
          </div>
        </div>
      </div>
    </div>
  );
} 