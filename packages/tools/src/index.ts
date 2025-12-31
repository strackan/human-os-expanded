/**
 * @human-os/tools
 *
 * Unified Tool Registry with Platform Access Control
 *
 * Define a tool ONCE, get:
 * - MCP tool definition (for Claude Desktop)
 * - REST endpoint handler (for mobile/web)
 * - do() integration (for natural language routing)
 * - Platform-based access control
 *
 * Platforms:
 * - core: Shared tools available to all users
 * - founder: Founder OS personal productivity tools
 * - guyforthat: GFT CRM and contact management tools
 * - powerpak: Expert/skills marketplace tools
 * - voice: Voice profile and content generation tools
 *
 * Usage:
 *
 *   const addTask = defineTool({
 *     name: 'add_task',
 *     description: 'Add a new task',
 *     platform: 'founder',                    // Platform that owns this tool
 *     requiredTier: 'free',                   // Minimum tier required
 *     input: z.object({ title: z.string(), priority: z.string().optional() }),
 *     handler: async (ctx, input) => {
 *       return TaskService.add(ctx, input);
 *     },
 *     rest: { method: 'POST', path: '/tasks' },
 *     alias: { pattern: 'add {title} to my tasks', priority: 50 }
 *   });
 *
 *   // In MCP server with access control:
 *   const access = await validateUserAccess(userId, apiKey);
 *   const mcpTools = registry.getMCPToolsForAccess(access);
 *   const result = await registry.handleMCPWithAccess(name, args, ctx, access);
 *
 *   // In Express:
 *   app.use('/v1', registry.getExpressRouter());
 *
 *   // In do() handler:
 *   registry.invoke('add_task', { title: 'Test' }, ctx);
 */

export { defineTool, ToolRegistry, getRegistry } from './registry.js';
export type {
  // Core types
  ToolDefinition,
  ToolContext,
  ToolHandler,
  RegisteredTool,
  RESTConfig,
  AliasConfig,
  MCPToolSchema,
  // Platform access control types
  Platform,
  SubscriptionTier,
  PlatformAccess,
} from './types.js';

// Re-export individual tools for direct access
export * from './definitions/index.js';
