/**
 * GET /api/releases
 *
 * Returns latest app releases for all platforms.
 * Used by download page to show available downloads.
 *
 * Query params:
 * - platform: Filter by platform (windows, macos, linux)
 * - version: Get specific version
 */

import { NextRequest, NextResponse } from 'next/server';
import { getHumanOsClient, isHumanOsConfigured } from '@/lib/supabase/human-os';

interface Release {
  version: string;
  platform: string;
  filename: string;
  download_url: string;
  signature: string | null;
  file_size: number | null;
  release_notes: string | null;
  is_latest: boolean;
  published_at: string;
}

interface LatestReleases {
  windows: Release | null;
  macos: Release | null;
  linux: Release | null;
  latest_version: string | null;
  release_notes: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const version = searchParams.get('version');

    // Check if Human OS is configured
    if (!isHumanOsConfigured()) {
      // Return mock data for development
      return NextResponse.json(getMockReleases(platform));
    }

    const db = getHumanOsClient();

    if (version) {
      // Get specific version
      let query = db
        .from('app_releases')
        .select('*')
        .eq('version', version);

      if (platform) {
        query = query.eq('platform', platform);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching release:', error);
        return NextResponse.json(
          { error: 'Failed to fetch release' },
          { status: 500 }
        );
      }

      return NextResponse.json({ releases: data || [] });
    }

    // Get latest releases for each platform
    const result: LatestReleases = {
      windows: null,
      macos: null,
      linux: null,
      latest_version: null,
      release_notes: null,
    };

    const platforms = platform ? [platform] : ['windows', 'macos', 'linux'];

    for (const p of platforms) {
      const { data } = await db.rpc('get_latest_release', { p_platform: p });

      if (data && data.length > 0) {
        const release = data[0];
        const releaseObj: Release = {
          version: release.version,
          platform: p,
          filename: `goodhang-${release.version}-${p}${getExtension(p)}`,
          download_url: release.download_url,
          signature: release.signature,
          file_size: release.file_size,
          release_notes: release.release_notes,
          is_latest: true,
          published_at: release.published_at,
        };

        if (p === 'windows') result.windows = releaseObj;
        else if (p === 'macos') result.macos = releaseObj;
        else if (p === 'linux') result.linux = releaseObj;

        // Track latest version
        if (!result.latest_version || release.version > result.latest_version) {
          result.latest_version = release.version;
          result.release_notes = release.release_notes;
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching releases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch releases' },
      { status: 500 }
    );
  }
}

function getExtension(platform: string): string {
  switch (platform) {
    case 'windows':
      return '.msi';
    case 'macos':
      return '.dmg';
    case 'linux':
      return '.AppImage';
    default:
      return '';
  }
}

function getMockReleases(platform: string | null): LatestReleases {
  const mockVersion = '0.1.0';
  const mockRelease = (p: string): Release => ({
    version: mockVersion,
    platform: p,
    filename: `goodhang-${mockVersion}-${p}${getExtension(p)}`,
    download_url: `https://github.com/your-org/goodhang-desktop/releases/download/v${mockVersion}/goodhang-${mockVersion}-${p}${getExtension(p)}`,
    signature: null,
    file_size: null,
    release_notes: 'Initial release - includes activation key support and multi-product routing.',
    is_latest: true,
    published_at: new Date().toISOString(),
  });

  if (platform) {
    return {
      windows: platform === 'windows' ? mockRelease('windows') : null,
      macos: platform === 'macos' ? mockRelease('macos') : null,
      linux: platform === 'linux' ? mockRelease('linux') : null,
      latest_version: mockVersion,
      release_notes: 'Initial release',
    };
  }

  return {
    windows: mockRelease('windows'),
    macos: mockRelease('macos'),
    linux: mockRelease('linux'),
    latest_version: mockVersion,
    release_notes: 'Initial release - includes activation key support and multi-product routing.',
  };
}

// Allow CORS for desktop client
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
