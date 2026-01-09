/**
 * Network Search API
 *
 * POST /api/network-search
 *
 * Multi-mode semantic search across the Good Hang network.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSearchEngine, SearchMode, SearchFilters } from '@/lib/demo/search';

// =============================================================================
// TYPES
// =============================================================================

interface SearchRequestBody {
  query: string;
  mode: SearchMode;
  filters?: SearchFilters;
  limit?: number;
}

// =============================================================================
// ROUTE HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SearchRequestBody;

    // Validate request
    if (!body.query || typeof body.query !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid query' },
        { status: 400 }
      );
    }

    if (!body.mode || !['thought_leadership', 'social', 'professional', 'guy_for_that'].includes(body.mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Must be one of: thought_leadership, social, professional, guy_for_that' },
        { status: 400 }
      );
    }

    // Check environment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Server configuration error: missing Supabase credentials' },
        { status: 500 }
      );
    }

    if (!openaiKey) {
      return NextResponse.json(
        { error: 'Server configuration error: missing OpenAI API key' },
        { status: 500 }
      );
    }

    // Create search engine
    const searchEngine = createSearchEngine(
      supabaseUrl,
      supabaseKey,
      openaiKey,
      anthropicKey
    );

    // Execute search
    const results = await searchEngine.search({
      query: body.query,
      mode: body.mode,
      filters: body.filters,
      limit: body.limit || 10,
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Network search error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET - Return API documentation
// =============================================================================

export async function GET() {
  return NextResponse.json({
    name: 'Good Hang Network Search API',
    version: '1.0.0',
    endpoints: {
      'POST /api/network-search': {
        description: 'Multi-mode semantic search across the network',
        body: {
          query: 'string (required) - Natural language search query',
          mode: 'string (required) - One of: thought_leadership, social, professional, guy_for_that',
          filters: {
            location: 'string (optional) - Filter by location',
            industry: 'string (optional) - Filter by industry',
            connectionDegree: 'number (optional) - Max connection degree (1, 2, 3)',
            alignment: 'string[] (optional) - Filter by D&D alignments',
          },
          limit: 'number (optional, default 10) - Max results to return',
        },
        response: {
          results: 'SearchResult[] - Array of matching profiles',
          query: 'string - Original query',
          mode: 'string - Search mode used',
          totalMatches: 'number - Total matches found',
          executionTimeMs: 'number - Query execution time',
        },
      },
    },
    modes: {
      thought_leadership: 'Find people by ideas, expertise, and thought leadership content',
      social: 'Find compatible people for social activities and hangouts',
      professional: 'Find people for career and business networking',
      guy_for_that: 'Find someone in your network who can help with a specific need',
    },
    examples: [
      {
        query: 'Who has interesting takes on AI agents?',
        mode: 'thought_leadership',
      },
      {
        query: 'Find hiking buddies in Denver with good vibes',
        mode: 'social',
        filters: { location: 'Denver' },
      },
      {
        query: 'VP of Engineering in fintech with scaling experience',
        mode: 'professional',
      },
      {
        query: 'Someone who can help with Series A pitch deck',
        mode: 'guy_for_that',
      },
    ],
  });
}
