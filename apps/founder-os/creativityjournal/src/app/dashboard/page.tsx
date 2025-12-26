'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DashboardStats {
  totalEntries: number;
  recentEntries: number;
  averageSatisfaction: number;
  totalWords: number;
}

interface Draft {
  id: number;
  title: string;
  content: string;
  sat: number;
  wordcount: number;
  charcount: number;
  createdDate: string;
  updatedDate: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalEntries: 0,
    recentEntries: 0,
    averageSatisfaction: 0,
    totalWords: 0
  });
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Draft[]>([]);

  useEffect(() => {
    fetchDashboardStats();
    checkDrafts();
    
    // Add event listener for draft updates from other components
    const handleDraftsUpdated = () => {
      checkDrafts();
    };
    
    window.addEventListener('draftsUpdated', handleDraftsUpdated);
    
    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener('draftsUpdated', handleDraftsUpdated);
    };
  }, []);

  const checkDrafts = async () => {
    try {
      const response = await fetch('/api/entries/drafts');
      if (response.ok) {
        const data = await response.json();
        setDrafts(data.drafts || []);
      } else {
        console.error('Failed to fetch drafts');
        setDrafts([]);
      }
    } catch (error) {
      console.error('Error checking drafts:', error);
      setDrafts([]);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/entries');
      if (response.ok) {
        const data = await response.json();
        const entries = data.entries || [];
        
        const totalEntries = entries.length;
        const recentEntries = entries.filter((entry: any) => {
          const entryDate = new Date(entry.updatedDate);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return entryDate > weekAgo;
        }).length;
        
        const averageSatisfaction = entries.length > 0 
          ? Math.round(entries.reduce((sum: number, entry: any) => sum + (entry.sat || 5), 0) / entries.length)
          : 5;
        
        const totalWords = entries.reduce((sum: number, entry: any) => sum + (entry.wordcount || 0), 0);
        
        setStats({
          totalEntries,
          recentEntries,
          averageSatisfaction,
          totalWords
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDraftButtonClick = () => {
    if (drafts.length === 0) {
      router.push('/entry/new');
    } else if (drafts.length === 1) {
      router.push(`/entry/${drafts[0].id}`);
    } else {
      // For multiple drafts, we could show a modal here too, but for now just go to the most recent one
      router.push(`/entry/${drafts[0].id}`);
    }
  };

  const handleNewEntry = () => {
    router.push('/entry/new');
  };

  if (loading) {
    return (
      <div className="h-full bg-main-bg">
        <div className="h-full p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-main-bg">
      <div className="h-full p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
          
          {/* Quick Actions */}
          <div className="mb-8">
            {drafts.length > 0 ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={handleDraftButtonClick}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <span className="text-xl mr-2">📝</span>
                  {drafts.length === 1 ? 'Continue Draft' : `Continue Draft (${drafts.length})`}
                </button>
                <button
                  onClick={handleNewEntry}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <span className="text-xl mr-2">✏️</span>
                  New Entry
                </button>
              </div>
            ) : (
              <button
                onClick={handleNewEntry}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <span className="text-xl mr-2">✏️</span>
                Compose New Entry
              </button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Total Entries</h3>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalEntries}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Entries</h3>
                  <p className="text-3xl font-bold text-gray-900">{stats.recentEntries}</p>
                  <p className="text-sm text-gray-500">Last 7 days</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 15s1.5 2 4 2 4-2 4-2" />
                    <path d="M9 9h.01M15 9h.01" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Avg. Satisfaction</h3>
                  <p className="text-3xl font-bold text-gray-900">{stats.averageSatisfaction}/10</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Total Words</h3>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalWords.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Draft Status */}
          {drafts.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">📝 Your Drafts</h2>
              <p className="text-blue-800 mb-4">
                You have {drafts.length} draft entr{drafts.length === 1 ? 'y' : 'ies'} waiting to be completed.
              </p>
              <div className="space-y-3">
                {drafts.slice(0, 3).map((draft) => (
                  <div key={draft.id} className="flex items-center justify-between bg-white rounded-lg p-4">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {draft.title || 'Untitled Entry'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {draft.wordcount} words • Updated {new Date(draft.updatedDate).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => router.push(`/entry/${draft.id}`)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Continue
                    </button>
                  </div>
                ))}
                {drafts.length > 3 && (
                  <p className="text-sm text-blue-600 text-center">
                    +{drafts.length - 3} more drafts
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-gray-900">Ready to capture your thoughts?</p>
                  <p className="text-gray-600 text-sm">Start writing your next journal entry</p>
                </div>
              </div>
              
              <div className="text-center py-8">
                <p className="text-gray-500">Your recent journal entries will appear here</p>
                <Link href="/entries" className="text-blue-600 hover:text-blue-800 underline">
                  View all entries
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 