/**
 * @human-os/core
 *
 * Core TypeScript library for Human OS - the unified context layer
 * for identity, knowledge graph, and AI integration.
 */

// Types
export * from './types.js';

// Configuration constants
export * from './config.js';

// Core classes
export { ContextEngine } from './context-engine.js';
export { KnowledgeGraph } from './knowledge-graph.js';
export { PrivacyModel } from './privacy-model.js';
export { UsageTracker } from './usage-tracker.js';
export { SecurityLayer } from './security.js';

// MCP Query Service
export { MCPQueryService, createMCPQueryService } from './mcp-query-service.js';
export type {
  MCPQueryConfig,
  MCPProvider,
  MCPQuery,
  MCPResult,
  MCPResultItem,
} from './mcp-query-service.js';

// Supabase utilities
export {
  getSupabaseClient,
  createSupabaseClient,
  resetSupabaseClient,
  DEFAULT_STORAGE_BUCKET,
  TABLES,
  type DatabaseEntity,
  type DatabaseEntityLink,
  type DatabaseContextFile,
} from './supabase-client.js';

// Re-export Supabase types for convenience
export type { SupabaseClient } from '@supabase/supabase-js';
