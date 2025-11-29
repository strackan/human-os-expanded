import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Current version - update this with each release
const CURRENT_VERSION = '0.1.11';
const CURRENT_VERSION_NAME = 'QBR Presentations';

/**
 * GET /api/version
 *
 * Returns the current production release version.
 * Primary source: hardcoded CURRENT_VERSION (most reliable)
 * Fallback: database lookup for historical tracking
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Try to get version from database for additional metadata
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

    if (error || !data) {
      // Database doesn't have release info - use hardcoded version
      return NextResponse.json({
        version: CURRENT_VERSION,
        name: CURRENT_VERSION_NAME,
        source: 'code'
      });
    }

    // Compare database version with code version
    // Use whichever is higher (in case database is behind)
    const dbVersion = data.version;
    const useCodeVersion = compareVersions(CURRENT_VERSION, dbVersion) > 0;

    return NextResponse.json({
      version: useCodeVersion ? CURRENT_VERSION : dbVersion,
      name: useCodeVersion ? CURRENT_VERSION_NAME : data.name,
      shipped: useCodeVersion ? new Date().toISOString() : data.actual_shipped,
      source: useCodeVersion ? 'code' : 'database'
    });
  } catch (error) {
    console.error('[Version API] Unexpected error:', error);
    return NextResponse.json({
      version: CURRENT_VERSION,
      name: CURRENT_VERSION_NAME,
      source: 'code'
    });
  }
}

/**
 * Compare two semver version strings
 * Returns: 1 if a > b, -1 if a < b, 0 if equal
 */
function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }
  return 0;
}
