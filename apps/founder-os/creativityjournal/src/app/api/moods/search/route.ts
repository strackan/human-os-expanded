import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';
import { analyzeEmotion, formatEmotionName, getEmotionColor } from '@/lib/emotionUtils';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // 'global', 'user', 'all'
    const category = searchParams.get('category') || '';
    const coreOnly = searchParams.get('coreOnly') === 'true';
    const intensity = searchParams.get('intensity') || '';
    const valence = searchParams.get('valence') || '';
    const showHidden = searchParams.get('showHidden') === 'true';
    const limit = parseInt(searchParams.get('limit') || '0'); // 0 means no limit for search
    const offset = parseInt(searchParams.get('offset') || '0');

    // For comprehensive mood search (used by moods page), use the main moods API logic
    if (category || coreOnly || intensity || valence || showHidden) {
      return await handleComprehensiveMoodSearch(request, session);
    }

    const results: { global?: any[], user?: any[], total?: number, hasMore?: boolean } = {};

    if (type === 'global' || type === 'all') {
      // Search ALL global moods first (no limit for search)
      const globalMoods = await prisma.mood.findMany({
        where: {
          name: { 
            contains: query,
            mode: 'insensitive' // Case-insensitive search
          }
        },
        include: { 
          moodProps: true 
        }
      });

      // Get user preferences for ordering
      let userPreferences: any[] = [];
      if (session?.user?.id) {
        userPreferences = await prisma.userMoodPreferences.findMany({
          where: { userId: session.user.id }
        });
      }

      // Enrich moods with user preferences
      const enrichedGlobalMoods = globalMoods.map(mood => {
        const userPref = userPreferences.find(p => p.moodId === mood.id);
        return {
          id: mood.id,
          name: mood.name,
          type: 'global',
          moodProps: mood.moodProps[0] || null,
          isPinned: userPref?.isPinned || false,
          isHidden: userPref?.isHidden || false,
          pinOrder: userPref?.pinOrder || null,
          usageCount: userPref?.usageCount || 0,
          lastUsedAt: userPref?.lastUsedAt || null,
        };
      });

      // Filter out hidden moods unless explicitly requested
      const visibleGlobalMoods = session?.user?.id && !showHidden
        ? enrichedGlobalMoods.filter(mood => !mood.isHidden)
        : enrichedGlobalMoods;

      // Apply preference-based ordering
      if (session?.user?.id) {
        visibleGlobalMoods.sort((a, b) => {
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
      } else {
        // For unauthenticated users, sort by name
        visibleGlobalMoods.sort((a, b) => a.name.localeCompare(b.name));
      }

      let paginatedGlobalMoods = visibleGlobalMoods;
      
      // Apply pagination only for display, not for search
      if (limit > 0) {
        paginatedGlobalMoods = visibleGlobalMoods.slice(offset, offset + limit);
      }

      results.global = paginatedGlobalMoods.map(mood => ({
        id: mood.id,
        name: mood.name,
        type: 'global',
        moodProps: mood.moodProps,
        isPinned: mood.isPinned,
        isHidden: mood.isHidden,
        pinOrder: mood.pinOrder,
        usageCount: mood.usageCount,
        lastUsedAt: mood.lastUsedAt
      }));

      // Add pagination info
      results.total = visibleGlobalMoods.length;
      results.hasMore = limit > 0 && (offset + limit < visibleGlobalMoods.length);
      
      // If no results found and we're not showing hidden moods, check for hidden matches
      if (visibleGlobalMoods.length === 0 && !showHidden && session?.user?.id && query) {
        const hiddenMatches = enrichedGlobalMoods.filter(mood => 
          mood.isHidden && mood.name.toLowerCase().includes(query.toLowerCase())
        );
        results.hiddenMatchingCount = hiddenMatches.length;
      }
    }

    if (type === 'user' || type === 'all') {
      // Search ALL user's custom moods (no limit for search)
      const userMoods = await prisma.userMood.findMany({
        where: {
          userId: session.user.id,
          moodName: { 
            contains: query,
            mode: 'insensitive' // Case-insensitive search
          }
        },
        orderBy: [
          { createdAt: 'desc' }
        ]
      });

      let paginatedUserMoods = userMoods;
      
      // Apply pagination only for display, not for search
      if (limit > 0) {
        paginatedUserMoods = userMoods.slice(offset, offset + limit);
      }

      results.user = paginatedUserMoods.map(mood => ({
        id: mood.id,
        moodName: mood.moodName,
        status: mood.status,
        type: 'custom',
        createdAt: mood.createdAt
      }));

      // Add pagination info for user moods
      if (!results.total) results.total = 0;
      results.total += userMoods.length;
      
      if (!results.hasMore) {
        results.hasMore = limit > 0 && (offset + limit < userMoods.length);
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching moods:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Comprehensive search function for moods page
async function handleComprehensiveMoodSearch(request: NextRequest, session: any) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const coreOnly = searchParams.get('coreOnly') === 'true';
  const intensity = searchParams.get('intensity') || '';
  const valence = searchParams.get('valence') || '';
  const showHidden = searchParams.get('showHidden') === 'true';
  const limit = parseInt(searchParams.get('limit') || '0'); // 0 means no limit
  const offset = parseInt(searchParams.get('offset') || '0');

  // Build where clause for filtering
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

  let searchFilter = {};
  if (query) {
    searchFilter = {
      name: {
        contains: query,
        mode: 'insensitive'
      }
    };
  }

  // Fetch ALL moods that match the filters (no limit for search)
  const allMoods = await prisma.mood.findMany({
    where: {
      ...categoryFilter,
      ...coreFilter,
      ...searchFilter
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

  // Get user preferences for mood enhancement
  let userPreferences: any[] = [];
  if (session?.user?.id) {
    userPreferences = await prisma.userMoodPreferences.findMany({
      where: { userId: session.user.id }
    });
  }

  // Process and enrich moods
  const enrichedMoods = allMoods.map(mood => {
    const moodProp = mood.moodProps?.[0];
    const userPref = userPreferences.find(p => p.moodId === mood.id);
    
    // Analyze emotion
    const analysis = analyzeEmotion(mood.name);
    
    return {
      id: mood.id,
      name: mood.name,
      displayName: formatEmotionName(mood.name),
      categories: mood.moodCategories.map(mc => ({
        id: mc.category.id,
        name: mc.category.name,
        slug: mc.category.slug,
        color: mc.category.color,
        type: mc.category.type,
        isPrimary: mc.isPrimary,
        relevanceScore: mc.relevanceScore || 0
      })),
      isCore: moodProp?.core || false,
      plutchikProfile: moodProp?.plutchikProfile || null,
      intensity: moodProp?.intensity || 5,
      arousal: moodProp?.arousal || 5,
      valence: moodProp?.valence || 5,
      dominance: moodProp?.dominance || 5,
      analysis,
      // Include user preferences directly in the mood object
      isPinned: userPref?.isPinned || false,
      isHidden: userPref?.isHidden || false,
      pinOrder: userPref?.pinOrder || null,
      usageCount: userPref?.usageCount || 0,
      lastUsedAt: userPref?.lastUsedAt || null,
      userPreference: userPref ? {
        isPinned: userPref.isPinned,
        isHidden: userPref.isHidden,
        usageCount: userPref.usageCount,
        lastUsedAt: userPref.lastUsedAt
      } : null
    };
  });

  // Apply intensity and valence filters after enrichment
  let filteredMoods = enrichedMoods;
  
  if (intensity !== '' && intensity !== 'all') {
    const intensityFilter = getIntensityFilter(intensity);
    if (intensityFilter) {
      filteredMoods = filteredMoods.filter(mood => {
        const intensityValue = mood.intensity;
        if (intensityFilter.lte !== undefined && intensityFilter.gte !== undefined) {
          return intensityValue >= intensityFilter.gte && intensityValue <= intensityFilter.lte;
        } else if (intensityFilter.lte !== undefined) {
          return intensityValue <= intensityFilter.lte;
        } else if (intensityFilter.gte !== undefined) {
          return intensityValue >= intensityFilter.gte;
        }
        return true;
      });
    }
  }

  if (valence !== '' && valence !== 'all') {
    const valenceFilter = getValenceFilter(valence);
    if (valenceFilter) {
      filteredMoods = filteredMoods.filter(mood => {
        const valenceValue = mood.valence;
        if (valenceFilter.lte !== undefined && valenceFilter.gte !== undefined) {
          return valenceValue >= valenceFilter.gte && valenceValue <= valenceFilter.lte;
        } else if (valenceFilter.lte !== undefined) {
          return valenceValue <= valenceFilter.lte;
        } else if (valenceFilter.gte !== undefined) {
          return valenceValue >= valenceFilter.gte;
        }
        return true;
      });
    }
  }

  // Filter out hidden moods unless explicitly requested
  if (session?.user?.id && !showHidden) {
    filteredMoods = filteredMoods.filter(mood => !mood.isHidden);
  }

  // Apply preference-based ordering (same as main moods API)
  if (session?.user?.id) {
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
  } else {
    // For unauthenticated users, sort by name
    filteredMoods.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Apply pagination only for display
  let paginatedMoods = filteredMoods;
  if (limit > 0) {
    paginatedMoods = filteredMoods.slice(offset, offset + limit);
  }

  // Check for hidden moods that match the search but are filtered out
  let hiddenMatchingMoods = [];
  if (session?.user?.id && filteredMoods.length === 0 && query && !showHidden) {
    // Search for hidden moods that match the query
    hiddenMatchingMoods = enrichedMoods.filter(mood => 
      mood.isHidden && mood.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Generate insights
  const insights = generateSearchInsights(filteredMoods, {
    query,
    category,
    coreOnly,
    intensity,
    valence
  }, hiddenMatchingMoods.length);

  return NextResponse.json({
    moods: paginatedMoods,
    total: filteredMoods.length,
    returned: paginatedMoods.length,
    hasMore: limit > 0 && (offset + limit < filteredMoods.length),
    nextOffset: limit > 0 && (offset + limit < filteredMoods.length) ? offset + limit : null,
    insights,
    hiddenMatchingCount: hiddenMatchingMoods.length,
    searchStats: {
      query,
      totalResults: filteredMoods.length,
      filters: {
        category,
        coreOnly,
        intensity,
        valence
      }
    }
  });
}

function getIntensityFilter(intensity: string) {
  switch (intensity) {
    case 'low':
      return { lte: 4 };
    case 'medium':
      return { gte: 5, lte: 7 };
    case 'high':
      return { gte: 8 };
    default:
      return null;
  }
}

function getValenceFilter(valence: string) {
  switch (valence) {
    case 'negative':
      return { lte: 3 };
    case 'neutral':
      return { gte: 4, lte: 7 };
    case 'positive':
      return { gte: 8 };
    default:
      return null;
  }
}

function generateSearchInsights(moods: any[], filters: any, hiddenMatchingCount: number = 0): string[] {
  const insights = [];
  
  if (moods.length === 0) {
    if (filters.query) {
      insights.push(`No emotions found matching "${filters.query}".`);
      if (hiddenMatchingCount > 0) {
        insights.push(`${hiddenMatchingCount} hidden emotion${hiddenMatchingCount === 1 ? '' : 's'} match your search. Would you like to view hidden moods?`);
      }
    } else {
      insights.push('No emotions found matching your search criteria.');
    }
    return insights;
  }
  
  // Search result count
  if (filters.query) {
    insights.push(`Found ${moods.length} emotions matching "${filters.query}".`);
  } else {
    insights.push(`Found ${moods.length} emotions matching your filters.`);
  }
  
  // Category insights
  const categoryDistribution = {};
  moods.forEach(mood => {
    mood.categories.forEach(cat => {
      if (cat.isPrimary) {
        categoryDistribution[cat.name] = (categoryDistribution[cat.name] || 0) + 1;
      }
    });
  });
  
  const topCategory = Object.entries(categoryDistribution)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0];
  
  if (topCategory && topCategory[1] > 1) {
    insights.push(`Most results belong to ${topCategory[0]} category (${topCategory[1]} emotions).`);
  }
  
  // Complexity insights
  const complexityDistribution = { simple: 0, moderate: 0, complex: 0 };
  moods.forEach(mood => {
    if (mood.analysis) {
      if (mood.analysis.complexity === 1) complexityDistribution.simple++;
      else if (mood.analysis.complexity <= 3) complexityDistribution.moderate++;
      else complexityDistribution.complex++;
    }
  });
  
  const totalWithAnalysis = Object.values(complexityDistribution).reduce((a, b) => a + b, 0);
  if (totalWithAnalysis > 0) {
    const complexPercentage = (complexityDistribution.complex / totalWithAnalysis * 100).toFixed(1);
    if (complexityDistribution.complex > 0) {
      insights.push(`${complexPercentage}% of results are complex emotions with multiple components.`);
    }
  }
  
  // Valence insights
  const valenceDistribution = { positive: 0, neutral: 0, negative: 0 };
  moods.forEach(mood => {
    if (mood.analysis) {
      valenceDistribution[mood.analysis.valenceLevel]++;
    }
  });
  
  const mostCommonValence = Object.entries(valenceDistribution)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0];
  
  if (mostCommonValence && mostCommonValence[1] > 0) {
    const percentage = (mostCommonValence[1] / totalWithAnalysis * 100).toFixed(1);
    insights.push(`${percentage}% of results are ${mostCommonValence[0]} emotions.`);
  }
  
  // Core emotions insights
  const coreCount = moods.filter(mood => mood.isCore).length;
  if (coreCount > 0) {
    const corePercentage = (coreCount / moods.length * 100).toFixed(1);
    insights.push(`${corePercentage}% of results are core emotions.`);
  }
  
  return insights;
} 