'use client';

/**
 * Browse Profiles Page - Public Job Board
 *
 * Features:
 * - Grid layout (3-4 columns desktop, 1-2 mobile)
 * - Search by name, archetype, summary
 * - Filter by career level, archetype, badges
 * - Sort by newest or highest score
 * - Pagination (20 per page)
 * - "Publish Your Profile" CTA
 */

import { useState, useEffect } from 'react';
import { Suspense } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
export const dynamic = 'error';
import { ProfileCard } from '@/components/profiles/ProfileCard';
import type { PublicProfile } from '@/lib/assessment/types';

interface BrowseProfilesResponse {
  profiles: PublicProfile[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

function BrowseProfilesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search and filter state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [careerLevel, setCareerLevel] = useState(searchParams.get('career_level') || '');
  const [archetype, setArchetype] = useState(searchParams.get('archetype') || '');
  const [badge, setBadge] = useState(searchParams.get('badge') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));

  // Build API URL with query params
  const buildApiUrl = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (careerLevel) params.set('career_level', careerLevel);
    if (archetype) params.set('archetype', archetype);
    if (badge) params.set('badge', badge);
    params.set('sort', sort);
    params.set('page', page.toString());
    params.set('limit', '20');
    return `/api/profiles?${params.toString()}`;
  };

  // Fetch profiles
  const { data, error, isLoading } = useSWR<BrowseProfilesResponse>(
    buildApiUrl(),
    fetcher,
    { revalidateOnFocus: false }
  );

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (careerLevel) params.set('career_level', careerLevel);
    if (archetype) params.set('archetype', archetype);
    if (badge) params.set('badge', badge);
    params.set('sort', sort);
    params.set('page', page.toString());
    router.push(`/profiles?${params.toString()}`, { scroll: false });
  }, [search, careerLevel, archetype, badge, sort, page, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
  };

  const handleFilterChange = (setter: (value: string) => void) => (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setter(e.target.value);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Talent Profiles
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            Discover top talent with verified assessment results
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-700/30 rounded-xl p-6 mb-8">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, archetype, or summary..."
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 pl-12 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
              />
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </form>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Career Level */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Career Level
              </label>
              <select
                value={careerLevel}
                onChange={handleFilterChange(setCareerLevel)}
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="">All Levels</option>
                <option value="entry">Entry</option>
                <option value="mid">Mid</option>
                <option value="senior_manager">Senior/Manager</option>
                <option value="director">Director</option>
                <option value="executive">Executive</option>
                <option value="c_level">C-Level</option>
              </select>
            </div>

            {/* Archetype */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Archetype
              </label>
              <input
                type="text"
                value={archetype}
                onChange={(e) => {
                  setArchetype(e.target.value);
                  setPage(1);
                }}
                placeholder="e.g., Technical Empath"
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* Badge Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Badge
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => {
                  setBadge(e.target.value);
                  setPage(1);
                }}
                placeholder="e.g., ai-prodigy"
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sort By
              </label>
              <select
                value={sort}
                onChange={handleFilterChange(setSort)}
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="newest">Newest First</option>
                <option value="highest_score">Highest Score</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading profiles...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-8 text-center">
            <p className="text-red-400">Failed to load profiles. Please try again.</p>
          </div>
        ) : data && data.profiles.length > 0 ? (
          <>
            {/* Results Count */}
            <div className="mb-6">
              <p className="text-gray-400">
                Showing <span className="text-white font-semibold">{data.profiles.length}</span> of{' '}
                <span className="text-white font-semibold">{data.total}</span> profiles
              </p>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {data.profiles.map((profile) => (
                <ProfileCard key={profile.user_id} profile={profile} />
              ))}
            </div>

            {/* Pagination */}
            {data.total_pages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-300">
                  Page {page} of {data.total_pages}
                </span>
                <button
                  onClick={() => setPage(Math.min(data.total_pages, page + 1))}
                  disabled={page === data.total_pages}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-gray-900/30 border border-gray-700/30 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold text-white mb-2">No profiles found</h3>
            <p className="text-gray-400 mb-6">
              Try adjusting your filters or search query
            </p>
            <button
              onClick={() => {
                setSearch('');
                setCareerLevel('');
                setArchetype('');
                setBadge('');
                setPage(1);
              }}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-lg transition-all duration-200"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* CTA for Publishing */}
        <div className="mt-16 bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            Want to showcase your profile?
          </h3>
          <p className="text-gray-300 mb-6">
            Take our comprehensive assessment and publish your results to stand out to employers.
          </p>
          <button
            onClick={() => router.push('/assessment/start')}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-purple-500/20"
          >
            Start Assessment
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BrowseProfilesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold text-white">Loading profiles...</h2>
        </div>
      </div>
    }>
      <BrowseProfilesContent />
    </Suspense>
  );
}
