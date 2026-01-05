'use client';

import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';

interface LinkedInSignInButtonProps {
  redirectTo?: string;
  source?: 'login' | 'assessment';
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
}

export function LinkedInSignInButton({
  redirectTo = '/members',
  source = 'login',
  variant = 'primary',
  fullWidth = false
}: LinkedInSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleSignIn = async () => {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}&source=${source}`,
        },
      });

      if (error) {
        console.error('LinkedIn sign-in error:', error);
        alert('Failed to sign in with LinkedIn. Please try again.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('LinkedIn sign-in error:', err);
      alert('Failed to sign in with LinkedIn. Please try again.');
      setIsLoading(false);
    }
  };

  const isPrimary = variant === 'primary';

  return (
    <button
      onClick={handleSignIn}
      disabled={isLoading}
      className={`
        ${fullWidth ? 'w-full' : ''}
        flex items-center justify-center gap-3
        px-8 py-3
        font-mono uppercase tracking-wider
        transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed
        ${isPrimary
          ? 'border-2 border-[#0A66C2] bg-[#0A66C2] text-white hover:bg-[#004182] hover:border-[#004182] hover:shadow-[0_0_20px_rgba(10,102,194,0.5)]'
          : 'border-2 border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-background hover:shadow-[0_0_20px_rgba(0,204,221,0.5)]'
        }
      `}
      aria-label="Sign in with LinkedIn"
    >
      {isLoading ? (
        <>
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <LinkedInIcon />
          <span>Sign in with LinkedIn</span>
        </>
      )}
    </button>
  );
}

function LinkedInIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}
