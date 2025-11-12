/**
 * OAuth Callback Endpoint
 *
 * Handles OAuth callback from provider after user authorization
 * GET /api/auth/oauth/{provider}/callback?code=xxx&state=xxx
 *
 * Phase: 0.2 - MCP Registry & Integrations
 */

import { NextRequest, NextResponse } from 'next/server';
import { OAuthService } from '@/lib/services/OAuthService';
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const { provider } = params;
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      const errorDescription = searchParams.get('error_description') || error;
      console.error(`[OAuth Callback] Provider error: ${error} - ${errorDescription}`);

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
      return NextResponse.redirect(
        `${baseUrl}/settings/integrations?error=${encodeURIComponent(errorDescription)}`
      );
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing code or state parameter' },
        { status: 400 }
      );
    }

    // Parse and validate state
    let stateData: { userId: string; integrationSlug: string };
    try {
      stateData = OAuthService.parseState(state);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired state parameter' },
        { status: 400 }
      );
    }

    const { userId, integrationSlug } = stateData;

    // Get integration details
    const supabase = createServiceRoleClient();
    const { data: integration, error: integrationError } = await supabase
      .from('mcp_integrations')
      .select('*')
      .eq('slug', integrationSlug)
      .single();

    if (integrationError || !integration) {
      return NextResponse.json(
        { error: `Integration not found: ${integrationSlug}` },
        { status: 404 }
      );
    }

    // Get user integration record
    const { data: userIntegration, error: userIntError } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('integration_id', integration.id)
      .is('deleted_at', null)
      .single();

    if (userIntError || !userIntegration) {
      return NextResponse.json(
        { error: 'User integration record not found' },
        { status: 404 }
      );
    }

    // Build redirect URI
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const redirectUri = `${baseUrl}/api/auth/oauth/${provider}/callback`;

    // Exchange code for tokens
    const credentials = await OAuthService.exchangeCodeForTokens(
      provider,
      integrationSlug,
      code,
      redirectUri
    );

    // Store tokens in database (encrypted)
    await OAuthService.storeTokens(
      userIntegration.id,
      userId,
      credentials
    );

    console.log(`[OAuth Callback] Successfully authorized ${integrationSlug} for user ${userId}`);

    // Redirect to success page
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?success=${encodeURIComponent(integration.name + ' connected successfully')}`
    );
  } catch (error) {
    console.error('[OAuth Callback] Error:', error);

    const message = error instanceof Error ? error.message : 'Unknown error';

    // Redirect to error page
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?error=${encodeURIComponent('Failed to connect: ' + message)}`
    );
  }
}
