/**
 * MCP (Model Context Protocol) Types
 *
 * These types match the database structure defined in:
 * - Migration: 20251112000000_mcp_registry_infrastructure.sql
 * - Tables: mcp_integrations, user_integrations, oauth_tokens
 *
 * Phase: 0.2 - MCP Registry & Integrations
 * Issue: #2
 */

// ============================================================================
// Enums and Constants
// ============================================================================

export type MCPIntegrationStatus = 'disabled' | 'enabled' | 'deprecated';
export type MCPConnectionType = 'oauth2' | 'api_key' | 'webhook';
export type MCPCategory = 'calendar' | 'communication' | 'crm' | 'email' | 'productivity' | 'storage';
export type UserIntegrationStatus = 'pending' | 'active' | 'error' | 'revoked';

export type OAuthProvider = 'google' | 'microsoft' | 'slack' | 'salesforce' | 'hubspot';

// ============================================================================
// Core Database Tables
// ============================================================================

/**
 * MCP Integration - Registry entry for available marketplace integrations
 */
export interface MCPIntegration {
  id: string;

  // Identity
  slug: string; // 'google-calendar', 'slack', 'gmail'
  name: string; // 'Google Calendar'
  description?: string;
  category: MCPCategory;

  // Connection Config
  connection_type: MCPConnectionType;
  oauth_provider?: OAuthProvider;
  oauth_scopes?: string[];
  config_schema?: Record<string, any>; // JSON schema for config

  // Marketplace Status
  status: MCPIntegrationStatus;
  approval_required: boolean;

  // Metadata
  icon_url?: string;
  documentation_url?: string;
  vendor?: string; // 'Google', 'Slack', 'Renubu'
  version: string;

  // Audit
  created_at: string;
  updated_at: string;
  created_by?: string;
  deleted_at?: string;
}

/**
 * User Integration - Tracks user-installed integrations
 */
export interface UserIntegration {
  id: string;

  // Relationships
  user_id: string;
  integration_id: string;

  // Status
  status: UserIntegrationStatus;
  installed_at?: string;
  last_used_at?: string;

  // Configuration
  config?: Record<string, any>; // User-specific settings

  // Error Tracking
  error_message?: string;
  error_count: number;
  last_error_at?: string;

  // Audit
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

/**
 * OAuth Token - Encrypted token storage
 *
 * Note: Tokens are encrypted at rest using pgcrypto.
 * Use encrypt_oauth_token() and decrypt_oauth_token() functions.
 */
export interface OAuthToken {
  id: string;

  // Relationships
  user_integration_id: string;
  user_id: string;

  // Encrypted Tokens (stored as BYTEA in database)
  access_token_encrypted: Uint8Array;
  refresh_token_encrypted?: Uint8Array;

  // Token Metadata
  token_type: string; // 'Bearer'
  expires_at?: string;
  scope?: string;

  // Audit
  created_at: string;
  updated_at: string;
  last_refreshed_at?: string;
  deleted_at?: string;
}

// ============================================================================
// Extended Types with Joins
// ============================================================================

/**
 * User Integration with full integration details
 */
export interface UserIntegrationWithDetails extends UserIntegration {
  integration: MCPIntegration;
}

/**
 * User Integration with OAuth token status
 */
export interface UserIntegrationWithToken extends UserIntegration {
  has_valid_token: boolean;
  token_expires_at?: string;
}

/**
 * Complete user integration view (integration + token status)
 */
export interface UserIntegrationComplete extends UserIntegration {
  integration: MCPIntegration;
  has_valid_token: boolean;
  token_expires_at?: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Request to install an integration for a user
 */
export interface InstallIntegrationRequest {
  integration_id: string;
  config?: Record<string, any>;
}

/**
 * Response after installing an integration
 */
export interface InstallIntegrationResponse {
  user_integration: UserIntegration;
  authorization_url?: string; // For OAuth flow
}

/**
 * OAuth callback data
 */
export interface OAuthCallbackData {
  code: string;
  state?: string;
  user_integration_id: string;
}

/**
 * Stored OAuth credentials
 */
export interface OAuthCredentials {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in?: number;
  scope?: string;
}

/**
 * Request to update integration status
 */
export interface UpdateIntegrationStatusRequest {
  status: UserIntegrationStatus;
  error_message?: string;
}

/**
 * Admin approval request
 */
export interface ApproveIntegrationRequest {
  integration_id: string;
  approved: boolean;
  reason?: string;
}

// ============================================================================
// Filter and Query Types
// ============================================================================

/**
 * Filters for querying user integrations
 */
export interface UserIntegrationFilters {
  status?: UserIntegrationStatus;
  category?: MCPCategory;
  integration_id?: string;
  has_errors?: boolean;
}

/**
 * Filters for querying marketplace integrations
 */
export interface MCPIntegrationFilters {
  status?: MCPIntegrationStatus;
  category?: MCPCategory;
  connection_type?: MCPConnectionType;
  search?: string;
}

/**
 * List response for user integrations
 */
export interface UserIntegrationsListResponse {
  integrations: UserIntegrationComplete[];
  total: number;
  page: number;
  limit: number;
}

/**
 * List response for marketplace integrations
 */
export interface MCPIntegrationsListResponse {
  integrations: MCPIntegration[];
  total: number;
  page: number;
  limit: number;
}

// ============================================================================
// Admin Types
// ============================================================================

/**
 * Admin integration management
 */
export interface AdminIntegrationUpdate {
  status?: MCPIntegrationStatus;
  approval_required?: boolean;
  config_schema?: Record<string, any>;
  version?: string;
}

/**
 * Integration usage stats (for admin dashboard)
 */
export interface IntegrationUsageStats {
  integration_id: string;
  integration_name: string;
  total_installations: number;
  active_installations: number;
  error_count: number;
  last_7_days_usage: number;
}

// ============================================================================
// Encryption Helper Types
// ============================================================================

/**
 * Token encryption service interface
 */
export interface TokenEncryptionService {
  encrypt(token: string, key: string): Promise<Uint8Array>;
  decrypt(encryptedToken: Uint8Array, key: string): Promise<string>;
}

/**
 * OAuth token with plaintext values (decrypted)
 * Used internally, never sent to client
 */
export interface DecryptedOAuthToken extends Omit<OAuthToken, 'access_token_encrypted' | 'refresh_token_encrypted'> {
  access_token: string;
  refresh_token?: string;
}
