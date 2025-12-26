import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { analyzeEmotion, formatEmotionName, getEmotionColor } from '@/lib/emotionUtils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

const prisma = new PrismaClient();

// Cache implementation with TTL
interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheItem>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

function getCacheKey(params: {
  category: string;
  coreOnly: boolean;
  includeAnalysis: boolean;
  includePreferences: boolean;
  showHidden: boolean;
  sortBy: string;
  userId?: string;
}): string {
  return `moods:${JSON.stringify(params)}`;
}

function getCachedData(key: string): any | null {
  const item = cache.get(key);
  if (!item) return null;
  
  // Check if cache has been invalidated by other operations (like user mood creation)
  const cacheInvalidatedAt = global.moodCacheInvalidatedAt || 0;
  if (item.timestamp < cacheInvalidatedAt) {
    console.log('[moods API] Cache invalidated by external operation, clearing entry');
    cache.delete(key);
    return null;
  }
  
  if (Date.now() - item.timestamp > item.ttl) {
    cache.delete(key);
    return null;
  }
  
  return item.data;
}

function setCachedData(key: string, data: any, ttl: number = CACHE_TTL): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
}

// Clear cache when it gets too large
function clearExpiredCache(): void {
  const now = Date.now();
  for (const [key, item] of cache.entries()) {
    if (now - item.timestamp > item.ttl) {
      cache.delete(key);
    }
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';
    const coreOnly = searchParams.get('coreOnly') === 'true';
    const includeAnalysis = searchParams.get('includeAnalysis') === 'true';
    const includePreferences = searchParams.get('includePreferences') === 'true';
    const showHidden = searchParams.get('showHidden') === 'true';
    const sortBy = searchParams.get('sortBy') || 'preference'; // 'preference', 'name', 'usage', 'recent'
    const limit = parseInt(searchParams.get('limit') || '0'); // 0 means no limit (fetch all)
    const offset = parseInt(searchParams.get('offset') || '0');
    
    console.log('Moods API called - fetching moods with filters:', { 
      category, coreOnly, includeAnalysis, includePreferences, showHidden, sortBy, limit, offset 
    });
    
    // Get user session if available
    const session = await getServerSession(authOptions);
    let user = null;
    if (session?.user?.id) {
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          email: true
        }
      });
    }

    // Create cache key
    const cacheKey = getCacheKey({
      category,
      coreOnly,
      includeAnalysis,
      includePreferences,
      showHidden,
      sortBy,
      userId: user?.id
    });

    // Check cache first (but only for non-paginated requests)
    let cachedData = null;
    if (limit === 0) {
      cachedData = getCachedData(cacheKey);
      if (cachedData) {
        console.log('Returning cached moods data');
        return NextResponse.json(cachedData);
      }
    }

    // Clear expired cache entries periodically
    if (cache.size > 100) {
      clearExpiredCache();
    }

    // Build where clause for filtering
    const whereClause: any = {};
    
    // If category filter is specified, join with mood_categories
    let categoryFilter = {};
    if (category && category !== 'all') {
      categoryFilter = {
        moodCategories: {
          some: {
            category: {
              slug: category
            }
          }
        }
      };
    }
    
    // If core only filter is specified, filter by core emotions
    let coreFilter = {};
    if (coreOnly) {
      coreFilter = {
        moodProps: {
          some: {
            core: true
          }
        }
      };
    }

    // Base mood query (global moods)
    const moods = await prisma.mood.findMany({
      where: {
        ...categoryFilter,
        ...coreFilter
      },
      include: {
        moodProps: true,
        moodCategories: {
          include: {
            category: true
          }
        }
      },
      orderBy: [
        { name: 'asc' }
      ]
    });

    // Get user preferences separately if needed
    let userPreferences: any[] = [];
    if (user && includePreferences) {
      userPreferences = await prisma.userMoodPreferences.findMany({
        where: { userId: user.id }
      });
    }

    // Fetch UserMoods for the current user
    let userMoods: any[] = [];
    if (user) {
      console.log('User found for UserMoods query:', { userId: user.id, email: user.email });
      userMoods = await prisma.userMood.findMany({
        where: {
          userId: user.id
        },
        include: {
          moodProps: true
        },
        orderBy: [
          { createdAt: 'desc' }
        ]
      });
      console.log('UserMoods query result:', userMoods.map(mood => ({ id: mood.id, name: mood.moodName, status: mood.status })));
    } else {
      console.log('No user found for session:', { sessionExists: !!session, userIdExists: !!session?.user?.id });
    }

    console.log(`Found ${moods.length} global moods and ${userMoods.length} user moods`);
    
    // Map global moods to include preference data and pill status
    const mappedGlobalMoods = moods.map(mood => {
      const moodProps = mood.moodProps?.[0] || null;
      const categories = mood.moodCategories?.map(mc => ({
        id: mc.category.id,
        name: mc.category.name,
        slug: mc.category.slug,
        colorHex: mc.category.colorHex,
        isPrimary: mc.isPrimary,
        relevanceScore: mc.relevanceScore
      })) || [];
      
      const userPreference = userPreferences.find(pref => pref.moodId === mood.id) || null;
      
      // Determine pill status - global moods are always green (approved)
      let pillStatus = 'green';
      let canPromote = false;
      
      const baseEmotion = {
        id: mood.id,
        name: mood.name,
        displayName: formatEmotionName(mood.name),
        categories: categories,
        isCore: moodProps?.core || false,
        type: 'global',
        plutchikProfile: moodProps ? {
          joy: moodProps.joyRating || 0,
          trust: moodProps.trustRating || 0,
          fear: moodProps.fearRating || 0,
          surprise: moodProps.surpriseRating || 0,
          sadness: moodProps.sadnessRating || 0,
          anticipation: moodProps.anticipationRating || 0,
          anger: moodProps.angerRating || 0,
          disgust: moodProps.disgustRating || 0,
        } : null,
        intensity: moodProps?.intensity || 5,
        arousal: moodProps?.arousalLevel || 5,
        valence: moodProps?.valence || 5,
        dominance: moodProps?.dominance || 5,
        
        // User preferences
        isPinned: userPreference?.isPinned || false,
        isHidden: userPreference?.isHidden || false,
        pinOrder: userPreference?.pinOrder || null,
        usageCount: userPreference?.usageCount || 0,
        lastUsedAt: userPreference?.lastUsedAt || null,
        firstUsedAt: userPreference?.firstUsedAt || null,
        
        // Pill status and promotion info
        pillStatus,
        canPromote
      };

      // Add emotion analysis if requested
      if (includeAnalysis && moodProps) {
        const analysis = analyzeEmotion(moodProps);
        return {
          ...baseEmotion,
          analysis: {
            dominantEmotion: analysis.dominantEmotion,
            complexity: analysis.complexity,
            color: getEmotionColor(analysis.dominantEmotion),
            intensityLevel: analysis.intensity > 7 ? 'high' : analysis.intensity > 4 ? 'medium' : 'low',
            valenceLevel: analysis.valence > 7 ? 'positive' : analysis.valence > 4 ? 'neutral' : 'negative',
            arousalLevel: analysis.arousal > 7 ? 'high' : analysis.arousal > 4 ? 'medium' : 'low',
          }
        };
      }

      return baseEmotion;
    });

    // Map UserMoods to the same format
    const mappedUserMoods = userMoods.map(userMood => {
      // Get the mood properties from the related MoodProps
      const moodProps = userMood.moodProps?.[0] || null;
      
      // Determine pill status based on UserMood status
      let pillStatus = 'user';
      let canPromote = false;
      
      switch (userMood.status) {
        case 'private':
          pillStatus = 'user'; // Show user moods with emerald green
          canPromote = true; // Can promote private moods to community
          break;
        case 'pending_approval':
          pillStatus = 'yellow';
          canPromote = false;
          break;
        case 'approved':
          pillStatus = 'green';
          canPromote = false;
          break;
        case 'rejected':
          pillStatus = 'red';
          canPromote = true; // Can re-promote after rejection
          break;
      }
      
      const baseEmotion = {
        id: userMood.id, // Use proper integer ID
        name: userMood.moodName,
        displayName: formatEmotionName(userMood.moodName),
        categories: [], // UserMoods don't have categories
        isCore: false,
        type: 'user',
        plutchikProfile: moodProps ? {
          joy: moodProps.joyRating || 0,
          trust: moodProps.trustRating || 0,
          fear: moodProps.fearRating || 0,
          surprise: moodProps.surpriseRating || 0,
          sadness: moodProps.sadnessRating || 0,
          anticipation: moodProps.anticipationRating || 0,
          anger: moodProps.angerRating || 0,
          disgust: moodProps.disgustRating || 0,
        } : {
          joy: 0, trust: 0, fear: 0, surprise: 0, sadness: 0, anticipation: 0, anger: 0, disgust: 0
        },
        intensity: moodProps?.intensity || 5,
        arousal: moodProps?.arousalLevel || 5,
        valence: moodProps?.valence || 5,
        dominance: moodProps?.dominance || 5,
        
        // User preferences - UserMoods don't have separate preferences
        isPinned: false,
        isHidden: false,
        pinOrder: null,
        usageCount: 0,
        lastUsedAt: null,
        firstUsedAt: null,
        
        // Pill status and promotion info
        pillStatus,
        canPromote,
        
        // Additional UserMood specific info
        userMoodId: userMood.id,
        status: userMood.status,
        description: userMood.description,
        createdAt: userMood.createdAt
      };

      // Add emotion analysis if requested
      if (includeAnalysis && moodProps) {
        const analysis = analyzeEmotion(moodProps);
        return {
          ...baseEmotion,
          analysis: {
            dominantEmotion: analysis.dominantEmotion,
            complexity: analysis.complexity,
            color: getEmotionColor(analysis.dominantEmotion),
            intensityLevel: analysis.intensity > 7 ? 'high' : analysis.intensity > 4 ? 'medium' : 'low',
            valenceLevel: analysis.valence > 7 ? 'positive' : analysis.valence > 4 ? 'neutral' : 'negative',
            arousalLevel: analysis.arousal > 7 ? 'high' : analysis.arousal > 4 ? 'medium' : 'low',
          }
        };
      }

      return baseEmotion;
    });

    // Combine global and user moods
    const mappedMoods = [...mappedGlobalMoods, ...mappedUserMoods];
    
    // Filter out hidden moods unless explicitly requested
    let filteredMoods = mappedMoods;
    if (user && !showHidden) {
      filteredMoods = mappedMoods.filter(mood => !mood.isHidden);
    }
    
    // Sort based on user preferences
    if (user && sortBy === 'preference') {
      filteredMoods.sort((a, b) => {
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
        
        // Among unpinned moods, sort by usage count, then by name
        if (a.usageCount !== b.usageCount) {
          return b.usageCount - a.usageCount;
        }
        
        return a.name.localeCompare(b.name);
      });
    } else if (sortBy === 'usage') {
      filteredMoods.sort((a, b) => {
        if (a.usageCount !== b.usageCount) {
          return b.usageCount - a.usageCount;
        }
        return a.name.localeCompare(b.name);
      });
    } else if (sortBy === 'recent') {
      filteredMoods.sort((a, b) => {
        if (a.lastUsedAt && b.lastUsedAt) {
          return new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime();
        }
        if (a.lastUsedAt) return -1;
        if (b.lastUsedAt) return 1;
        return a.name.localeCompare(b.name);
      });
    } else {
      // Default: sort by name
      filteredMoods.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    console.log(`Processed ${filteredMoods.length} enriched moods`);

    // Apply pagination if specified
    let paginatedMoods = filteredMoods;
    let totalCount = filteredMoods.length;
    
    if (limit > 0) {
      paginatedMoods = filteredMoods.slice(offset, offset + limit);
      console.log(`Applying pagination: offset=${offset}, limit=${limit}, returning ${paginatedMoods.length} moods`);
    }

    // Get summary statistics if user is authenticated
    let userStats = null;
    if (user) {
      const allUserMoods = filteredMoods;
      userStats = {
        totalMoods: allUserMoods.length,
        pinnedMoods: allUserMoods.filter(m => m.isPinned).length,
        hiddenMoods: allUserMoods.filter(m => m.isHidden).length,
        usedMoods: allUserMoods.filter(m => m.usageCount > 0).length,
        totalUsage: allUserMoods.reduce((sum, m) => sum + m.usageCount, 0),
        topUsedMoods: allUserMoods
          .filter(m => m.usageCount > 0)
          .sort((a, b) => b.usageCount - a.usageCount)
          .slice(0, 5)
          .map(m => ({
            id: m.id,
            name: m.name,
            usageCount: m.usageCount,
            lastUsedAt: m.lastUsedAt
          }))
      };
    }

    const responseData = {
      moods: paginatedMoods,
      total: totalCount,
      returned: paginatedMoods.length,
      hasMore: limit > 0 && (offset + limit < totalCount),
      nextOffset: limit > 0 && (offset + limit < totalCount) ? offset + limit : null,
      userStats,
      filters: {
        category: category || 'all',
        coreOnly,
        includeAnalysis,
        includePreferences,
        showHidden,
        sortBy,
        limit,
        offset
      }
    };

    // Cache the response (only for non-paginated requests)
    if (limit === 0) {
      setCachedData(cacheKey, responseData);
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Fetch moods error:', error);
    return NextResponse.json({ error: 'Failed to fetch moods' }, { status: 500 });
  }
} 