/**
 * Public Release Notes API
 *
 * Provides release notes data for external consumption (e.g., marketing site at renubu.com)
 * No authentication required - this is public-facing data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client with service role key to bypass RLS
    // This is safe for read-only public data
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const version = searchParams.get('version');
    const limit = parseInt(searchParams.get('limit') || '10');
    const includeUnreleased = searchParams.get('includeUnreleased') === 'true';

    // Build query
    let query = supabase
      .from('releases')
      .select(`
        id,
        version,
        name,
        description,
        release_notes,
        planned_start,
        planned_end,
        actual_shipped,
        phase_number,
        status_id,
        created_at
      `)
      .order('actual_shipped', { ascending: false, nullsFirst: false });

    // Filter by version if specified
    if (version) {
      query = query.eq('version', version);
    }

    // Filter out unreleased versions unless explicitly requested
    if (!includeUnreleased) {
      query = query.not('actual_shipped', 'is', null);
    }

    // Apply limit
    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('[API] Error fetching release notes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch release notes' },
        { status: 500 }
      );
    }

    // Set CORS headers to allow cross-origin requests from renubu.com
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*'); // Allow all origins - adjust if needed
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
    headers.set('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes

    return NextResponse.json(
      {
        success: true,
        data,
        count: data?.length || 0,
      },
      { headers }
    );
  } catch (error) {
    console.error('[API] Unexpected error in release-notes endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS preflight requests for CORS
export async function OPTIONS() {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');

  return new NextResponse(null, { status: 204, headers });
}
