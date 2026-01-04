'use client';

/**
 * Publish Profile Toggle Component
 *
 * Features:
 * - Toggle switch (published/unpublished)
 * - Preview modal showing what will be public
 * - Privacy settings checkboxes (show scores, show email)
 * - Save button
 * - Calls /api/profile/publish
 */

import { useState } from 'react';
import type { CategoryScores } from '@/lib/assessment/types';

interface PublishProfileToggleProps {
  sessionId: string;
  isPublished: boolean;
  profileData: {
    name: string;
    archetype?: string | undefined;
    career_level?: string | undefined;
    years_experience?: number | undefined;
    personality_type?: string | undefined;
    badges?: string[] | undefined;
    best_fit_roles?: string[] | undefined;
    public_summary?: string | undefined;
    overall_score?: number | undefined;
    category_scores?: CategoryScores;
  };
  onPublishChange?: (published: boolean, slug?: string) => void;
}

export function PublishProfileToggle({
  sessionId,
  isPublished: initialPublished,
  profileData,
  onPublishChange,
}: PublishProfileToggleProps) {
  const [isPublished, setIsPublished] = useState(initialPublished);
  const [showModal, setShowModal] = useState(false);
  const [showScores, setShowScores] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileUrl, setProfileUrl] = useState<string | null>(null);

  const handleToggleClick = () => {
    if (isPublished) {
      // Unpublish immediately
      handleUnpublish();
    } else {
      // Show modal to configure publish settings
      setShowModal(true);
    }
  };

  const handlePublish = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/profile/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          show_scores: showScores,
          show_email: showEmail,
          video_url: videoUrl || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to publish profile');
      }

      const data = await response.json();
      setIsPublished(true);
      setProfileUrl(data.url);
      setShowModal(false);
      onPublishChange?.(true, data.slug);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to publish profile';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnpublish = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/profile/publish', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to unpublish profile');
      }

      setIsPublished(false);
      setProfileUrl(null);
      onPublishChange?.(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unpublish profile';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-white mb-1">Publish Profile</h3>
          <p className="text-sm text-gray-400">
            {isPublished
              ? 'Your profile is visible on the public job board'
              : 'Make your profile visible to potential employers'}
          </p>
        </div>

        {/* Toggle Switch */}
        <button
          onClick={handleToggleClick}
          disabled={isLoading}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
            isPublished ? 'bg-green-500' : 'bg-gray-600'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
              isPublished ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Published URL */}
      {isPublished && profileUrl && (
        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-400 mb-1">Your Public Profile URL:</p>
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 text-sm font-medium break-all"
              >
                {profileUrl}
              </a>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(profileUrl);
              }}
              className="ml-4 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-green-300 text-sm font-medium transition-colors"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Publish Settings Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Publish Your Profile</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Privacy Settings */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Privacy Settings</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showScores}
                      onChange={(e) => setShowScores(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    />
                    <span className="text-white">Show assessment scores publicly</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showEmail}
                      onChange={(e) => setShowEmail(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    />
                    <span className="text-white">Show my email address for contact</span>
                  </label>
                </div>
              </div>

              {/* Video URL (Optional) */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-2">
                  Video Introduction URL (Optional)
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Add a link to a video introduction (YouTube, Vimeo, etc.)
                </p>
              </div>

              {/* Preview */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Profile Preview</h3>
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-2xl font-bold text-white mb-1">{profileData.name}</h4>
                      {profileData.archetype && (
                        <p className="text-purple-400 font-medium">{profileData.archetype}</p>
                      )}
                    </div>
                    {showScores && profileData.overall_score !== undefined && (
                      <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg px-4 py-2">
                        <div className="text-2xl font-bold text-white">{profileData.overall_score}</div>
                        <div className="text-xs text-gray-400">Score</div>
                      </div>
                    )}
                  </div>

                  {profileData.career_level && (
                    <div className="mb-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {profileData.career_level.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  )}

                  {profileData.personality_type && (
                    <div className="mb-3">
                      <span className="text-sm text-gray-400">MBTI: </span>
                      <span className="text-white font-semibold">{profileData.personality_type}</span>
                    </div>
                  )}

                  {profileData.badges && profileData.badges.length > 0 && (
                    <div className="mb-3">
                      <div className="text-sm text-gray-400 mb-2">Badges:</div>
                      <div className="flex flex-wrap gap-2">
                        {profileData.badges.slice(0, 5).map((badge, idx) => (
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

                  {profileData.public_summary && (
                    <p className="text-sm text-gray-300 mt-4">
                      {profileData.public_summary.substring(0, 200)}...
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handlePublish}
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Publishing...' : 'Publish Profile'}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  disabled={isLoading}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
