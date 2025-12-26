import { useState, useEffect, useCallback, useRef } from 'react';

interface MoodData {
  moods: any[];
  total: number;
  returned: number;
  hasMore: boolean;
  nextOffset: number | null;
  userStats: any;
  filters: any;
}

interface MoodCacheItem {
  data: MoodData;
  timestamp: number;
  ttl: number;
}

interface UseMoodDataOptions {
  category?: string;
  coreOnly?: boolean;
  includeAnalysis?: boolean;
  includePreferences?: boolean;
  showHidden?: boolean;
  sortBy?: string;
  limit?: number;
  enableCache?: boolean;
}

interface MoodLoadingState {
  loading: boolean;
  error: string | null;
  retryCount: number;
  lastRetryTime: number | null;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const moodCache = new Map<string, MoodCacheItem>();

function getCacheKey(options: UseMoodDataOptions): string {
  return `mood-data:${JSON.stringify(options)}`;
}

function getCachedData(key: string): MoodData | null {
  const item = moodCache.get(key);
  if (!item) return null;
  
  if (Date.now() - item.timestamp > item.ttl) {
    moodCache.delete(key);
    return null;
  }
  
  return item.data;
}

function setCachedData(key: string, data: MoodData): void {
  moodCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: CACHE_TTL
  });
}

function clearExpiredCache(): void {
  const now = Date.now();
  for (const [key, item] of moodCache.entries()) {
    if (now - item.timestamp > item.ttl) {
      moodCache.delete(key);
    }
  }
}

export function useMoodData(options: UseMoodDataOptions = {}) {
  const [moodData, setMoodData] = useState<MoodData | null>(null);
  const [loadingState, setLoadingState] = useState<MoodLoadingState>({
    loading: false,
    error: null,
    retryCount: 0,
    lastRetryTime: null
  });
  const [paginatedMoods, setPaginatedMoods] = useState<any[]>([]);
  const [currentOffset, setCurrentOffset] = useState(0);
  const retryCountRef = useRef(0);
  const lastRetryTimeRef = useRef<number | null>(null);

  const {
    category = '',
    coreOnly = false,
    includeAnalysis = false,
    includePreferences = true,
    showHidden = false,
    sortBy = 'preference',
    limit = 0,
    enableCache = true
  } = options;

  const fetchMoodData = useCallback(async (isRetry = false, offset = 0) => {
    const cacheKey = getCacheKey({ category, coreOnly, includeAnalysis, includePreferences, showHidden, sortBy, limit });
    
    // Check cache first (only for non-paginated requests)
    if (enableCache && limit === 0 && !isRetry) {
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        console.log('[useMoodData] Using cached mood data');
        setMoodData(cachedData);
        setPaginatedMoods(cachedData.moods);
        return;
      }
    }

    // Clear expired cache periodically
    if (moodCache.size > 50) {
      clearExpiredCache();
    }

    setLoadingState(prev => ({ 
      ...prev, 
      loading: true,
      error: null 
    }));

    try {
      const params = new URLSearchParams({
        includePreferences: includePreferences.toString(),
        includeAnalysis: includeAnalysis.toString(),
        showHidden: showHidden.toString(),
        sortBy: sortBy,
        ...(category && category !== 'all' && { category }),
        ...(coreOnly && { coreOnly: 'true' }),
        ...(limit > 0 && { limit: limit.toString() }),
        ...(offset > 0 && { offset: offset.toString() })
      });

      const response = await fetch(`/api/moods?${params}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        // Handle authentication errors differently
        if (response.status === 401) {
          throw new Error('Authentication required. Please sign in again.');
        }
        throw new Error(`Failed to fetch moods: ${response.status} ${response.statusText}`);
      }

      const data: MoodData = await response.json();
      
      // Cache the data (only for non-paginated requests)
      if (enableCache && limit === 0) {
        setCachedData(cacheKey, data);
      }

      setMoodData(data);
      
      // Handle pagination
      if (limit > 0 && offset > 0) {
        // Append new data for pagination
        setPaginatedMoods(prev => [...prev, ...data.moods]);
      } else {
        // Replace data for initial load or non-paginated requests
        setPaginatedMoods(data.moods);
      }

      setCurrentOffset(offset + data.returned);
      
      setLoadingState({
        loading: false,
        error: null,
        retryCount: 0,
        lastRetryTime: null
      });

      retryCountRef.current = 0;
      lastRetryTimeRef.current = null;

    } catch (error) {
      console.error('[useMoodData] Error fetching mood data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Don't retry authentication errors automatically
      const shouldRetry = !errorMessage.includes('Authentication required');
      
      setLoadingState({
        loading: false,
        error: errorMessage,
        retryCount: shouldRetry ? retryCountRef.current + 1 : 0,
        lastRetryTime: Date.now()
      });

      if (shouldRetry) {
        retryCountRef.current += 1;
        lastRetryTimeRef.current = Date.now();
      }
    }
  }, [category, coreOnly, includeAnalysis, includePreferences, showHidden, sortBy, limit, enableCache]);

  const loadMore = useCallback(() => {
    if (moodData && moodData.hasMore && moodData.nextOffset !== null) {
      fetchMoodData(false, moodData.nextOffset);
    }
  }, [moodData, fetchMoodData]);

  const retry = useCallback(() => {
    fetchMoodData(true);
  }, [fetchMoodData]);

  const refresh = useCallback(() => {
    // Clear cache and refetch
    const cacheKey = getCacheKey({ category, coreOnly, includeAnalysis, includePreferences, showHidden, sortBy, limit });
    moodCache.delete(cacheKey);
    
    // Clear all cache entries related to moods to ensure we get fresh data
    for (const [key] of moodCache.entries()) {
      if (key.includes('mood-data:')) {
        moodCache.delete(key);
      }
    }
    
    console.log('[useMoodData] Cache cleared, fetching fresh data');
    setCurrentOffset(0);
    setPaginatedMoods([]); // Clear existing data
    setMoodData(null); // Clear existing data
    fetchMoodData(false, 0);
  }, [fetchMoodData, category, coreOnly, includeAnalysis, includePreferences, showHidden, sortBy, limit]);

  // Initial fetch
  useEffect(() => {
    fetchMoodData();
  }, [fetchMoodData]);

  return {
    moods: paginatedMoods,
    allMoods: moodData?.moods || [],
    total: moodData?.total || 0,
    returned: moodData?.returned || 0,
    hasMore: moodData?.hasMore || false,
    userStats: moodData?.userStats || null,
    filters: moodData?.filters || {},
    loadingState,
    loadMore,
    retry,
    refresh,
    isLoaded: moodData !== null
  };
} 