'use client';

/**
 * Individual Profile Page
 *
 * Full profile display:
 * - Header with name, career level, archetype, score
 * - Personality profile (MBTI + Enneagram)
 * - Badge showcase
 * - Category scores (if show_scores = true)
 * - Best fit roles
 * - Public summary
 * - Video player (if video_url exists)
 * - Contact button (if email visible)
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { PublicProfile } from '@/lib/assessment/types';

export default function IndividualProfilePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch(`/api/profiles/${slug}`);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to load profile');
        }

        const data = await response.json();
        setProfile(data);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) {
      loadProfile();
    }
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-red-500/10 border border-red-500/30 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold text-red-400 mb-4">Profile Not Found</h2>
          <p className="text-gray-300 mb-6">{error || 'This profile does not exist or has been removed.'}</p>
          <button
            onClick={() => router.push('/profiles')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-lg transition-all duration-200"
          >
            Browse All Profiles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                {profile.name}
              </h1>
              {profile.archetype && (
                <p className="text-xl font-medium bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
                  {profile.archetype}
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {profile.career_level.replace('_', ' ').toUpperCase()}
                </span>
                {profile.years_experience > 0 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                    {profile.years_experience} years experience
                  </span>
                )}
              </div>
            </div>

            {/* Overall Score */}
            {profile.show_scores && profile.overall_score !== undefined && (
              <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-xl p-6 text-center min-w-[140px]">
                <div className="text-5xl font-bold text-white mb-2">
                  {profile.overall_score}
                </div>
                <div className="text-sm text-gray-300">Overall Score</div>
              </div>
            )}
          </div>
        </div>

        {/* Personality Profile */}
        {profile.personality_type && (
          <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/30 rounded-xl p-8 mb-8">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Personality Profile
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-400 mb-2">MBTI Type</div>
                <div className="text-3xl font-bold text-white">{profile.personality_type}</div>
              </div>
            </div>
          </div>
        )}

        {/* Badge Showcase */}
        {profile.badges && profile.badges.length > 0 && (
          <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-xl p-8 mb-8">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              Achievements
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {profile.badges.map((badge, idx) => (
                <div
                  key={idx}
                  className="bg-gray-900/50 border border-yellow-500/20 rounded-lg p-4 text-center hover:border-yellow-500/40 transition-all"
                >
                  <div className="text-4xl mb-2">🏆</div>
                  <div className="text-sm font-semibold text-yellow-300">{badge}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Scores */}
        {profile.show_scores && profile.category_scores && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Category Scores
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Technical */}
              <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-blue-500/30 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-blue-300 mb-4">Technical</h3>
                <div className="text-5xl font-bold text-white mb-4">
                  {profile.category_scores.technical.overall}
                </div>
                <div className="space-y-2">
                  {Object.entries(profile.category_scores.technical.subscores).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-400 capitalize">{key.replace('_', ' ')}</span>
                      <span className="text-white font-semibold">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emotional */}
              <div className="bg-gradient-to-br from-pink-900/20 to-rose-900/20 border border-pink-500/30 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-pink-300 mb-4">Emotional</h3>
                <div className="text-5xl font-bold text-white mb-4">
                  {profile.category_scores.emotional.overall}
                </div>
                <div className="space-y-2">
                  {Object.entries(profile.category_scores.emotional.subscores).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-400 capitalize">{key.replace('_', ' ')}</span>
                      <span className="text-white font-semibold">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Creative */}
              <div className="bg-gradient-to-br from-purple-900/20 to-fuchsia-900/20 border border-purple-500/30 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-purple-300 mb-4">Creative</h3>
                <div className="text-5xl font-bold text-white mb-4">
                  {profile.category_scores.creative.overall}
                </div>
                <div className="space-y-2">
                  {Object.entries(profile.category_scores.creative.subscores).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-400 capitalize">{key.replace('_', ' ')}</span>
                      <span className="text-white font-semibold">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Best Fit Roles */}
        {profile.best_fit_roles && profile.best_fit_roles.length > 0 && (
          <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-xl p-8 mb-8">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Best Fit Roles
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {profile.best_fit_roles.map((role, idx) => (
                <div
                  key={idx}
                  className="bg-gray-900/50 border border-green-500/20 rounded-lg p-4 flex items-center gap-3"
                >
                  <div className="text-2xl">💼</div>
                  <div className="text-white font-medium">{role}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Public Summary */}
        {profile.public_summary && (
          <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-700/30 rounded-xl p-8 mb-8">
            <h2 className="text-3xl font-bold mb-6 text-white">Summary</h2>
            <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">
              {profile.public_summary}
            </p>
          </div>
        )}

        {/* Video Player */}
        {profile.video_url && (
          <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-xl p-8 mb-8">
            <h2 className="text-3xl font-bold mb-6 text-white">Video Introduction</h2>
            <div className="aspect-video rounded-lg overflow-hidden bg-gray-900">
              <video
                controls
                className="w-full h-full"
                src={profile.video_url}
              >
                Your browser does not support video playback.
              </video>
            </div>
          </div>
        )}

        {/* Contact Section */}
        {profile.email && (
          <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-xl p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Interested in connecting?</h3>
            <a
              href={`mailto:${profile.email}`}
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-purple-500/20"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Contact {profile.name}
            </a>
          </div>
        )}

        {/* Back to Browse */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/profiles')}
            className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
          >
            ← Back to All Profiles
          </button>
        </div>
      </div>
    </div>
  );
}
