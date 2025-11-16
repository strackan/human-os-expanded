import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/version
 *
 * Returns the current production release version from the database
 * Fetches the most recently completed/shipped release
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Get the most recent completed and shipped release
    const { data, error } = await supabase
      .from('releases')
      .select(`
        version,
        name,
        actual_shipped,
        release_statuses!inner(slug)
      `)
      .eq('release_statuses.slug', 'complete')
      .not('actual_shipped', 'is', null)
      .order('actual_shipped', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('[Version API] Error fetching version:', error);
      // Fallback to hardcoded version if database query fails
      return NextResponse.json({ version: '0.1.8', source: 'fallback' });
    }

    if (!data) {
      return NextResponse.json({ version: '0.1.8', source: 'fallback' });
    }

    return NextResponse.json({
      version: data.version,
      name: data.name,
      shipped: data.actual_shipped,
      source: 'database'
    });
  } catch (error) {
    console.error('[Version API] Unexpected error:', error);
    return NextResponse.json({ version: '0.1.8', source: 'fallback' });
  }
}
