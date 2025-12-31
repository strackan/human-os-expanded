/**
 * Tool Definitions Index
 *
 * All tools are defined here using the unified pattern.
 * Each definition automatically provides MCP + REST + do() support.
 *
 * Platform Organization:
 * - core: glossary, search (shared across platforms)
 * - founder: tasks, queue, session, recall, journal
 * - guyforthat: contacts, companies, storage, engagement
 */

// Core platform tools (shared)
export * from './glossary.js';
export * from './search.js';

// Founder platform tools
export * from './tasks.js';
export * from './queue.js';
export * from './session.js';
export * from './recall.js';
export * from './journal.js';

// GuyForThat platform tools
export * from './guyforthat/index.js';
