'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from './Toast';
import AddCustomWordModal from './AddCustomWordModal';

interface Emotion {
  id: number | string;
  name: string;
  displayName: string;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
    color: string;
    type: string;
    isPrimary: boolean;
    relevanceScore: number;
  }>;
  isCore: boolean;
  isPinned: boolean;
  isHidden: boolean;
  pinOrder: number | null;
  usageCount: number;
  lastUsedAt: string | null;
  firstUsedAt: string | null;
  intensity: number;
  arousal: number;
  valence: number;
  dominance: number;
  plutchikProfile: {
    joy: number;
    trust: number;
    fear: number;
    surprise: number;
    sadness: number;
    anticipation: number;
    anger: number;
    disgust: number;
  } | null;
  analysis?: {
    dominantEmotion: string;
    complexity: number;
    color: string;
    intensityLevel: string;
    valenceLevel: string;
    arousalLevel: string;
  };
  // Additional properties for UserMoods
  type?: 'global' | 'user';
  pillStatus?: 'red' | 'yellow' | 'green' | 'grey';
  canPromote?: boolean;
  userMoodId?: number;
  status?: string;
  description?: string;
  createdAt?: string;
}

interface EnhancedEmotionSelectorProps {
  selectedEmotions: (number | string)[];
  onEmotionSelect: (emotionIds: (number | string)[]) => void;
  onEmotionToggle?: (emotionId: number | string, isSelected: boolean) => void;
  placeholder?: string;
  maxSelections?: number;
  showAnalysis?: boolean;
  showCategories?: boolean;
  compactMode?: boolean;
  enablePreferences?: boolean;
  usageContext?: string;
  sessionId?: string;
  entryId?: number;
  className?: string;
}

export function EnhancedEmotionSelector({
  selectedEmotions,
  onEmotionSelect,
  onEmotionToggle,
  placeholder = "How are you feeling?",
  maxSelections,
  showAnalysis = false,
  showCategories = true,
  compactMode = false,
  enablePreferences = true,
  usageContext = 'emotion_selector',
  sessionId,
  entryId,
  className = ''
}: EnhancedEmotionSelectorProps) {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [filteredEmotions, setFilteredEmotions] = useState<Emotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyCore, setShowOnlyCore] = useState(false);
  const [sortBy, setSortBy] = useState<'preference' | 'name' | 'usage' | 'recent'>('preference');
  const [showHidden, setShowHidden] = useState(false);
  const [activeTab, setActiveTab] = useState<'custom' | 'system'>('custom');
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<number[]>([]);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const retryCountRef = useRef(0);
  const lastRetryTimeRef = useRef<number | null>(null);

  // Available categories for filtering
  const categories = [
    { slug: 'all', name: 'All Emotions', color: '#6B7280' },
    { slug: 'personal-growth', name: 'Personal Growth', color: '#8B5CF6' },
    { slug: 'relationships', name: 'Relationships', color: '#EC4899' },
    { slug: 'work-career', name: 'Work & Career', color: '#0EA5E9' },
    { slug: 'health-wellness', name: 'Health & Wellness', color: '#059669' },
    { slug: 'creative', name: 'Creative', color: '#EC4899' },
    { slug: 'social', name: 'Social', color: '#06B6D4' },
    { slug: 'spiritual', name: 'Spiritual', color: '#7C3AED' },
  ];

  // Enhanced emotion loading with retry mechanism
  const fetchEmotions = useCallback(async (isRetry = false) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY_BASE = 1000; // 1 second base delay
    
    // Don't retry if we've exceeded max retries
    if (isRetry && retryCountRef.current >= MAX_RETRIES) {
      console.log('[EnhancedEmotionSelector] Max retries reached for emotion loading');
      return;
    }
    
    // Don't retry too frequently
    if (isRetry && lastRetryTimeRef.current) {
      const timeSinceLastRetry = Date.now() - lastRetryTimeRef.current;
      const minRetryDelay = RETRY_DELAY_BASE * Math.pow(2, retryCountRef.current);
      if (timeSinceLastRetry < minRetryDelay) {
        console.log('[EnhancedEmotionSelector] Too soon to retry emotion loading');
        return;
      }
    }
    
    setLoading(true);
    setLoadingError(null);
    
    if (isRetry) {
      retryCountRef.current += 1;
      lastRetryTimeRef.current = Date.now();
    } else {
      retryCountRef.current = 0;
      lastRetryTimeRef.current = null;
    }
    
    try {
      const params = new URLSearchParams({
        includePreferences: enablePreferences ? 'true' : 'false',
        includeAnalysis: showAnalysis ? 'true' : 'false',
        showHidden: showHidden ? 'true' : 'false',
        sortBy: sortBy,
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(showOnlyCore && { coreOnly: 'true' })
      });

      const response = await fetch(`/api/moods?${params}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch emotions: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.moods && Array.isArray(data.moods)) {
        setEmotions(data.moods);
        setLoadingError(null);
        retryCountRef.current = 0;
        lastRetryTimeRef.current = null;
        console.log('[EnhancedEmotionSelector] Successfully loaded emotions:', data.moods.length);
      } else {
        throw new Error('Invalid emotions data structure');
      }
    } catch (error) {
      console.error('[EnhancedEmotionSelector] Error fetching emotions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setLoadingError(errorMessage);
      
      if (!isRetry) {
        showToast('Error loading emotions', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, showOnlyCore, sortBy, showHidden, enablePreferences, showAnalysis]);

  // Manual retry function
  const retryEmotionLoading = useCallback(() => {
    console.log('[EnhancedEmotionSelector] Manual retry requested for emotion loading');
    fetchEmotions(true);
  }, [fetchEmotions]);

  // State for suggestion modal
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [pendingMoodName, setPendingMoodName] = useState('');

  // Handle opening suggestion modal for new mood
  const handleCreateMood = useCallback((moodName: string) => {
    setPendingMoodName(moodName);
    setShowSuggestModal(true);
    setSearchQuery(''); // Clear search when opening modal
  }, []);

  // Handle modal submission
  const handleModalSubmit = useCallback(async (result: any) => {
    // The modal creates the mood and returns the result
    if (result.mood) {
      // Add the new mood directly to local state first for immediate visibility
      const newMood: Emotion = {
        id: result.mood.id,
        name: result.mood.moodName,
        displayName: result.mood.moodName,
        categories: [],
        isCore: false,
        isPinned: false,
        isHidden: false,
        pinOrder: null,
        usageCount: 0,
        lastUsedAt: null,
        firstUsedAt: result.mood.createdAt,
        intensity: 5,
        arousal: 5,
        valence: 5,
        dominance: 5,
        plutchikProfile: null,
        type: 'user',
        pillStatus: 'red',
        canPromote: false,
        userMoodId: result.mood.id,
        status: result.mood.status,
        description: result.mood.description,
        createdAt: result.mood.createdAt
      };
      
      // Update local emotions state immediately
      setEmotions(prevEmotions => [newMood, ...prevEmotions]);
      
      // Add to selected emotions using the integer ID directly
      const newSelectedEmotions = [...selectedEmotions, result.mood.id];
      onEmotionSelect(newSelectedEmotions);
      
      // Show success message
      if (typeof window !== 'undefined') {
        console.log('Mood created successfully:', result.message);
      }
    }
    
    setShowSuggestModal(false);
    setPendingMoodName('');
    
    // Refresh emotions list in the background to ensure sync
    setTimeout(() => {
      fetchEmotions(false);
    }, 100);
  }, [selectedEmotions, onEmotionSelect, fetchEmotions]);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setShowSuggestModal(false);
    setPendingMoodName('');
  }, []);

  // Initial emotion loading
  useEffect(() => {
    fetchEmotions(false);
  }, [fetchEmotions]);

  // Filter emotions based on search query, hidden status, and active tab
  useEffect(() => {
    let filtered = emotions;
    
    // Apply tab filter first
    if (activeTab === 'custom') {
      filtered = emotions.filter(emotion => emotion.type === 'user');
    } else {
      filtered = emotions.filter(emotion => emotion.type === 'global');
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(emotion => 
        emotion.name.toLowerCase().includes(query) ||
        emotion.displayName.toLowerCase().includes(query) ||
        emotion.categories.some(cat => cat.name.toLowerCase().includes(query))
      );
    }
    
    // Filter out hidden emotions unless showHidden is true
    if (!showHidden) {
      filtered = filtered.filter(emotion => !emotion.isHidden);
    }
    
    setFilteredEmotions(filtered);
  }, [searchQuery, emotions, showHidden, activeTab]);

  // Handle emotion selection
  const handleEmotionToggle = async (emotionId: number | string, emotion: Emotion) => {
    const isCurrentlySelected = selectedEmotions.includes(emotionId);
    
    if (!isCurrentlySelected) {
      // Check max selections limit
      if (maxSelections && selectedEmotions.length >= maxSelections) {
        showToast(`You can only select up to ${maxSelections} emotions`, 'warning');
        return;
      }
      
      // Track usage if selecting (only for numeric IDs - global moods)
      if (enablePreferences && session && typeof emotionId === 'number') {
        try {
          await fetch('/api/moods/usage', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              moodId: emotionId,
              usageContext,
              sessionId,
              entryId
            })
          });
        } catch (error) {
          console.error('Error tracking mood usage:', error);
        }
      }
    }
    
    // Update selection
    let newSelection: (number | string)[];
    if (isCurrentlySelected) {
      newSelection = selectedEmotions.filter(id => id !== emotionId);
    } else {
      newSelection = [...selectedEmotions, emotionId];
    }
    
    onEmotionSelect(newSelection);
    onEmotionToggle?.(emotionId, !isCurrentlySelected);
  };

  // Handle pin/unpin
  const handlePinToggle = async (emotionId: number | string, currentlyPinned: boolean) => {
    if (!session) return;
    
    const emotion = emotions.find(e => e.id === emotionId);
    if (!emotion) return;
    
    try {
      let response;
      
      if (emotion.type === 'user' && emotion.userMoodId) {
        // Handle user mood pinning
        response = await fetch('/api/user-moods/preferences', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userMoodId: emotion.userMoodId,
            isPinned: !currentlyPinned
          })
        });
      } else if (typeof emotionId === 'number') {
        // Handle global mood pinning
        response = await fetch('/api/moods/preferences', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            moodId: emotionId,
            isPinned: !currentlyPinned
          })
        });
      } else {
        showToast('Cannot pin this emotion', 'warning');
        return;
      }
      
      if (response.ok) {
        // Update local state
        setEmotions(prevEmotions => 
          prevEmotions.map(emotion => 
            emotion.id === emotionId 
              ? { ...emotion, isPinned: !currentlyPinned, pinOrder: !currentlyPinned ? Date.now() : null }
              : emotion
          )
        );
        showToast(`Emotion ${!currentlyPinned ? 'pinned' : 'unpinned'}`, 'success');
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
      showToast('Error updating preference', 'error');
    }
  };

  // Handle hide/unhide
  const handleHideToggle = async (emotionId: number | string, currentlyHidden: boolean) => {
    if (!session) return;
    
    const emotion = emotions.find(e => e.id === emotionId);
    if (!emotion) return;
    
    try {
      let response;
      
      if (emotion.type === 'user' && emotion.userMoodId) {
        // Handle user mood hiding
        response = await fetch('/api/user-moods/preferences', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userMoodId: emotion.userMoodId,
            isHidden: !currentlyHidden
          })
        });
      } else if (typeof emotionId === 'number') {
        // Handle global mood hiding
        response = await fetch('/api/moods/preferences', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            moodId: emotionId,
            isHidden: !currentlyHidden
          })
        });
      } else {
        showToast('Cannot hide this emotion', 'warning');
        return;
      }
      
      if (response.ok) {
        // Update local state
        setEmotions(prevEmotions => 
          prevEmotions.map(emotion => 
            emotion.id === emotionId 
              ? { ...emotion, isHidden: !currentlyHidden, isPinned: false, pinOrder: null }
              : emotion
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
    if (!session || bulkSelected.length === 0) return;
    
    try {
      const response = await fetch('/api/moods/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pin: bulkSelected
        })
      });
      
      if (response.ok) {
        // Update local state
        setEmotions(prevEmotions => 
          prevEmotions.map(emotion => 
            bulkSelected.includes(emotion.id)
              ? { ...emotion, isPinned: true, pinOrder: Date.now() }
              : emotion
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
    if (!session || bulkSelected.length === 0) return;
    
    try {
      const response = await fetch('/api/moods/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hide: bulkSelected
        })
      });
      
      if (response.ok) {
        // Update local state
        setEmotions(prevEmotions => 
          prevEmotions.map(emotion => 
            bulkSelected.includes(emotion.id)
              ? { ...emotion, isHidden: true, isPinned: false, pinOrder: null }
              : emotion
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

  // Handle bulk selection toggle
  const handleBulkToggle = (emotionId: number | string) => {
    // Only allow bulk operations for global moods (numeric IDs)
    if (typeof emotionId !== 'number') {
      return;
    }
    
    setBulkSelected(prev => 
      prev.includes(emotionId)
        ? prev.filter(id => id !== emotionId)
        : [...prev, emotionId]
    );
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setBulkSelectMode(false);
        setBulkSelected([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Get selected emotion names for display
  const getSelectedEmotionNames = () => {
    const selectedEmotionObjects = emotions.filter(emotion => 
      selectedEmotions.includes(emotion.id)
    );
    return selectedEmotionObjects.map(emotion => emotion.displayName);
  };

  const selectedNames = getSelectedEmotionNames();

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Main selector button */}
      <button
        type="button"
        className={`
          w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg 
          hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
          focus:border-blue-500 transition-colors
          ${compactMode ? 'py-2 text-sm' : ''}
        `}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedNames.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {selectedNames.slice(0, 3).map((name, index) => (
              <span
                key={index}
                className={`
                  inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                  bg-blue-100 text-blue-800
                  ${compactMode ? 'px-1.5 py-0.5' : ''}
                `}
              >
                {name}
              </span>
            ))}
            {selectedNames.length > 3 && (
              <span className="text-sm text-gray-500">
                +{selectedNames.length - 3} more
              </span>
            )}
          </div>
        ) : (
          <span className="text-gray-500">{placeholder}</span>
        )}
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <svg
            className={`w-5 h-5 text-gray-400 transform transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
          {/* Tabs and search */}
          <div className="border-b border-gray-200 bg-gray-50">
            {/* Tab navigation */}
            <div className="flex border-b border-gray-200">
              <button
                type="button"
                onClick={() => setActiveTab('custom')}
                className={`
                  flex-1 px-4 py-3 text-sm font-medium transition-colors
                  ${activeTab === 'custom'
                    ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Custom Moods
                </div>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('system')}
                className={`
                  flex-1 px-4 py-3 text-sm font-medium transition-colors
                  ${activeTab === 'system'
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  System Moods
                </div>
              </button>
            </div>

            {/* Search and controls */}
            <div className="p-3">
              {/* Search input */}
              <div className="relative mb-3">
                <label htmlFor="emotion-search" className="sr-only">Search emotions</label>
                <input
                  id="emotion-search"
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      e.preventDefault();
                      // If no emotions match, create a new one
                      if (filteredEmotions.length === 0) {
                        handleCreateMood(searchQuery.trim());
                      }
                    }
                  }}
                  placeholder={`Search ${activeTab === 'custom' ? 'custom' : 'system'} moods...`}
                  className="w-full px-3 py-2 pl-10 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Tab-specific controls */}
              <div className="flex flex-wrap gap-2">
                {activeTab === 'system' && (
                  <>
                    {/* Category filter - only for system moods */}
                    {showCategories && (
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        title="Filter by category"
                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {categories.map(cat => (
                          <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                        ))}
                      </select>
                    )}

                    {/* Core only toggle - only for system moods */}
                    <button
                      type="button"
                      onClick={() => setShowOnlyCore(!showOnlyCore)}
                      className={`
                        px-2 py-1 text-xs rounded border transition-colors
                        ${showOnlyCore 
                          ? 'bg-blue-500 text-white border-blue-500' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      Core Only
                    </button>

                    {/* Bulk select - only for system moods */}
                    {enablePreferences && session && (
                      <button
                        type="button"
                        onClick={() => {
                          setBulkSelectMode(!bulkSelectMode);
                          setBulkSelected([]);
                        }}
                        className={`
                          px-2 py-1 text-xs rounded border transition-colors
                          ${bulkSelectMode 
                            ? 'bg-purple-500 text-white border-purple-500' 
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        {bulkSelectMode ? 'Exit Bulk' : 'Bulk Select'}
                      </button>
                    )}
                  </>
                )}

                {/* Show hidden toggle - available for both tabs */}
                <button
                  type="button"
                  onClick={() => setShowHidden(!showHidden)}
                  className={`
                    px-2 py-1 text-xs rounded border transition-colors
                    ${showHidden 
                      ? 'bg-gray-500 text-white border-gray-500' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  {showHidden ? 'Hide Hidden' : 'Show Hidden'}
                </button>
              </div>

              {/* Bulk action buttons - only for system moods */}
              {activeTab === 'system' && bulkSelectMode && bulkSelected.length > 0 && (
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleBulkPin}
                    className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Pin ({bulkSelected.length})
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkHide}
                    className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Hide ({bulkSelected.length})
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Emotions list */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading emotions...</div>
            ) : loadingError ? (
              <div className="p-4 text-center">
                <div className="text-red-600 mb-2">
                  <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm font-medium">Failed to load emotions</div>
                </div>
                <div className="text-xs text-red-500 mb-3">{loadingError}</div>
                <button
                  onClick={retryEmotionLoading}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Try again
                </button>
              </div>
            ) : filteredEmotions.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchQuery ? (
                  <>
                    <div>No {activeTab === 'custom' ? 'custom' : 'system'} moods match your search</div>
                    {activeTab === 'custom' && (
                      <div className="mt-2">
                        <button
                          onClick={() => handleCreateMood(searchQuery.trim())}
                          className="text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          Create "{searchQuery}"
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div>No {activeTab === 'custom' ? 'custom' : 'system'} moods available</div>
                    {!showHidden && emotions.some(e => e.type === (activeTab === 'custom' ? 'user' : 'global') && e.isHidden) && (
                      <div className="mt-2">
                        <button
                          onClick={() => setShowHidden(true)}
                          className="text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          Show hidden {activeTab === 'custom' ? 'custom' : 'system'} moods
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="py-2">
                {(() => {
                  // Sort emotions based on active tab
                  let sortedEmotions = [...filteredEmotions];
                  
                  // Both custom and system moods use the same sorting logic: pinned first, then alphabetical
                  sortedEmotions.sort((a, b) => {
                    // Pinned moods first
                    if (a.isPinned && !b.isPinned) return -1;
                    if (!a.isPinned && b.isPinned) return 1;
                    
                    // Among pinned moods, sort by pinOrder
                    if (a.isPinned && b.isPinned) {
                      if (a.pinOrder !== null && b.pinOrder !== null) {
                        return a.pinOrder - b.pinOrder;
                      }
                      if (a.pinOrder !== null) return -1;
                      if (b.pinOrder !== null) return 1;
                    }
                    
                    // Alphabetical for same pin status
                    return a.name.localeCompare(b.name);
                  });
                  
                  const pinnedEmotions = sortedEmotions.filter(e => e.isPinned);
                  const unpinnedEmotions = sortedEmotions.filter(e => !e.isPinned);
                  
                  const renderEmotion = (emotion: Emotion) => (
                    <div
                      key={emotion.id}
                      className={`
                        flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer
                        ${selectedEmotions.includes(emotion.id) ? 'bg-blue-50' : ''}
                        ${emotion.isHidden ? 'opacity-60' : ''}
                      `}
                      onClick={() => {
                        if (bulkSelectMode) {
                          handleBulkToggle(emotion.id);
                        } else {
                          handleEmotionToggle(emotion.id, emotion);
                        }
                      }}
                    >
                      <div className="flex items-center flex-1">
                        {/* Bulk select checkbox */}
                        {bulkSelectMode && (
                          <label className="flex items-center mr-2">
                            <input
                              type="checkbox"
                              checked={bulkSelected.includes(emotion.id)}
                              onChange={() => handleBulkToggle(emotion.id)}
                              className="text-blue-600 focus:ring-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="sr-only">Select {emotion.displayName}</span>
                          </label>
                        )}

                        {/* Selection indicator */}
                        {!bulkSelectMode && (
                          <div className="flex items-center mr-3">
                            <div className={`
                              w-4 h-4 rounded border-2 flex items-center justify-center
                              ${selectedEmotions.includes(emotion.id)
                                ? 'bg-blue-500 border-blue-500'
                                : 'border-gray-300'
                              }
                            `}>
                              {selectedEmotions.includes(emotion.id) && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Emotion info */}
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className={`
                              text-sm font-medium
                              ${emotion.isPinned ? 'text-green-800' : 'text-gray-900'}
                            `}>
                              {emotion.displayName}
                            </span>
                            
                            {/* Indicators */}
                            <div className="flex items-center ml-2 space-x-1">
                              {emotion.isPinned && (
                                <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              )}
                              {emotion.isCore && (
                                <span className="px-1 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">Core</span>
                              )}
                              {emotion.usageCount > 0 && (
                                <span className="px-1 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                                  {emotion.usageCount}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Categories */}
                          {showCategories && emotion.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {emotion.categories.slice(0, 2).map((category) => (
                                <span
                                  key={category.id}
                                  className="text-xs px-1 py-0.5 rounded text-gray-600"
                                  style={{ backgroundColor: category.color + '20' }}
                                >
                                  {category.name}
                                </span>
                              ))}
                              {emotion.categories.length > 2 && (
                                <span className="text-xs text-gray-500">
                                  +{emotion.categories.length - 2}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Analysis */}
                          {showAnalysis && emotion.analysis && (
                            <div className="mt-1 text-xs text-gray-600">
                              {emotion.analysis.dominantEmotion} • {emotion.analysis.intensityLevel} intensity
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons - show for system moods in system tab and user moods in custom tab */}
                      {enablePreferences && session && !bulkSelectMode && (
                        (activeTab === 'system' && typeof emotion.id === 'number') ||
                        (activeTab === 'custom' && emotion.type === 'user' && emotion.userMoodId)
                      ) && (
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePinToggle(emotion.id, emotion.isPinned);
                            }}
                            className={`
                              p-1 rounded hover:bg-gray-200 transition-colors
                              ${emotion.isPinned ? 'text-green-600' : 'text-gray-400'}
                            `}
                            title={emotion.isPinned ? 'Unpin' : 'Pin'}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleHideToggle(emotion.id, emotion.isHidden);
                            }}
                            className={`
                              p-1 rounded hover:bg-gray-200 transition-colors
                              ${emotion.isHidden ? 'text-red-600' : 'text-gray-400'}
                            `}
                            title={emotion.isHidden ? 'Unhide' : 'Hide'}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L2.632 2.632m7.246 7.246l4.242 4.242m-4.242-4.242L16.5 16.5m-4.242-4.242L2.632 2.632m7.246 7.246l4.242 4.242" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                  
                  return (
                    <>
                      {/* Pinned emotions section (both custom and system) */}
                      {pinnedEmotions.length > 0 && (
                        <div className="mb-2">
                          <div className={`flex items-center px-3 py-1 border-l-4 ${
                            activeTab === 'custom' 
                              ? 'bg-purple-50 border-purple-500' 
                              : 'bg-green-50 border-green-500'
                          }`}>
                            <svg className={`w-4 h-4 mr-2 ${
                              activeTab === 'custom' ? 'text-purple-600' : 'text-green-600'
                            }`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className={`text-sm font-medium ${
                              activeTab === 'custom' ? 'text-purple-800' : 'text-green-800'
                            }`}>
                              Pinned {activeTab === 'custom' ? 'Custom' : 'System'} Moods
                            </span>
                          </div>
                          <div>
                            {pinnedEmotions.map(renderEmotion)}
                          </div>
                        </div>
                      )}
                      
                      {/* Separator if we have both pinned and unpinned */}
                      {pinnedEmotions.length > 0 && unpinnedEmotions.length > 0 && (
                        <div className="border-t border-gray-200 my-2"></div>
                      )}
                      
                      {/* Unpinned emotions section (both custom and system) */}
                      {unpinnedEmotions.length > 0 && (
                        <div>
                          {unpinnedEmotions.map(renderEmotion)}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Suggestion Modal */}
      <AddCustomWordModal
        isOpen={showSuggestModal}
        onClose={handleModalClose}
        onMoodAdded={handleModalSubmit}
        initialMoodName={pendingMoodName}
      />
    </div>
  );
} 