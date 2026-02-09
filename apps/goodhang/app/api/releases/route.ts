/**
 * GET /api/releases
 *
 * Returns latest app releases for all platforms.
 * Used by download page to show available downloads.
 * Fetches from GitHub releases API.
 *
 * Query params:
 * - platform: Filter by platform (windows, macos, linux)
 * - version: Get specific version
 */

import { NextRequest, NextResponse } from 'next/server';

const GITHUB_REPO = 'strackan/human-os-expanded';

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
  'macos-arm64': Release | null;
  linux: Release | null;
  latest_version: string | null;
  release_notes: string | null;
}

interface GitHubAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  assets: GitHubAsset[];
}

// Asset name patterns for each platform
const PLATFORM_PATTERNS: Record<string, RegExp> = {
  windows: /\.msi$/i,
  'macos-arm64': /_aarch64\.dmg$/i,
  macos: /_x64\.dmg$/i,
  linux: /\.AppImage$/i,
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');

    // Fetch latest release from GitHub
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'GoodHang-Web',
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      console.error('GitHub API error:', response.status, response.statusText);
      return NextResponse.json(getMockReleases(platform));
    }

    const release: GitHubRelease = await response.json();
    const version = release.tag_name.replace(/^v/, '');

    // Build releases object from GitHub assets
    const result: LatestReleases = {
      windows: null,
      macos: null,
      'macos-arm64': null,
      linux: null,
      latest_version: version,
      release_notes: release.body || null,
    };

    // Match assets to platforms
    for (const asset of release.assets) {
      for (const [platformKey, pattern] of Object.entries(PLATFORM_PATTERNS)) {
        if (pattern.test(asset.name)) {
          const releaseObj: Release = {
            version,
            platform: platformKey,
            filename: asset.name,
            download_url: asset.browser_download_url,
            signature: null,
            file_size: asset.size,
            release_notes: release.body || null,
            is_latest: true,
            published_at: release.published_at,
          };

          result[platformKey as keyof LatestReleases] = releaseObj as never;
          break;
        }
      }
    }

    // Filter by platform if requested
    if (platform) {
      const filtered: LatestReleases = {
        windows: platform === 'windows' ? result.windows : null,
        macos: platform === 'macos' ? result.macos : null,
        'macos-arm64': platform === 'macos' ? result['macos-arm64'] : null,
        linux: platform === 'linux' ? result.linux : null,
        latest_version: result.latest_version,
        release_notes: result.release_notes,
      };
      return NextResponse.json(filtered);
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

function getMockReleases(platform: string | null): LatestReleases {
  const mockVersion = '0.1.1';
  const mockRelease = (p: string): Release | null => {
    // Only Windows has a release currently
    if (p !== 'windows') return null;
    return {
      version: mockVersion,
      platform: p,
      filename: `Good.Hang_${mockVersion}_x64_en-US.msi`,
      download_url: `https://github.com/${GITHUB_REPO}/releases/download/v${mockVersion}/Good.Hang_${mockVersion}_x64_en-US.msi`,
      signature: null,
      file_size: null,
      release_notes: 'Initial release - includes activation key support and multi-product routing.',
      is_latest: true,
      published_at: new Date().toISOString(),
    };
  };

  if (platform) {
    return {
      windows: platform === 'windows' ? mockRelease('windows') : null,
      macos: platform === 'macos' ? mockRelease('macos') : null,
      'macos-arm64': null,
      linux: platform === 'linux' ? mockRelease('linux') : null,
      latest_version: mockVersion,
      release_notes: 'Initial release',
    };
  }

  return {
    windows: mockRelease('windows'),
    macos: null,
    'macos-arm64': null,
    linux: null,
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
