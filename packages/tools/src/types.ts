/**
 * Unified Tool Types
 *
 * Tools are organized by platform within Human-OS:
 * - core: Shared tools available to all platforms
 * - founder: Founder OS personal productivity tools
 * - guyforthat: GFT CRM and contact management tools
 * - powerpak: Expert/skills marketplace tools
 * - voice: Voice profile and content generation tools
 */

import { z } from 'zod';
import type { OperationContext } from '@human-os/core';

/**
 * Human-OS Platforms
 * Each platform owns a set of tools, access controlled by subscription
 */
export type Platform = 'core' | 'founder' | 'guyforthat' | 'powerpak' | 'voice';

/**
 * Subscription tiers that gate tool access
 */
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

/**
 * User's platform access - returned from auth validation
 */
export interface PlatformAccess {
  /** Platforms the user has access to */
  platforms: Platform[];
  /** User's subscription tier */
  tier: SubscriptionTier;
  /** User ID (validated, not just claimed) */
  userId: string;
}

/**
 * Context passed to all tool handlers.
 * Works for both MCP and REST - transport agnostic.
 * Alias for OperationContext for backwards compatibility.
 */
export type ToolContext = OperationContext;

// Re-export for consumers that import from tools
export type { OperationContext } from '@human-os/core';

/**
 * Tool handler function
 */
export type ToolHandler<TInput, TOutput> = (
  ctx: ToolContext,
  input: TInput
) => Promise<TOutput>;

/**
 * REST endpoint configuration
 */
export interface RESTConfig {
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** Path relative to /v1 (e.g., '/tasks' or '/tasks/:id') */
  path: string;
  /** Required scope (default: 'founder-os:read' for GET, 'founder-os:write' for others) */
  scope?: string;
}

/**
 * Alias configuration for do() integration
 */
export interface AliasConfig {
  /** Pattern with {variables} */
  pattern: string;
  /** Priority (lower = higher priority) */
  priority?: number;
  /** Context modes where this alias is available */
  context?: string[];
}

/**
 * MCP tool schema format
 */
export interface MCPToolSchema {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Complete tool definition
 */
export interface ToolDefinition<TInput = unknown, TOutput = unknown> {
  /** Unique tool name (e.g., 'add_task') */
  name: string;

  /** Human-readable description */
  description: string;

  /** Zod schema for input validation */
  input: z.ZodType<TInput>;

  /** The actual implementation */
  handler: ToolHandler<TInput, TOutput>;

  /**
   * Platform that owns this tool
   * - core: Available to all users
   * - founder: Founder OS subscribers
   * - guyforthat: GFT CRM subscribers
   * - powerpak: PowerPak subscribers
   * - voice: Voice platform subscribers
   */
  platform: Platform;

  /**
   * Minimum subscription tier required (default: 'free')
   * - free: Available to all users of the platform
   * - pro: Requires pro subscription
   * - enterprise: Requires enterprise subscription
   */
  requiredTier?: SubscriptionTier;

  /** REST endpoint config (optional - if omitted, no REST endpoint) */
  rest?: RESTConfig;

  /** Alias config for do() (optional - if omitted, only direct invocation) */
  alias?: AliasConfig;

  /** Category for grouping (e.g., 'tasks', 'queue', 'search') */
  category?: string;
}

/**
 * Registered tool with computed properties
 */
export interface RegisteredTool<TInput = unknown, TOutput = unknown>
  extends ToolDefinition<TInput, TOutput> {
  /** MCP-compatible tool schema */
  mcpSchema: MCPToolSchema;
}
