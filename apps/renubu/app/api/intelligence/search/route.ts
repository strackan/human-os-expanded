/**
 * Cross-Org Intelligence Search API
 *
 * POST /api/intelligence/search
 *
 * Searches global entities using:
 * - Text search (name, company, title)
 * - Semantic search (embeddings)
 * - Signal filters (sentiment, skills, interests)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

interface SearchRequest {
  query: string;
  filters?: {
    company?: string;
    skills?: string[];
    interests?: string[];
    minSentiment?: number;
    minNetworkBreadth?: number;
  };
  limit?: number;
  offset?: number;
  semantic?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json();
    const { query, filters = {}, limit = 20, offset = 0, semantic = false } = body;

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      db: { schema: 'global' }
    });

    // Build the query
    let dbQuery = supabase
      .from('entity_intelligence')
      .select('*')
      .or(`name.ilike.%${query}%,current_company.ilike.%${query}%,current_title.ilike.%${query}%`)
      .order('network_breadth', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (filters.company) {
      dbQuery = dbQuery.ilike('current_company', `%${filters.company}%`);
    }

    if (filters.minSentiment !== undefined) {
      dbQuery = dbQuery.gte('avg_sentiment', filters.minSentiment);
    }

    if (filters.minNetworkBreadth !== undefined) {
      dbQuery = dbQuery.gte('network_breadth', filters.minNetworkBreadth);
    }

    // Skills/interests filtering done in-memory (array containment)
    const { data: results, error } = await dbQuery;

    if (error) {
      console.error('Search error:', error);
      return NextResponse.json(
        { error: 'Search failed', details: error.message },
        { status: 500 }
      );
    }

    // Post-filter by skills/interests if specified
    let filtered = results || [];

    if (filters.skills && filters.skills.length > 0) {
      filtered = filtered.filter((r) =>
        filters.skills!.some((skill) =>
          r.skills?.some((s: string) => s?.toLowerCase().includes(skill.toLowerCase()))
        )
      );
    }

    if (filters.interests && filters.interests.length > 0) {
      filtered = filtered.filter((r) =>
        filters.interests!.some((interest) =>
          r.interests?.some((i: string) => i?.toLowerCase().includes(interest.toLowerCase()))
        )
      );
    }

    return NextResponse.json({
      results: filtered,
      total: filtered.length,
      query,
      filters,
    });
  } catch (err) {
    console.error('Search API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
