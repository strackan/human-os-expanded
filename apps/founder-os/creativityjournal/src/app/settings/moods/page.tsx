'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/Toast';

interface MoodPreference {
  id: number;
  moodId: number;
  isPinned: boolean;
  isHidden: boolean;
  pinOrder: number | null;
  usageCount: number;
  lastUsedAt: string | null;
  firstUsedAt: string | null;
  mood: {
    id: number;
    name: string;
    moodProps: Array<{
      core: boolean;
      intensity: number;
      valence: number;
      arousal: number;
    }>;
    moodCategories: Array<{
      category: {
        id: number;
        name: string;
        slug: string;
        colorHex: string;
      };
    }>;
  };
}

interface UserStats {
  totalMoods: number;
  pinnedMoods: number;
  hiddenMoods: number;
  usedMoods: number;
  totalUsage: number;
  topUsedMoods: Array<{
    id: number;
    name: string;
    usageCount: number;
    lastUsedAt: string | null;
  }>;
}

export default function MoodPreferencesPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  
  const [preferences, setPreferences] = useState<MoodPreference[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'pinned' | 'hidden' | 'used' | 'unused'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'recent' | 'pin_order'>('name');
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<number[]>([]);

  // Fetch user preferences and stats
  useEffect(() => {
    if (!session) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const [prefsResponse, statsResponse] = await Promise.all([
          fetch('/api/moods/preferences?includeUnsetPreferences=true&includeUsageStats=true'),
          fetch('/api/moods/usage?period=month&groupBy=mood&limit=10')
        ]);
        
        const prefsData = await prefsResponse.json();
        const statsData = await statsResponse.json();
        
        setPreferences(prefsData.preferences || []);
        setUserStats(prefsData.summary || null);
      } catch (error) {
        console.error('Error fetching data:', error);
        showToast('Error loading preferences', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [session]);

  // Filter and sort preferences
  const filteredPreferences = preferences
    .filter(pref => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!pref.mood.name.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      // Status filter
      switch (filterBy) {
        case 'pinned':
          return pref.isPinned;
        case 'hidden':
          return pref.isHidden;
        case 'used':
          return pref.usageCount > 0;
        case 'unused':
          return pref.usageCount === 0;
        default:
          return true;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'usage':
          return b.usageCount - a.usageCount;
        case 'recent':
          if (a.lastUsedAt && b.lastUsedAt) {
            return new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime();
          }
          if (a.lastUsedAt) return -1;
          if (b.lastUsedAt) return 1;
          return 0;
        case 'pin_order':
          if (a.isPinned && b.isPinned) {
            return (a.pinOrder || 0) - (b.pinOrder || 0);
          }
          if (a.isPinned) return -1;
          if (b.isPinned) return 1;
          return a.mood.name.localeCompare(b.mood.name);
        default:
          return a.mood.name.localeCompare(b.mood.name);
      }
    });

  // Handle individual preference updates
  const handleTogglePin = async (moodId: number, currentlyPinned: boolean) => {
    try {
      const response = await fetch('/api/moods/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moodId,
          isPinned: !currentlyPinned
        })
      });
      
      if (response.ok) {
        setPreferences(prev => 
          prev.map(pref => 
            pref.moodId === moodId 
              ? { ...pref, isPinned: !currentlyPinned, pinOrder: !currentlyPinned ? Date.now() : null }
              : pref
          )
        );
        showToast(`Emotion ${!currentlyPinned ? 'pinned' : 'unpinned'}`, 'success');
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
      showToast('Error updating preference', 'error');
    }
  };

  const handleToggleHide = async (moodId: number, currentlyHidden: boolean) => {
    try {
      const response = await fetch('/api/moods/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moodId,
          isHidden: !currentlyHidden
        })
      });
      
      if (response.ok) {
        setPreferences(prev => 
          prev.map(pref => 
            pref.moodId === moodId 
              ? { ...pref, isHidden: !currentlyHidden, isPinned: false, pinOrder: null }
              : pref
          )
        );
        showToast(`Emotion ${!currentlyHidden ? 'hidden' : 'unhidden'}`, 'success');
      }
    } catch (error) {
      console.error('Error toggling hide:', error);
      showToast('Error updating preference', 'error');
    }
  };

  // Handle bulk operations
  const handleBulkPin = async () => {
    if (bulkSelected.length === 0) return;
    
    try {
      const response = await fetch('/api/moods/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: bulkSelected })
      });
      
      if (response.ok) {
        setPreferences(prev => 
          prev.map(pref => 
            bulkSelected.includes(pref.moodId)
              ? { ...pref, isPinned: true, pinOrder: Date.now() }
              : pref
          )
        );
        showToast(`${bulkSelected.length} emotions pinned`, 'success');
        setBulkSelected([]);
        setBulkSelectMode(false);
      }
    } catch (error) {
      console.error('Error bulk pinning:', error);
      showToast('Error updating preferences', 'error');
    }
  };

  const handleBulkHide = async () => {
    if (bulkSelected.length === 0) return;
    
    try {
      const response = await fetch('/api/moods/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hide: bulkSelected })
      });
      
      if (response.ok) {
        setPreferences(prev => 
          prev.map(pref => 
            bulkSelected.includes(pref.moodId)
              ? { ...pref, isHidden: true, isPinned: false, pinOrder: null }
              : pref
          )
        );
        showToast(`${bulkSelected.length} emotions hidden`, 'success');
        setBulkSelected([]);
        setBulkSelectMode(false);
      }
    } catch (error) {
      console.error('Error bulk hiding:', error);
      showToast('Error updating preferences', 'error');
    }
  };

  const handleBulkUnhide = async () => {
    if (bulkSelected.length === 0) return;
    
    try {
      const response = await fetch('/api/moods/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unhide: bulkSelected })
      });
      
      if (response.ok) {
        setPreferences(prev => 
          prev.map(pref => 
            bulkSelected.includes(pref.moodId)
              ? { ...pref, isHidden: false }
              : pref
          )
        );
        showToast(`${bulkSelected.length} emotions unhidden`, 'success');
        setBulkSelected([]);
        setBulkSelectMode(false);
      }
    } catch (error) {
      console.error('Error bulk unhiding:', error);
      showToast('Error updating preferences', 'error');
    }
  };

  // Handle bulk selection toggle
  const handleBulkToggle = (moodId: number) => {
    setBulkSelected(prev => 
      prev.includes(moodId)
        ? prev.filter(id => id !== moodId)
        : [...prev, moodId]
    );
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-main-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Please Sign In</h1>
          <p className="text-gray-600">You need to be signed in to manage your mood preferences.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-main-bg">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mood Preferences</h1>
          <p className="text-gray-600">Customize your emotion selector by pinning favorites and hiding unused emotions</p>
        </div>

        {/* Stats Summary */}
        {userStats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-blue-600">{userStats.totalMoods}</div>
              <div className="text-sm text-gray-600">Total Emotions</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-green-600">{userStats.pinnedMoods}</div>
              <div className="text-sm text-gray-600">Pinned</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-red-600">{userStats.hiddenMoods}</div>
              <div className="text-sm text-gray-600">Hidden</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-purple-600">{userStats.usedMoods}</div>
              <div className="text-sm text-gray-600">Ever Used</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-indigo-600">{userStats.totalUsage}</div>
              <div className="text-sm text-gray-600">Total Uses</div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search emotions..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Emotions</option>
                <option value="pinned">Pinned Only</option>
                <option value="hidden">Hidden Only</option>
                <option value="used">Used Only</option>
                <option value="unused">Unused Only</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Name</option>
                <option value="usage">Usage Count</option>
                <option value="recent">Recently Used</option>
                <option value="pin_order">Pin Order</option>
              </select>
            </div>

            {/* Bulk controls */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setBulkSelectMode(!bulkSelectMode);
                  setBulkSelected([]);
                }}
                className={`
                  px-4 py-2 rounded-md border transition-colors
                  ${bulkSelectMode 
                    ? 'bg-purple-500 text-white border-purple-500' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                {bulkSelectMode ? 'Exit Bulk' : 'Bulk Select'}
              </button>
            </div>
          </div>

          {/* Bulk action buttons */}
          {bulkSelectMode && bulkSelected.length > 0 && (
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={handleBulkPin}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Pin ({bulkSelected.length})
              </button>
              <button
                onClick={handleBulkHide}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Hide ({bulkSelected.length})
              </button>
              <button
                onClick={handleBulkUnhide}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Unhide ({bulkSelected.length})
              </button>
            </div>
          )}
        </div>

        {/* Emotions List */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading preferences...</div>
          ) : filteredPreferences.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchQuery ? 'No emotions match your search' : 'No emotions found'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredPreferences.map((pref) => (
                <div
                  key={pref.moodId}
                  className={`
                    p-4 hover:bg-gray-50 transition-colors
                    ${pref.isHidden ? 'opacity-60' : ''}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      {/* Bulk select checkbox */}
                      {bulkSelectMode && (
                        <input
                          type="checkbox"
                          checked={bulkSelected.includes(pref.moodId)}
                          onChange={() => handleBulkToggle(pref.moodId)}
                          className="mr-3 text-blue-600 focus:ring-blue-500"
                        />
                      )}

                      {/* Emotion info */}
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className={`
                            text-lg font-medium
                            ${pref.isPinned ? 'text-green-800' : 'text-gray-900'}
                          `}>
                            {pref.mood.name}
                          </h3>
                          
                          {/* Indicators */}
                          <div className="flex items-center ml-3 space-x-2">
                            {pref.isPinned && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                Pinned
                              </span>
                            )}
                            {pref.isHidden && (
                              <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                Hidden
                              </span>
                            )}
                            {pref.mood.moodProps[0]?.core && (
                              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                Core
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Categories */}
                        {pref.mood.moodCategories.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {pref.mood.moodCategories.slice(0, 3).map((mc) => (
                              <span
                                key={mc.category.id}
                                className="text-xs px-2 py-1 rounded-full text-white"
                                style={{ backgroundColor: mc.category.colorHex }}
                              >
                                {mc.category.name}
                              </span>
                            ))}
                            {pref.mood.moodCategories.length > 3 && (
                              <span className="text-xs text-gray-500 px-2 py-1">
                                +{pref.mood.moodCategories.length - 3} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Usage stats */}
                        <div className="flex items-center mt-2 text-sm text-gray-600">
                          <span>Used {pref.usageCount} times</span>
                          {pref.lastUsedAt && (
                            <span className="ml-4">
                              Last used: {new Date(pref.lastUsedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    {!bulkSelectMode && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleTogglePin(pref.moodId, pref.isPinned)}
                          className={`
                            p-2 rounded hover:bg-gray-200 transition-colors
                            ${pref.isPinned ? 'text-green-600' : 'text-gray-400'}
                          `}
                          title={pref.isPinned ? 'Unpin' : 'Pin'}
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={() => handleToggleHide(pref.moodId, pref.isHidden)}
                          className={`
                            p-2 rounded hover:bg-gray-200 transition-colors
                            ${pref.isHidden ? 'text-red-600' : 'text-gray-400'}
                          `}
                          title={pref.isHidden ? 'Unhide' : 'Hide'}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={pref.isHidden ? "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" : "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L2.632 2.632m7.246 7.246l4.242 4.242m-4.242-4.242L16.5 16.5m-4.242-4.242L2.632 2.632m7.246 7.246l4.242 4.242"} />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most Used Emotions */}
        {userStats?.topUsedMoods && userStats.topUsedMoods.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Most Used Emotions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {userStats.topUsedMoods.map((mood, index) => (
                <div key={mood.id} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-medium text-gray-900">{mood.name}</div>
                  <div className="text-sm text-gray-600">{mood.usageCount} uses</div>
                  <div className="text-xs text-gray-500">#{index + 1}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 