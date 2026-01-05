'use client';

import Link from 'next/link';
import type { PublicProfile } from '@/lib/assessment/types';

interface ProfileCardProps {
  profile: PublicProfile;
}

export function ProfileCard({ profile }: ProfileCardProps) {
  // Get top 5 badges to display
  const topBadges = profile.badges?.slice(0, 5) || [];

  // Truncate summary to 150 characters
  const truncatedSummary = profile.public_summary
    ? profile.public_summary.length > 150
      ? profile.public_summary.substring(0, 150) + '...'
      : profile.public_summary
    : 'No summary available.';

  return (
    <Link href={`/profiles/${profile.profile_slug}`}>
      <div className="group bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-2 border-gray-700/30 hover:border-purple-500/50 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 cursor-pointer h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors mb-1">
              {profile.name}
            </h3>
            {profile.archetype && (
              <p className="text-sm font-medium bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                {profile.archetype}
              </p>
            )}
          </div>
          {profile.show_scores && profile.overall_score !== undefined && (
            <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-lg px-3 py-2 ml-4">
              <div className="text-2xl font-bold text-white">{profile.overall_score}</div>
              <div className="text-xs text-gray-400">Overall</div>
            </div>
          )}
        </div>

        {/* Career Level Badge */}
        <div className="mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
            {profile.career_level.replace('_', ' ').toUpperCase()}
            {profile.years_experience > 0 && ` • ${profile.years_experience}y exp`}
          </span>
        </div>

        {/* Personality Type */}
        {profile.personality_type && (
          <div className="mb-4">
            <div className="text-sm text-gray-400 mb-1">Personality</div>
            <div className="text-base font-semibold text-purple-300">
              {profile.personality_type}
            </div>
          </div>
        )}

        {/* Badges */}
        {topBadges.length > 0 && (
          <div className="mb-4">
            <div className="text-sm text-gray-400 mb-2">Top Achievements</div>
            <div className="flex flex-wrap gap-2">
              {topBadges.map((badge, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-500/10 text-yellow-300 border border-yellow-500/20"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="flex-1 mb-4">
          <p className="text-sm text-gray-300 leading-relaxed">{truncatedSummary}</p>
        </div>

        {/* View Profile CTA */}
        <div className="pt-4 border-t border-gray-700/30">
          <div className="flex items-center justify-between text-sm">
            <span className="text-purple-400 font-medium group-hover:text-purple-300 transition-colors">
              View Full Profile
            </span>
            <svg
              className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
