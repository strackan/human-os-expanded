/**
 * OAuth Authorization Endpoint
 *
 * Initiates OAuth flow for a given provider
 * GET /api/auth/oauth/{provider}/authorize?integration={slug}
 *
 * Phase: 0.2 - MCP Registry & Integrations
 */

import { NextRequest, NextResponse } from 'next/server';
import { OAuthService } from '@/lib/services/OAuthService';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const searchParams = request.nextUrl.searchParams;
    const integrationSlug = searchParams.get('integration');

    if (!integrationSlug) {
      return NextResponse.json(
        { error: 'Missing integration parameter' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createServerSupabaseClient();

    // Support demo mode
    let userId: string;
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

    if (demoMode && process.env.NEXT_PUBLIC_DEMO_USER_ID) {
      userId = process.env.NEXT_PUBLIC_DEMO_USER_ID;
    } else {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized. Please sign in.' },
          { status: 401 }
        );
      }

      userId = user.id;
    }

    // Check if integration exists and is enabled (use service role to bypass RLS)
    const serviceSupabase = createServiceRoleClient();
    const { data: integration, error: integrationError } = await serviceSupabase
      .from('mcp_integrations')
      .select('*')
      .eq('slug', integrationSlug)
      .eq('status', 'enabled')
      .single();

    if (integrationError || !integration) {
      return NextResponse.json(
        { error: `Integration not found or not enabled: ${integrationSlug}` },
        { status: 404 }
      );
    }

    // Verify OAuth provider matches
    if (integration.oauth_provider !== provider) {
      return NextResponse.json(
        {
          error: `Provider mismatch: integration uses ${integration.oauth_provider}, not ${provider}`,
        },
        { status: 400 }
      );
    }

    // Check if user already has this integration (use service role to bypass RLS)
    const { data: existingIntegration } = await serviceSupabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('integration_id', integration.id)
      .is('deleted_at', null)
      .single();

    let userIntegrationId: string;

    if (existingIntegration) {
      // Update existing integration to pending
      userIntegrationId = existingIntegration.id;
      await serviceSupabase
        .from('user_integrations')
        .update({
          status: 'pending',
          error_message: null,
        })
        .eq('id', userIntegrationId);
    } else {
      // Create new user integration record
      const { data: newIntegration, error: createError } = await serviceSupabase
        .from('user_integrations')
        .insert({
          user_id: userId,
          integration_id: integration.id,
          status: 'pending',
        })
        .select()
        .single();

      if (createError || !newIntegration) {
        console.error('[OAuth Authorize] Failed to create user integration:', createError);
        return NextResponse.json(
          { error: `Failed to create integration record: ${createError?.message || 'Unknown error'}` },
          { status: 500 }
        );
      }

      userIntegrationId = newIntegration.id;
    }

    // Build redirect URI
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const redirectUri = `${baseUrl}/api/auth/oauth/${provider}/callback`;

    // Generate authorization URL
    const authUrl = await OAuthService.getAuthorizationUrl(
      provider,
      integrationSlug,
      userId,
      redirectUri
    );

    // Redirect user to OAuth provider
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('[OAuth Authorize] Error:', error);

    const message = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: `Authorization failed: ${message}` },
      { status: 500 }
    );
  }
}
