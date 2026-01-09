'use client';

/**
 * CS Assessment Start Page with LinkedIn OAuth
 *
 * Flow:
 * 1. Check if user is authenticated
 * 2. If not, show LinkedIn sign-in (required)
 * 3. If authenticated, check assessment status:
 *    - not_started: go to interview
 *    - in_progress: go to interview (resume)
 *    - completed/approved/etc: show retake dialog
 */

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { LinkedInSignInButton } from '@/components/auth/LinkedInSignInButton';

interface ActivationKeyInfo {
  code: string;
  expiresAt: string;
}

function AssessmentStartContent() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompletedView, setShowCompletedView] = useState(false);
  const [activationKey, setActivationKey] = useState<ActivationKeyInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  // Create client lazily to avoid SSR issues during build
  const supabase = useMemo(() => createClient(), []);

  // Store invite code in sessionStorage before OAuth flow
  // This ensures the code persists through the LinkedIn OAuth redirect
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      sessionStorage.setItem('goodhang_invite_code', code);
    }
  }, [searchParams]);

  useEffect(() => {
    checkAuth();
  }, []);

  // Check if redirected here with completed=true (already completed assessment)
  useEffect(() => {
    if (searchParams.get('completed') === 'true') {
      setShowCompletedView(true);
      setIsLoading(false);
    }
  }, [searchParams]);

  const applyInviteCode = async () => {
    // Check for invite code in sessionStorage (set by /apply page)
    const inviteCode = sessionStorage.getItem('goodhang_invite_code');
    if (inviteCode) {
      try {
        const response = await fetch('/api/invite-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: inviteCode }),
        });
        if (response.ok) {
          console.log('Invite code applied successfully');
        }
        // Clear the code from storage regardless of success
        sessionStorage.removeItem('goodhang_invite_code');
      } catch (error) {
        console.error('Error applying invite code:', error);
        sessionStorage.removeItem('goodhang_invite_code');
      }
    }
  };

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);

      // If authenticated, check assessment status
      if (session) {
        await applyInviteCode();

        // Check assessment status
        const { data: profile } = await supabase
          .from('profiles')
          .select('assessment_status')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          switch (profile.assessment_status) {
            case 'not_started':
            case 'in_progress':
              // Go to interview
              router.push('/assessment/interview');
              return;
            case 'completed':
            case 'pending_review':
            case 'trial':
            case 'approved':
              // Fetch activation key for completed user
              await fetchActivationKey(session.user.id);
              setShowCompletedView(true);
              setIsLoading(false);
              return;
            case 'waitlist':
            case 'rejected':
              router.push('/status/not-approved');
              return;
            default:
              router.push('/assessment/interview');
              return;
          }
        } else {
          // No profile yet, go to interview
          router.push('/assessment/interview');
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActivationKey = async (userId: string) => {
    try {
      // Fetch the user's activation key
      const { data: keyData } = await supabase
        .from('activation_keys')
        .select('code, expires_at')
        .eq('user_id', userId)
        .eq('product', 'goodhang')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (keyData) {
        setActivationKey({
          code: keyData.code,
          expiresAt: keyData.expires_at,
        });
      }
    } catch (error) {
      console.error('Error fetching activation key:', error);
    }
  };

  const handleCopyKey = () => {
    if (activationKey) {
      navigator.clipboard.writeText(activationKey.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGoToMembers = () => {
    router.push('/members');
  };

  const handleGoToDownload = () => {
    router.push('/download');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Not authenticated - show LinkedIn sign-in
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                CS Assessment
              </h1>
              <p className="text-gray-300 text-lg">
                Join our talent bench and get matched with world-class CS opportunities
              </p>
            </div>

            {/* Info Box */}
            <div className="mb-8 bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
              <p className="text-blue-300 text-sm mb-2">
                <strong>LinkedIn Required</strong>
              </p>
              <p className="text-gray-300 text-sm">
                We use LinkedIn to verify your professional identity and auto-fill your profile.
                This helps us match you with the right opportunities.
              </p>
            </div>

            {/* LinkedIn Sign In Button */}
            <div className="mb-8">
              <LinkedInSignInButton
                redirectTo="/assessment/interview"
                source="assessment"
                variant="primary"
                fullWidth
              />
            </div>

            {/* What to Expect */}
            <div className="mt-8 pt-8 border-t border-purple-500/20 space-y-4">
              <h3 className="text-xl font-semibold text-purple-300">What to Expect</h3>
              <ul className="space-y-3 text-gray-300 text-sm">
                <li className="flex items-start">
                  <span className="text-purple-400 mr-3">•</span>
                  <span>
                    <strong>26 thoughtful questions</strong> across 6 sections covering your background, skills, and AI readiness
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-3">•</span>
                  <span>
                    <strong>~15-20 minutes</strong> to complete at your own pace
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-3">•</span>
                  <span>
                    <strong>AI-powered analysis</strong> scores you across 12 dimensions including IQ, EQ, technical skills, and AI competency
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-3">•</span>
                  <span>
                    <strong>Immediate results</strong> with your archetype, scores, and personalized recommendations
                  </span>
                </li>
              </ul>
            </div>

            {/* Privacy Note */}
            <p className="text-gray-500 text-xs text-center mt-6">
              Your responses are confidential and used only for matching you with relevant opportunities.
            </p>

            {/* Already a member link */}
            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Already have an account?{' '}
                <Link href="/login" className="text-purple-400 hover:text-purple-300">
                  Log in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show completed view with activation key and download instructions
  if (showCompletedView) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                Assessment Complete!
              </h1>
              <p className="text-gray-300">
                Download the Good Hang app and enter your activation key to get started.
              </p>
            </div>

            {/* Activation Key Display */}
            {activationKey ? (
              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-2 text-center">Your Activation Key</p>
                <div className="flex items-center justify-center gap-2 px-4 py-3 bg-black/50 border border-green-500/30 rounded-lg">
                  <span className="font-mono text-xl text-green-400 tracking-wider">
                    {activationKey.code}
                  </span>
                  <button
                    onClick={handleCopyKey}
                    className="p-2 text-gray-400 hover:text-green-400 transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
                {activationKey.expiresAt && (
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Expires: {new Date(activationKey.expiresAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-300 text-sm text-center">
                  Activation key not found. Please contact support if you need assistance.
                </p>
              </div>
            )}

            {/* Instructions */}
            <div className="mb-6 space-y-3">
              <h3 className="text-sm font-semibold text-gray-300">Next Steps:</h3>
              <ol className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 font-mono">1.</span>
                  Download the Good Hang desktop app for your platform
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 font-mono">2.</span>
                  Install and launch the application
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 font-mono">3.</span>
                  Enter your activation key when prompted
                </li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleGoToDownload}
                className="w-full px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-lg transition-all duration-200"
              >
                Download Desktop App
              </button>
              <button
                onClick={handleGoToMembers}
                className="w-full px-8 py-3 border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white font-semibold rounded-lg transition-all duration-200"
              >
                Go to Members Area
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated - this shouldn't show because of redirect, but just in case
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-gray-300 text-lg">Starting your assessment...</p>
      </div>
    </div>
  );
}

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
    </div>
  );
}

// Main export wrapped in Suspense for useSearchParams
export default function AssessmentStartPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AssessmentStartContent />
    </Suspense>
  );
}
