/**
 * GET /api/releases/update
 *
 * Tauri auto-update endpoint.
 * Returns update information in Tauri's expected format.
 *
 * Query params:
 * - target: Platform target (e.g., "windows-x86_64", "darwin-x86_64", "linux-x86_64")
 * - arch: Architecture (optional, parsed from target)
 * - current_version: Current app version
 */

import { NextRequest, NextResponse } from 'next/server';
import { getHumanOsClient, isHumanOsConfigured } from '@/lib/supabase/human-os';

interface TauriUpdateResponse {
  version: string;
  notes: string;
  pub_date: string;
  platforms: {
    [key: string]: {
      signature: string;
      url: string;
    };
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const target = searchParams.get('target') || '';
    const currentVersion = searchParams.get('current_version') || '0.0.0';

    // Parse platform from target
    // Tauri sends: windows-x86_64, darwin-x86_64, darwin-aarch64, linux-x86_64
    let platform = 'windows';
    if (target.includes('darwin')) {
      platform = 'macos';
    } else if (target.includes('linux')) {
      platform = 'linux';
    }

    // Check if Human OS is configured
    if (!isHumanOsConfigured()) {
      // Return no update available for development
      return new NextResponse(null, { status: 204 });
    }

    const db = getHumanOsClient();

    // Check for updates
    const { data, error } = await db.rpc('check_for_update', {
      p_current_version: currentVersion,
      p_platform: platform,
      p_arch: target.includes('aarch64') ? 'arm64' : 'x64',
    });

    if (error) {
      console.error('Error checking for update:', error);
      return NextResponse.json(
        { error: 'Failed to check for updates' },
        { status: 500 }
      );
    }

    // No update available
    if (!data || !data.update_available) {
      return new NextResponse(null, { status: 204 });
    }

    // Return Tauri-compatible update response
    const response: TauriUpdateResponse = {
      version: data.version,
      notes: data.notes || '',
      pub_date: data.pub_date,
      platforms: data.platforms || {},
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error('Error in update check:', error);
    return NextResponse.json(
      { error: 'Failed to check for updates' },
      { status: 500 }
    );
  }
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
