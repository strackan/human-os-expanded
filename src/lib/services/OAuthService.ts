/**
 * OAuth Service
 *
 * Generic OAuth 2.0 service for handling multiple providers
 * (Google, Slack, Microsoft, etc.)
 *
 * Phase: 0.2 - MCP Registry & Integrations
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import { encrypt, decrypt } from '@/lib/utils/crypto';
import type {
  OAuthProvider,
  OAuthCredentials,
  DecryptedOAuthToken,
  UserIntegration,
} from '@/types/mcp';

// OAuth Provider Configuration
interface OAuthConfig {
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientId: string;
  clientSecret: string;
}

/**
 * OAuth provider configurations
 */
const OAUTH_CONFIGS: Record<string, Omit<OAuthConfig, 'clientId' | 'clientSecret'>> = {
  google: {
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: [], // Will be set per integration (Calendar, Gmail)
  },
  slack: {
    authorizationUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    scopes: [], // Will be set per integration
  },
  microsoft: {
    authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: [],
  },
};

/**
 * OAuth Service
 */
export class OAuthService {
  /**
   * Generate OAuth authorization URL
   *
   * @param provider - OAuth provider (google, slack, etc.)
   * @param integrationSlug - Integration slug (google-calendar, slack, etc.)
   * @param userId - User ID
   * @param redirectUri - Callback URL
   * @returns Authorization URL to redirect user to
   */
  static async getAuthorizationUrl(
    provider: string,
    integrationSlug: string,
    userId: string,
    redirectUri: string
  ): Promise<string> {
    const supabase = createServiceRoleClient();

    // Get integration details from database
    const { data: integration, error } = await supabase
      .from('mcp_integrations')
      .select('*')
      .eq('slug', integrationSlug)
      .eq('status', 'enabled')
      .single();

    if (error || !integration) {
      throw new Error(`Integration not found or not enabled: ${integrationSlug}`);
    }

    // Get OAuth configuration
    const config = OAUTH_CONFIGS[provider];
    if (!config) {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }

    // Get credentials from environment
    const clientId = this.getClientId(provider, integrationSlug);
    const clientSecret = this.getClientSecret(provider, integrationSlug);

    if (!clientId || !clientSecret) {
      throw new Error(`OAuth credentials not configured for ${provider}`);
    }

    // Generate state parameter for CSRF protection
    const state = this.generateState(userId, integrationSlug);

    // Build authorization URL
    const scopes = integration.oauth_scopes || config.scopes;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      state,
      access_type: 'offline', // For refresh tokens
      prompt: 'consent', // Force consent to get refresh token
    });

    return `${config.authorizationUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   *
   * @param provider - OAuth provider
   * @param integrationSlug - Integration slug
   * @param code - Authorization code from OAuth callback
   * @param redirectUri - Callback URL (must match)
   * @returns OAuth credentials (access token, refresh token, etc.)
   */
  static async exchangeCodeForTokens(
    provider: string,
    integrationSlug: string,
    code: string,
    redirectUri: string
  ): Promise<OAuthCredentials> {
    const config = OAUTH_CONFIGS[provider];
    if (!config) {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }

    const clientId = this.getClientId(provider, integrationSlug);
    const clientSecret = this.getClientSecret(provider, integrationSlug);

    if (!clientId || !clientSecret) {
      throw new Error(`OAuth credentials not configured for ${provider}`);
    }

    // Exchange code for tokens
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    const data = await response.json();

    if (!data.access_token) {
      throw new Error(`No access_token in response: ${JSON.stringify(data)}`);
    }

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type || 'Bearer',
      expires_in: data.expires_in,
      scope: data.scope,
    };
  }

  /**
   * Refresh an expired access token
   *
   * @param provider - OAuth provider
   * @param integrationSlug - Integration slug
   * @param refreshToken - Refresh token
   * @returns New OAuth credentials
   */
  static async refreshAccessToken(
    provider: string,
    integrationSlug: string,
    refreshToken: string
  ): Promise<OAuthCredentials> {
    const config = OAUTH_CONFIGS[provider];
    if (!config) {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }

    const clientId = this.getClientId(provider, integrationSlug);
    const clientSecret = this.getClientSecret(provider, integrationSlug);

    if (!clientId || !clientSecret) {
      throw new Error(`OAuth credentials not configured for ${provider}`);
    }

    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed: ${error}`);
    }

    const data = await response.json();

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken, // Some providers don't return new refresh token
      token_type: data.token_type || 'Bearer',
      expires_in: data.expires_in,
      scope: data.scope,
    };
  }

  /**
   * Store OAuth tokens in database (encrypted)
   *
   * @param userIntegrationId - User integration ID
   * @param userId - User ID
   * @param credentials - OAuth credentials to store
   */
  static async storeTokens(
    userIntegrationId: string,
    userId: string,
    credentials: OAuthCredentials
  ): Promise<void> {
    const supabase = createServiceRoleClient();

    // Get encryption key from environment
    const encryptionKey = process.env.OAUTH_ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('OAUTH_ENCRYPTION_KEY not configured');
    }

    // Calculate expiration timestamp
    const expiresAt = credentials.expires_in
      ? new Date(Date.now() + credentials.expires_in * 1000).toISOString()
      : null;

    // Encrypt tokens using Node.js crypto
    const encryptedAccess = encrypt(credentials.access_token, encryptionKey);

    let encryptedRefresh = null;
    if (credentials.refresh_token) {
      encryptedRefresh = encrypt(credentials.refresh_token, encryptionKey);
    }

    // Upsert token record
    const { error: upsertError } = await supabase
      .from('oauth_tokens')
      .upsert({
        user_integration_id: userIntegrationId,
        user_id: userId,
        access_token_encrypted: encryptedAccess,
        refresh_token_encrypted: encryptedRefresh,
        token_type: credentials.token_type,
        expires_at: expiresAt,
        scope: credentials.scope,
        last_refreshed_at: new Date().toISOString(),
      });

    if (upsertError) {
      throw new Error(`Failed to store tokens: ${upsertError.message}`);
    }

    // Update user_integration status to active
    await supabase
      .from('user_integrations')
      .update({
        status: 'active',
        last_used_at: new Date().toISOString(),
        error_message: null,
        error_count: 0,
      })
      .eq('id', userIntegrationId);
  }

  /**
   * Retrieve and decrypt OAuth tokens for a user integration
   *
   * @param userIntegrationId - User integration ID
   * @returns Decrypted OAuth token or null if not found
   */
  static async getTokens(userIntegrationId: string): Promise<DecryptedOAuthToken | null> {
    const supabase = createServiceRoleClient();

    const { data: token, error } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('user_integration_id', userIntegrationId)
      .is('deleted_at', null)
      .single();

    if (error || !token) {
      return null;
    }

    // Get encryption key
    const encryptionKey = process.env.OAUTH_ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('OAUTH_ENCRYPTION_KEY not configured');
    }

    // Decrypt access token using Node.js crypto
    const accessToken = decrypt(token.access_token_encrypted, encryptionKey);

    // Decrypt refresh token if present
    let refreshToken = null;
    if (token.refresh_token_encrypted) {
      refreshToken = decrypt(token.refresh_token_encrypted, encryptionKey);
    }

    return {
      id: token.id,
      user_integration_id: token.user_integration_id,
      user_id: token.user_id,
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: token.token_type,
      expires_at: token.expires_at,
      scope: token.scope,
      created_at: token.created_at,
      updated_at: token.updated_at,
      last_refreshed_at: token.last_refreshed_at,
      deleted_at: token.deleted_at,
    };
  }

  /**
   * Check if token is expired and refresh if needed
   *
   * @param userIntegrationId - User integration ID
   * @param provider - OAuth provider
   * @param integrationSlug - Integration slug
   * @returns Valid access token
   */
  static async getValidAccessToken(
    userIntegrationId: string,
    provider: string,
    integrationSlug: string
  ): Promise<string> {
    const tokens = await this.getTokens(userIntegrationId);

    if (!tokens) {
      throw new Error('No tokens found for integration');
    }

    // Check if token is expired (with 5 minute buffer)
    const isExpired = tokens.expires_at
      ? new Date(tokens.expires_at).getTime() < Date.now() + 5 * 60 * 1000
      : false;

    if (isExpired && tokens.refresh_token) {
      // Refresh the token
      const newCredentials = await this.refreshAccessToken(
        provider,
        integrationSlug,
        tokens.refresh_token
      );

      // Store new tokens
      await this.storeTokens(userIntegrationId, tokens.user_id, newCredentials);

      return newCredentials.access_token;
    }

    return tokens.access_token;
  }

  /**
   * Generate state parameter for CSRF protection
   */
  private static generateState(userId: string, integrationSlug: string): string {
    const data = {
      userId,
      integrationSlug,
      timestamp: Date.now(),
      nonce: Math.random().toString(36).substring(7),
    };

    return Buffer.from(JSON.stringify(data)).toString('base64url');
  }

  /**
   * Parse and validate state parameter
   */
  static parseState(state: string): { userId: string; integrationSlug: string } {
    try {
      const decoded = Buffer.from(state, 'base64url').toString('utf-8');
      const data = JSON.parse(decoded);

      // Validate timestamp (state expires after 10 minutes)
      if (Date.now() - data.timestamp > 10 * 60 * 1000) {
        throw new Error('State expired');
      }

      return {
        userId: data.userId,
        integrationSlug: data.integrationSlug,
      };
    } catch (error) {
      throw new Error('Invalid state parameter');
    }
  }

  /**
   * Get client ID from environment for a provider
   */
  private static getClientId(provider: string, integrationSlug: string): string {
    // Try integration-specific first, then provider-level
    const integrationKey = `OAUTH_${integrationSlug.toUpperCase().replace(/-/g, '_')}_CLIENT_ID`;
    const providerKey = `OAUTH_${provider.toUpperCase()}_CLIENT_ID`;

    return process.env[integrationKey] || process.env[providerKey] || '';
  }

  /**
   * Get client secret from environment for a provider
   */
  private static getClientSecret(provider: string, integrationSlug: string): string {
    const integrationKey = `OAUTH_${integrationSlug.toUpperCase().replace(/-/g, '_')}_CLIENT_SECRET`;
    const providerKey = `OAUTH_${provider.toUpperCase()}_CLIENT_SECRET`;

    return process.env[integrationKey] || process.env[providerKey] || '';
  }
}
