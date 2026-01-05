'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PublishProfileToggle } from '@/components/assessment/PublishProfileToggle';
import type { AssessmentResults } from '@/lib/assessment/types';

interface ResultsActionsProps {
  sessionId: string;
  isPublished: boolean;
  results?: AssessmentResults;
}

export function ResultsActions({ sessionId, isPublished, results }: ResultsActionsProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [isCheckingMembership, setIsCheckingMembership] = useState(true);

  useEffect(() => {
    async function checkMembership() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setIsMember(false);
          return;
        }

        // Check if user has a profile (indicating they're a member)
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, membership_tier')
          .eq('id', user.id)
          .single();

        setIsMember(!!profile);
      } catch (error) {
        console.error('Error checking membership:', error);
        setIsMember(false);
      } finally {
        setIsCheckingMembership(false);
      }
    }

    checkMembership();
  }, []);

  return (
    <div className="space-y-6">
      {/* Join Community CTA - Only for non-members */}
      {!isCheckingMembership && isMember === false && (
        <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 border-2 border-purple-500/50 rounded-lg p-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Join the GoodHang Community
            </h2>
            <p className="text-gray-300 text-lg mb-2">
              You&apos;ve completed the assessment! Now join our community to connect with other talented CS professionals.
            </p>
            <p className="text-gray-400 text-sm">
              Get access to exclusive events, networking opportunities, and career resources.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/members"
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg transition-all text-center font-semibold shadow-lg hover:shadow-purple-500/50"
            >
              Join Community
            </Link>
            <Link
              href="/profiles"
              className="px-8 py-4 border-2 border-purple-500/50 hover:border-purple-400 text-purple-300 hover:text-purple-200 rounded-lg transition-all text-center font-semibold"
            >
              Browse Member Profiles
            </Link>
          </div>
        </div>
      )}

      {/* Publish Profile Toggle */}
      {results && (
        <PublishProfileToggle
          sessionId={sessionId}
          isPublished={isPublished}
          profileData={{
            name: results.user_id, // Will be replaced with actual name from profile
            archetype: results.archetype,
            career_level: 'mid', // TODO: Get from session
            years_experience: 0, // TODO: Get from session
            best_fit_roles: results.best_fit_roles,
            overall_score: results.overall_score,
            // Optional properties - only include if present
            ...(results.personality_profile?.mbti && { personality_type: results.personality_profile.mbti }),
            ...(results.badges && { badges: results.badges.map(b => b.name) }),
            ...(results.public_summary && { public_summary: results.public_summary }),
            ...(results.category_scores && { category_scores: results.category_scores }),
          }}
          onPublishChange={(published, slug) => {
            if (published && slug) {
              router.push(`/profiles/${slug}`);
            } else {
              router.refresh();
            }
          }}
        />
      )}

      {/* Other Actions */}
      <div className="bg-gray-900/30 border border-gray-700/30 rounded-lg p-8">
        <h3 className="text-2xl font-bold text-white mb-6">Other Actions</h3>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Return to Members Area */}
          <Link
            href="/members"
            className="px-6 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-center font-semibold"
          >
            Back to Members Area
          </Link>

          {/* Browse Profiles */}
          <Link
            href="/profiles"
            className="px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg transition-all text-center font-semibold"
          >
            Browse Talent Profiles
          </Link>

          {/* Retake Assessment (future) */}
          <button
            disabled
            className="px-6 py-4 bg-gray-800/50 text-gray-500 rounded-lg cursor-not-allowed text-center font-semibold"
          >
            Retake Assessment (Coming Soon)
          </button>

          {/* Download Results (future) */}
          <button
            disabled
            className="px-6 py-4 bg-gray-800/50 text-gray-500 rounded-lg cursor-not-allowed text-center font-semibold"
          >
            Download PDF (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  );
}
