// GET /api/profiles
// Browse published profiles with search, filter, and pagination

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { BrowseProfilesResponse, PublicProfile } from '@/lib/assessment/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // Extract query parameters
    const search = searchParams.get('search') || '';
    const careerLevel = searchParams.get('career_level') || '';
    const archetype = searchParams.get('archetype') || '';
    const badgesParam = searchParams.get('badges') || searchParams.get('badge') || '';
    const sort = searchParams.get('sort') || 'published_at';
    const order = searchParams.get('order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Max 100
    const offset = (page - 1) * limit;

    // Parse badges array (comma-separated or single badge)
    const badges = badgesParam ? badgesParam.split(',').filter(Boolean) : [];

    // Build query
    let query = supabase
      .from('public_profiles')
      .select('*', { count: 'exact' });

    // Search filter (by name, archetype, or summary)
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,archetype.ilike.%${search}%,public_summary.ilike.%${search}%`
      );
    }

    // Career level filter
    if (careerLevel) {
      query = query.eq('career_level', careerLevel);
    }

    // Archetype filter
    if (archetype) {
      query = query.eq('archetype', archetype);
    }

    // Badge filter - support multiple badges (OR logic)
    if (badges.length > 0) {
      query = query.overlaps('badges', badges);
    }

    // Sorting - map frontend sort values to DB columns
    let sortColumn = 'published_at';
    let sortAscending = false;

    if (sort === 'newest') {
      sortColumn = 'published_at';
      sortAscending = false;
    } else if (sort === 'highest_score') {
      sortColumn = 'overall_score';
      sortAscending = false;
    } else if (sort === 'name') {
      sortColumn = 'name';
      sortAscending = true;
    } else {
      // Default or custom sort from query params
      const validSortColumns = ['published_at', 'overall_score', 'name', 'updated_at'];
      sortColumn = validSortColumns.includes(sort) ? sort : 'published_at';
      sortAscending = order === 'asc';
    }

    if (sortColumn === 'overall_score') {
      // When sorting by score, nulls should appear last
      query = query
        .order(sortColumn, { ascending: sortAscending, nullsFirst: false })
        .order('published_at', { ascending: false });
    } else {
      query = query.order(sortColumn, { ascending: sortAscending });
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: profiles, error, count } = await query;

    if (error) {
      console.error('Error fetching profiles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch profiles' },
        { status: 500 }
      );
    }

    // Privacy layer: ensure scores are hidden if show_scores is false
    const sanitizedProfiles = (profiles || []).map((profile) => {
      if (!profile.show_scores) {
        return {
          ...profile,
          overall_score: null,
          category_scores: null,
        };
      }
      return profile;
    });

    const total = count || 0;
    const hasMore = offset + limit < total;
    const totalPages = Math.ceil(total / limit);

    const response: BrowseProfilesResponse = {
      profiles: sanitizedProfiles as PublicProfile[],
      total,
      page,
      limit,
      hasMore,
      total_pages: totalPages,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in /api/profiles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
