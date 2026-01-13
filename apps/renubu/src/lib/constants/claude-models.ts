/**
 * Claude Model Constants
 *
 * Centralized model names for Anthropic's Claude API.
 * Update these when new models are released.
 *
 * Last updated: November 2025
 * Source: https://docs.anthropic.com/en/docs/about-claude/models/overview
 */

/**
 * Claude Haiku 4.5 - Fast, cost-effective model
 * Released: October 15, 2025
 * Pricing: $1/$5 per million input/output tokens
 * Use case: High-volume tasks, quick responses, cost-sensitive applications
 */
export const CLAUDE_HAIKU_CURRENT = 'claude-haiku-4-5';

/**
 * Claude Sonnet 4 - Balanced model (intelligence + speed)
 * Best for: Most production use cases
 */
export const CLAUDE_SONNET_CURRENT = 'claude-sonnet-4-20250514';

/**
 * Claude Opus 4 - Most capable model
 * Best for: Complex reasoning, research tasks
 */
export const CLAUDE_OPUS_CURRENT = 'claude-opus-4-20250514';

/**
 * Legacy models (for reference)
 */
export const CLAUDE_3_5_HAIKU = 'claude-3-5-haiku-20241022';
export const CLAUDE_3_5_SONNET = 'claude-3-5-sonnet-20241022';

/**
 * Model family type
 */
export type ClaudeModel =
  | typeof CLAUDE_HAIKU_CURRENT
  | typeof CLAUDE_SONNET_CURRENT
  | typeof CLAUDE_OPUS_CURRENT
  | typeof CLAUDE_3_5_HAIKU
  | typeof CLAUDE_3_5_SONNET
  | string; // Allow custom model strings
