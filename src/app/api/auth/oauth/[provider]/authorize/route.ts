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
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const { provider } = params;
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

    // Check if integration exists and is enabled
    const { data: integration, error: integrationError } = await supabase
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

    // Check if user already has this integration
    const { data: existingIntegration } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('integration_id', integration.id)
      .is('deleted_at', null)
      .single();

    let userIntegrationId: string;

    if (existingIntegration) {
      // Update existing integration to pending
      userIntegrationId = existingIntegration.id;
      await supabase
        .from('user_integrations')
        .update({
          status: 'pending',
          error_message: null,
        })
        .eq('id', userIntegrationId);
    } else {
      // Create new user integration record
      const { data: newIntegration, error: createError } = await supabase
        .from('user_integrations')
        .insert({
          user_id: user.id,
          integration_id: integration.id,
          status: 'pending',
        })
        .select()
        .single();

      if (createError || !newIntegration) {
        return NextResponse.json(
          { error: 'Failed to create integration record' },
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
      user.id,
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
