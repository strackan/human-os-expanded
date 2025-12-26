'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SignOutButtonProps {
  className?: string;
  onClick?: () => void;
}

export default function SignOutButton({ className, onClick }: SignOutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      // Call custom signout API
      await fetch('/api/auth/signout', {
        method: 'POST',
      });
      
      if (onClick) onClick();
      
      // Redirect to home page
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={isLoading}
      className={className || "bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 text-sm"}
    >
      <svg className="w-4 h-4 mr-3 text-red-400 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      {isLoading ? 'Signing out...' : 'Sign Out'}
    </button>
  );
} 