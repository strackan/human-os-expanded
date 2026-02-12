/**
 * OAuth utilities for MCP server
 * Handles token retrieval, decryption, and refresh
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { decrypt } from './crypto.js';

// Get encryption key from environment
const ENCRYPTION_KEY = process.env.OAUTH_ENCRYPTION_KEY || '';

interface RefreshResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

/**
 * Get valid access token for a user integration
 * Handles decryption and automatic refresh if expired
 */
export async function getValidAccessToken(
  supabase: SupabaseClient,
  userId: string,
  integrationSlug: string
): Promise<string> {
  if (!ENCRYPTION_KEY) {
    throw new Error('OAUTH_ENCRYPTION_KEY not configured');
  }

  // Get integration ID
  const { data: integration } = await supabase
    .from('mcp_integrations')
    .select('id')
    .eq('slug', integrationSlug)
    .single();

  if (!integration) {
    throw new Error(`Integration not found: ${integrationSlug}`);
  }

  // Get user integration
  const { data: userIntegration } = await supabase
    .from('user_integrations')
    .select('id')
    .eq('user_id', userId)
    .eq('integration_id', integration.id)
    .eq('status', 'active')
    .is('deleted_at', null)
    .single();

  if (!userIntegration) {
    throw new Error(`${integrationSlug} not connected for this user`);
  }

  // Get OAuth tokens
  const { data: tokenRow } = await supabase
    .from('oauth_tokens')
    .select('*')
    .eq('user_integration_id', userIntegration.id)
    .is('deleted_at', null)
    .single();

  if (!tokenRow || !tokenRow.access_token_encrypted) {
    throw new Error('No OAuth tokens found');
  }

  // Decrypt tokens
  const accessToken = decrypt(tokenRow.access_token_encrypted, ENCRYPTION_KEY);
  const refreshToken = tokenRow.refresh_token_encrypted
    ? decrypt(tokenRow.refresh_token_encrypted, ENCRYPTION_KEY)
    : null;

  // Check if expired (with 5 minute buffer)
  const isExpired = tokenRow.expires_at
    ? new Date(tokenRow.expires_at).getTime() < Date.now() + 5 * 60 * 1000
    : false;

  if (isExpired && refreshToken) {
    console.log(`[OAuth] Token expired for ${integrationSlug}, refreshing...`);

    // Refresh the token
    const newTokens = await refreshGoogleToken(refreshToken);

    // Store new tokens (encrypted)
    await storeRefreshedTokens(
      supabase,
      userIntegration.id,
      userId,
      newTokens,
      ENCRYPTION_KEY
    );

    return newTokens.access_token;
  }

  return accessToken;
}

/**
 * Refresh a Google OAuth token
 */
async function refreshGoogleToken(refreshToken: string): Promise<RefreshResponse> {
  // Check multiple env var naming conventions
  const clientId = process.env.OAUTH_GOOGLE_CLIENT_ID
    || process.env.SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.OAUTH_GOOGLE_CLIENT_SECRET
    || process.env.SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured. Set OAUTH_GOOGLE_CLIENT_ID and OAUTH_GOOGLE_CLIENT_SECRET');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
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
    refresh_token: data.refresh_token || refreshToken, // Google may not return new refresh token
    expires_in: data.expires_in,
    token_type: data.token_type,
    scope: data.scope,
  };
}

/**
 * Store refreshed tokens back to database
 */
async function storeRefreshedTokens(
  supabase: SupabaseClient,
  userIntegrationId: string,
  userId: string,
  tokens: RefreshResponse,
  encryptionKey: string
): Promise<void> {
  // We need to encrypt the new tokens - import crypto encrypt
  const crypto = await import('crypto');

  const encryptedAccess = encryptToken(tokens.access_token, encryptionKey, crypto);

  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null;

  await supabase
    .from('oauth_tokens')
    .update({
      access_token_encrypted: encryptedAccess,
      expires_at: expiresAt,
      last_refreshed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_integration_id', userIntegrationId);

  // Update last_used_at on user_integrations
  await supabase
    .from('user_integrations')
    .update({
      last_used_at: new Date().toISOString(),
    })
    .eq('id', userIntegrationId);

  console.log(`[OAuth] Tokens refreshed and stored for integration ${userIntegrationId}`);
}

/**
 * Encrypt a token (matches src/lib/utils/crypto.ts)
 */
function encryptToken(text: string, password: string, crypto: typeof import('crypto')): string {
  const ALGORITHM = 'aes-256-gcm';
  const IV_LENGTH = 16;
  const SALT_LENGTH = 64;
  const KEY_LENGTH = 32;
  const ITERATIONS = 100000;

  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512');

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  const result = Buffer.concat([salt, iv, tag, encrypted]);
  return result.toString('base64');
}
