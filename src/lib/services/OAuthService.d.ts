/**
 * OAuth Service
 *
 * Generic OAuth 2.0 service for handling multiple providers
 * (Google, Slack, Microsoft, etc.)
 *
 * Phase: 0.2 - MCP Registry & Integrations
 */
import type { OAuthCredentials, DecryptedOAuthToken } from '@/types/mcp';
/**
 * OAuth Service
 */
export declare class OAuthService {
    /**
     * Generate OAuth authorization URL
     *
     * @param provider - OAuth provider (google, slack, etc.)
     * @param integrationSlug - Integration slug (google-calendar, slack, etc.)
     * @param userId - User ID
     * @param redirectUri - Callback URL
     * @returns Authorization URL to redirect user to
     */
    static getAuthorizationUrl(provider: string, integrationSlug: string, userId: string, redirectUri: string): Promise<string>;
    /**
     * Exchange authorization code for tokens
     *
     * @param provider - OAuth provider
     * @param integrationSlug - Integration slug
     * @param code - Authorization code from OAuth callback
     * @param redirectUri - Callback URL (must match)
     * @returns OAuth credentials (access token, refresh token, etc.)
     */
    static exchangeCodeForTokens(provider: string, integrationSlug: string, code: string, redirectUri: string): Promise<OAuthCredentials>;
    /**
     * Refresh an expired access token
     *
     * @param provider - OAuth provider
     * @param integrationSlug - Integration slug
     * @param refreshToken - Refresh token
     * @returns New OAuth credentials
     */
    static refreshAccessToken(provider: string, integrationSlug: string, refreshToken: string): Promise<OAuthCredentials>;
    /**
     * Store OAuth tokens in database (encrypted)
     *
     * @param userIntegrationId - User integration ID
     * @param userId - User ID
     * @param credentials - OAuth credentials to store
     */
    static storeTokens(userIntegrationId: string, userId: string, credentials: OAuthCredentials): Promise<void>;
    /**
     * Retrieve and decrypt OAuth tokens for a user integration
     *
     * @param userIntegrationId - User integration ID
     * @returns Decrypted OAuth token or null if not found
     */
    static getTokens(userIntegrationId: string): Promise<DecryptedOAuthToken | null>;
    /**
     * Check if token is expired and refresh if needed
     *
     * @param userIntegrationId - User integration ID
     * @param provider - OAuth provider
     * @param integrationSlug - Integration slug
     * @returns Valid access token
     */
    static getValidAccessToken(userIntegrationId: string, provider: string, integrationSlug: string): Promise<string>;
    /**
     * Generate state parameter for CSRF protection
     */
    private static generateState;
    /**
     * Parse and validate state parameter
     */
    static parseState(state: string): {
        userId: string;
        integrationSlug: string;
    };
    /**
     * Get client ID from environment for a provider
     */
    private static getClientId;
    /**
     * Get client secret from environment for a provider
     */
    private static getClientSecret;
}
//# sourceMappingURL=OAuthService.d.ts.map