/**
 * @human-os/dream
 *
 * End-of-day processing system for Founder-OS.
 * Runs as dream() to parse, route, reflect, and plan.
 *
 * Usage:
 * ```typescript
 * import { createDreamService } from '@human-os/dream';
 *
 * const dream = createDreamService({
 *   userId: 'user-uuid',
 *   supabaseUrl: process.env.SUPABASE_URL,
 *   supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
 *   anthropicApiKey: process.env.ANTHROPIC_API_KEY,
 * });
 *
 * // Run dream() pipeline
 * const result = await dream.run();
 *
 * // Or run only if stale
 * const result = await dream.runIfNeeded();
 * ```
 */

// Types
export * from './types.js';

// Main Service
export { DreamService, createDreamService } from './dream-service.js';

// Individual Agents
export { ParserRouter, createParserRouter } from './parser-router.js';
export { ReflectorCalibrator, createReflectorCalibrator } from './reflector-calibrator.js';
export { PlannerCloser, createPlannerCloser } from './planner-closer.js';
export { ToughLove, createToughLove } from './tough-love.js';

// Graduation Check
export { GraduationChecker, createGraduationChecker } from './graduation-check.js';
export type { GraduationCriteria } from './graduation-check.js';

// MCP Sync (Phase 0)
export { MCPSync, createMCPSync } from './mcp-sync.js';
export type { MCPProvider, MCPContent, MCPSyncResult, MCPSyncConfig } from './mcp-sync.js';
