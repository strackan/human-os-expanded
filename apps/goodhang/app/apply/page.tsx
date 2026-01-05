'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ApplyPage() {
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLinkedInAuth = async () => {
    setIsLoading(true);
    const supabase = createClient();

    // Store invite code in session storage if provided
    if (inviteCode.trim()) {
      sessionStorage.setItem('goodhang_invite_code', inviteCode.trim());
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/assessment/start`,
      },
    });

    if (error) {
      console.error('LinkedIn auth error:', error);
      setIsLoading(false);
      alert('Failed to authenticate with LinkedIn. Please try again.');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-sm border-b border-neon-purple/20">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="font-mono text-2xl font-bold">
            <span className="neon-purple">GOOD_HANG</span>
          </Link>
          <div className="flex gap-6 items-center">
            <Link href="/" className="text-foreground hover:text-neon-cyan transition-colors font-mono">
              Home
            </Link>
            <Link href="/about" className="text-foreground hover:text-neon-cyan transition-colors font-mono">
              About
            </Link>
            <Link href="/login" className="text-neon-purple hover:text-neon-magenta transition-colors font-mono">
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 pt-32 pb-20">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold font-mono neon-purple mb-4">
              APPLY FOR MEMBERSHIP
            </h1>
            <p className="text-xl text-foreground-dim font-mono max-w-2xl mx-auto mb-8">
              Join an exclusive community of tech professionals who want more than networking —
              <span className="text-neon-cyan"> they want adventure</span>
            </p>
          </div>

          {/* What Members Get */}
          <div className="border-2 border-neon-cyan/30 bg-background-lighter p-8 mb-8">
            <h2 className="text-2xl font-bold font-mono neon-cyan mb-6">What Members Get</h2>
            <ul className="space-y-4 text-foreground-dim font-mono">
              <li className="flex items-start">
                <span className="text-neon-purple mr-3 text-xl">→</span>
                <span>Access to member directory and direct connections</span>
              </li>
              <li className="flex items-start">
                <span className="text-neon-purple mr-3 text-xl">→</span>
                <span>Invites to exclusive events and social hangs</span>
              </li>
              <li className="flex items-start">
                <span className="text-neon-purple mr-3 text-xl">→</span>
                <span>Priority RSVP for popular events</span>
              </li>
              <li className="flex items-start">
                <span className="text-neon-purple mr-3 text-xl">→</span>
                <span>Email updates on upcoming opportunities</span>
              </li>
              <li className="flex items-start">
                <span className="text-neon-purple mr-3 text-xl">→</span>
                <span><strong>Core Members</strong>: Beacon system, favor tracker, accountability partners</span>
              </li>
            </ul>
          </div>

          {/* How it Works */}
          <div className="border-2 border-neon-magenta/30 bg-background-lighter p-8 mb-12">
            <h2 className="text-2xl font-bold font-mono neon-magenta mb-6">How it Works</h2>
            <ol className="space-y-4 text-foreground-dim font-mono">
              <li className="flex items-start">
                <span className="text-neon-purple mr-3 font-bold text-xl">1.</span>
                <span>Click below to Login with LinkedIn</span>
              </li>
              <li className="flex items-start">
                <span className="text-neon-purple mr-3 font-bold text-xl">2.</span>
                <span>Take the assessment</span>
              </li>
              <li className="flex items-start">
                <span className="text-neon-purple mr-3 font-bold text-xl">3.</span>
                <span>You will hear from us (personally) within a week</span>
              </li>
              <li className="flex items-start">
                <span className="text-neon-purple mr-3 font-bold text-xl">4.</span>
                <span>Your detailed assessment is our gift to you forever</span>
              </li>
            </ol>
            <p className="text-foreground-dim font-mono text-sm mt-6 italic">
              That&apos;s it!
            </p>
          </div>

          {/* LinkedIn Authentication */}
          <div className="border-2 border-neon-purple/30 bg-background-lighter p-8 text-center">
            <h2 className="text-2xl font-bold font-mono neon-purple mb-6">Ready to Begin?</h2>

            {/* Optional Invite Code */}
            <div className="mb-6">
              <label className="block text-foreground-dim font-mono text-sm mb-2 text-left">
                Have an invite code? (Optional)
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Enter invite code"
                className="w-full px-4 py-3 bg-background border-2 border-neon-cyan/30 text-foreground font-mono focus:border-neon-cyan focus:outline-none transition-colors uppercase"
                maxLength={8}
              />
              <p className="text-foreground-dim font-mono text-xs mt-2 text-left">
                Invite codes grant immediate trial membership upon assessment completion
              </p>
            </div>

            {/* LinkedIn Auth Button */}
            <button
              onClick={handleLinkedInAuth}
              disabled={isLoading}
              className="w-full px-8 py-4 bg-[#0077B5] hover:bg-[#006399] text-white font-mono font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isLoading ? (
                'Connecting to LinkedIn...'
              ) : (
                <>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  Authenticate with LinkedIn
                </>
              )}
            </button>

            <p className="text-foreground-dim font-mono text-xs mt-4">
              We use LinkedIn to verify your professional identity. We won&apos;t post anything without your permission.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
