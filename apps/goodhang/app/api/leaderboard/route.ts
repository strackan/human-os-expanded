// GET /api/leaderboard
// Returns top-scoring assessment results with caching

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Cache duration: 5 minutes
const CACHE_TTL_SECONDS = 300;

interface LeaderboardEntry {
  id: string;
  user_id: string;
  full_name: string;
  overall_score: number;
  archetype: string;
  personality_type: string;
  tier: string;
  category_scores: {
    technical: { overall: number };
    emotional: { overall: number };
    creative: { overall: number };
  };
  badges: string[];
  completed_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category'); // 'technical', 'emotional', 'creative'
    const tier = searchParams.get('tier'); // 'top_1', 'benched'
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Validate limit
    if (limit > 100) {
      return NextResponse.json(
        { error: 'Maximum limit is 100' },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase
      .from('cs_assessment_sessions')
      .select(`
        id,
        user_id,
        overall_score,
        archetype,
        personality_type,
        tier,
        category_scores,
        badges,
        completed_at
      `)
      .eq('status', 'completed')
      .eq('is_published', true)
      .not('overall_score', 'is', null)
      .order('overall_score', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply tier filter if provided
    if (tier) {
      query = query.eq('tier', tier);
    }

    // Fetch assessment sessions
    const { data: sessions, error: sessionsError } = await query;

    if (sessionsError) {
      console.error('Error fetching leaderboard sessions:', sessionsError);
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard data' },
        { status: 500 }
      );
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        entries: [],
        total: 0,
        limit,
        offset,
      });
    }

    // Get user IDs
    const userIds = sessions.map((s) => s.user_id);

    // Fetch user profiles for display names
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    // Create a map of user_id -> full_name
    const profileMap = new Map(
      profiles?.map((p) => [p.id, p.full_name]) || []
    );

    // Transform sessions into leaderboard entries
    let entries: LeaderboardEntry[] = sessions.map((session) => ({
      id: session.id,
      user_id: session.user_id,
      full_name: profileMap.get(session.user_id) || 'Anonymous',
      overall_score: session.overall_score,
      archetype: session.archetype,
      personality_type: session.personality_type || 'N/A',
      tier: session.tier,
      category_scores: session.category_scores,
      badges: session.badges || [],
      completed_at: session.completed_at,
    }));

    // Apply category-based sorting if specified
    if (category && ['technical', 'emotional', 'creative'].includes(category)) {
      entries = entries.sort((a, b) => {
        const scoreA = a.category_scores?.[category as 'technical' | 'emotional' | 'creative']?.overall || 0;
        const scoreB = b.category_scores?.[category as 'technical' | 'emotional' | 'creative']?.overall || 0;
        return scoreB - scoreA;
      });
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('cs_assessment_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed')
      .eq('is_published', true)
      .not('overall_score', 'is', null);

    if (tier) {
      countQuery = countQuery.eq('tier', tier);
    }

    const { count } = await countQuery;

    // Set cache headers
    const response = NextResponse.json({
      entries,
      total: count || 0,
      limit,
      offset,
      filters: {
        category: category || null,
        tier: tier || null,
      },
    });

    response.headers.set(
      'Cache-Control',
      `public, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=60`
    );

    return response;
  } catch (error) {
    console.error('Error in /api/leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/leaderboard/stats
// Returns aggregated statistics about assessments
export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();

    // Fetch aggregate statistics
    const { data: sessions, error } = await supabase
      .from('cs_assessment_sessions')
      .select('overall_score, tier, category_scores, badges')
      .eq('status', 'completed')
      .eq('is_published', true)
      .not('overall_score', 'is', null);

    if (error) {
      console.error('Error fetching stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch statistics' },
        { status: 500 }
      );
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        total_assessments: 0,
        average_score: 0,
        tier_distribution: {},
        category_averages: {},
        top_badges: [],
      });
    }

    // Calculate statistics
    const totalAssessments = sessions.length;
    const averageScore = Math.round(
      sessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / totalAssessments
    );

    // Tier distribution
    const tierDistribution = sessions.reduce((acc, s) => {
      const tier = s.tier || 'unknown';
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Category averages
    const categoryAverages = {
      technical: 0,
      emotional: 0,
      creative: 0,
    };

    let validCategoryCount = 0;
    sessions.forEach((s) => {
      if (s.category_scores) {
        categoryAverages.technical += s.category_scores.technical?.overall || 0;
        categoryAverages.emotional += s.category_scores.emotional?.overall || 0;
        categoryAverages.creative += s.category_scores.creative?.overall || 0;
        validCategoryCount++;
      }
    });

    if (validCategoryCount > 0) {
      categoryAverages.technical = Math.round(categoryAverages.technical / validCategoryCount);
      categoryAverages.emotional = Math.round(categoryAverages.emotional / validCategoryCount);
      categoryAverages.creative = Math.round(categoryAverages.creative / validCategoryCount);
    }

    // Top badges (most frequently earned)
    const badgeCounts: Record<string, number> = {};
    sessions.forEach((s) => {
      if (s.badges && Array.isArray(s.badges)) {
        s.badges.forEach((badge: string) => {
          badgeCounts[badge] = (badgeCounts[badge] || 0) + 1;
        });
      }
    });

    const topBadges = Object.entries(badgeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([badge, count]) => ({ badge, count }));

    const response = NextResponse.json({
      total_assessments: totalAssessments,
      average_score: averageScore,
      tier_distribution: tierDistribution,
      category_averages: categoryAverages,
      top_badges: topBadges,
    });

    // Cache for 5 minutes
    response.headers.set(
      'Cache-Control',
      `public, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=60`
    );

    return response;
  } catch (error) {
    console.error('Error in POST /api/leaderboard (stats):', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
