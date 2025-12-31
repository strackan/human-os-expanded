/**
 * Tool Registry
 *
 * Central registry for all tools. Provides:
 * - MCP tool definitions
 * - Express router generation
 * - Direct invocation for do()
 */

import { z } from 'zod';
import type { Router, Request, Response, NextFunction } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ToolDefinition,
  RegisteredTool,
  ToolContext,
  MCPToolSchema,
  Platform,
  PlatformAccess,
  SubscriptionTier,
} from './types.js';

/**
 * Tier hierarchy for access checking
 */
const TIER_LEVELS: Record<SubscriptionTier, number> = {
  free: 0,
  pro: 1,
  enterprise: 2,
};

/**
 * Check if user's tier satisfies the required tier
 */
function tierSatisfies(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  return TIER_LEVELS[userTier] >= TIER_LEVELS[requiredTier];
}

/**
 * Convert Zod schema to JSON Schema (simplified)
 */
function zodToJsonSchema(schema: z.ZodType): Record<string, unknown> {
  // Handle ZodObject
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      const zodField = value as z.ZodType;
      properties[key] = zodFieldToJsonSchema(zodField);

      // Check if required (not optional)
      if (!(zodField instanceof z.ZodOptional)) {
        required.push(key);
      }
    }

    return {
      type: 'object',
      properties,
      ...(required.length > 0 ? { required } : {}),
    };
  }

  return { type: 'object', properties: {} };
}

function zodFieldToJsonSchema(field: z.ZodType): Record<string, unknown> {
  // Unwrap optional
  if (field instanceof z.ZodOptional) {
    return zodFieldToJsonSchema(field._def.innerType);
  }

  // Handle primitives
  if (field instanceof z.ZodString) {
    return { type: 'string' };
  }
  if (field instanceof z.ZodNumber) {
    return { type: 'number' };
  }
  if (field instanceof z.ZodBoolean) {
    return { type: 'boolean' };
  }

  // Handle enum
  if (field instanceof z.ZodEnum) {
    return { type: 'string', enum: field._def.values };
  }

  // Handle array
  if (field instanceof z.ZodArray) {
    return {
      type: 'array',
      items: zodFieldToJsonSchema(field._def.type),
    };
  }

  // Handle object
  if (field instanceof z.ZodObject) {
    return zodToJsonSchema(field);
  }

  // Handle record
  if (field instanceof z.ZodRecord) {
    return { type: 'object' };
  }

  // Default
  return { type: 'string' };
}

/**
 * Tool Registry - singleton that holds all tool definitions
 */
export class ToolRegistry {
  private tools: Map<string, RegisteredTool> = new Map();

  /**
   * Register a tool
   */
  register<TInput, TOutput>(def: ToolDefinition<TInput, TOutput>): RegisteredTool<TInput, TOutput> {
    const mcpSchema: MCPToolSchema = {
      name: def.name,
      description: def.description,
      inputSchema: zodToJsonSchema(def.input) as MCPToolSchema['inputSchema'],
    };

    const registered: RegisteredTool<TInput, TOutput> = {
      ...def,
      mcpSchema,
    };

    this.tools.set(def.name, registered as RegisteredTool);
    return registered;
  }

  /**
   * Get a tool by name
   */
  get(name: string): RegisteredTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all tools
   */
  getAll(): RegisteredTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get MCP tool definitions
   */
  getMCPTools(): MCPToolSchema[] {
    return this.getAll().map((t) => t.mcpSchema);
  }

  /**
   * Invoke a tool by name
   */
  async invoke(name: string, input: unknown, ctx: ToolContext): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }

    // Validate input
    const validated = tool.input.parse(input);

    // Execute handler
    return tool.handler(ctx, validated);
  }

  /**
   * Handle an MCP tool call
   * Returns result if handled, null if not found
   */
  async handleMCP(
    name: string,
    args: Record<string, unknown>,
    ctx: ToolContext
  ): Promise<unknown | null> {
    const tool = this.tools.get(name);
    if (!tool) return null;

    const validated = tool.input.parse(args);
    return tool.handler(ctx, validated);
  }

  /**
   * Generate Express router for all tools with REST config
   */
  getExpressRouter(
    supabase: SupabaseClient,
    requireScope: (scope: string) => (req: Request, res: Response, next: NextFunction) => void
  ): Router {
    // Dynamic import to avoid requiring express as dependency
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Router } = require('express') as { Router: () => Router };
    const router = Router();

    for (const tool of this.getAll()) {
      if (!tool.rest) continue;

      const { method, path, scope } = tool.rest;
      const defaultScope = method === 'GET' ? 'founder-os:read' : 'founder-os:write';
      const requiredScope = scope || defaultScope;

      const handler = async (req: Request, res: Response) => {
        try {
          // Get user from API key (attached by auth middleware)
          const apiKeyData = (req as Request & { apiKey?: { ownerId?: string } }).apiKey;
          const userId = apiKeyData?.ownerId;
          if (!userId) {
            return res.status(401).json({ error: 'User ID not found' });
          }

          // Build input from body (POST/PUT) or query (GET)
          const input = method === 'GET' ? req.query : req.body;

          // Merge path params (e.g., :id)
          const fullInput = { ...input, ...req.params };

          // Validate
          const validated = tool.input.parse(fullInput);

          // Build context
          const ctx: ToolContext = {
            supabase,
            userId,
            layer: `founder:${userId}`,
          };

          // Execute
          const result = await tool.handler(ctx, validated);

          return res.json(result);
        } catch (error) {
          if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.errors });
          }
          const message = error instanceof Error ? error.message : 'Unknown error';
          return res.status(500).json({ error: message });
        }
      };

      // Register route
      const routeMethod = method.toLowerCase() as 'get' | 'post' | 'put' | 'delete' | 'patch';
      router[routeMethod](path, requireScope(requiredScope), handler);
    }

    return router;
  }

  /**
   * Get tools by category
   */
  getByCategory(category: string): RegisteredTool[] {
    return this.getAll().filter((t) => t.category === category);
  }

  /**
   * Get tools that have REST endpoints
   */
  getRESTTools(): RegisteredTool[] {
    return this.getAll().filter((t) => t.rest);
  }

  /**
   * Get tools that have alias patterns
   */
  getAliasTools(): RegisteredTool[] {
    return this.getAll().filter((t) => t.alias);
  }

  // ===========================================================================
  // PLATFORM ACCESS CONTROL
  // ===========================================================================

  /**
   * Get tools for specific platforms
   */
  getByPlatforms(platforms: Platform[]): RegisteredTool[] {
    return this.getAll().filter((t) => platforms.includes(t.platform));
  }

  /**
   * Get tools by single platform
   */
  getByPlatform(platform: Platform): RegisteredTool[] {
    return this.getAll().filter((t) => t.platform === platform);
  }

  /**
   * Check if user has access to a specific tool
   */
  hasAccess(toolName: string, access: PlatformAccess): boolean {
    const tool = this.tools.get(toolName);
    if (!tool) return false;

    // Check platform access
    if (!access.platforms.includes(tool.platform)) {
      return false;
    }

    // Check tier (default to 'free' if not specified)
    const requiredTier = tool.requiredTier || 'free';
    return tierSatisfies(access.tier, requiredTier);
  }

  /**
   * Get all tools the user has access to
   */
  getAccessibleTools(access: PlatformAccess): RegisteredTool[] {
    return this.getAll().filter((tool) => {
      // Check platform
      if (!access.platforms.includes(tool.platform)) {
        return false;
      }
      // Check tier
      const requiredTier = tool.requiredTier || 'free';
      return tierSatisfies(access.tier, requiredTier);
    });
  }

  /**
   * Get MCP tool schemas filtered by user access
   * This is what gets returned in ListToolsRequest
   */
  getMCPToolsForAccess(access: PlatformAccess): MCPToolSchema[] {
    return this.getAccessibleTools(access).map((t) => t.mcpSchema);
  }

  /**
   * Handle an MCP tool call with access control
   * Returns result if authorized, throws if not
   */
  async handleMCPWithAccess(
    name: string,
    args: Record<string, unknown>,
    ctx: ToolContext,
    access: PlatformAccess
  ): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }

    // Check access
    if (!this.hasAccess(name, access)) {
      throw new Error(
        `Access denied: Tool '${name}' requires ${tool.platform} platform access`
      );
    }

    const validated = tool.input.parse(args);
    return tool.handler(ctx, validated);
  }
}

// Singleton registry
let globalRegistry: ToolRegistry | null = null;

export function getRegistry(): ToolRegistry {
  if (!globalRegistry) {
    globalRegistry = new ToolRegistry();
  }
  return globalRegistry;
}

/**
 * Define and register a tool
 */
export function defineTool<TInput, TOutput>(
  def: ToolDefinition<TInput, TOutput>
): RegisteredTool<TInput, TOutput> {
  return getRegistry().register(def);
}
