'use client';

import React from 'react';

interface PrivateEntryDisplayProps {
  title: string;
  onUnlock: () => void;
  hasBreakGlass: boolean;
}

export default function PrivateEntryDisplay({ 
  title, 
  onUnlock, 
  hasBreakGlass 
}: PrivateEntryDisplayProps) {
  return (
    <div className="relative min-h-[400px] bg-gray-50 rounded-lg overflow-hidden">
      {/* Blurred background content */}
      <div className="absolute inset-0 p-6">
        <div className="h-8 bg-gray-200 rounded mb-4 blur-sm"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-300 rounded blur-sm"></div>
          <div className="h-4 bg-gray-300 rounded blur-sm w-5/6"></div>
          <div className="h-4 bg-gray-300 rounded blur-sm w-4/6"></div>
          <div className="h-4 bg-gray-300 rounded blur-sm"></div>
          <div className="h-4 bg-gray-300 rounded blur-sm w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded blur-sm w-5/6"></div>
          <div className="h-4 bg-gray-300 rounded blur-sm"></div>
          <div className="h-4 bg-gray-300 rounded blur-sm w-2/3"></div>
        </div>
      </div>

      {/* Privacy overlay */}
      <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg 
                className="w-8 h-8 text-gray-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              Privacy Protected Entry
            </h3>
            <p className="text-gray-600 text-sm">
              {title ? `"${title}"` : 'This entry'} has been marked for privacy protection. 
              Enter your password to view the content.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={onUnlock}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              🔓 Unlock Entry
            </button>
            
            {hasBreakGlass && (
              <p className="text-xs text-gray-500">
                Forgot your password? Use break glass access when unlocking.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 