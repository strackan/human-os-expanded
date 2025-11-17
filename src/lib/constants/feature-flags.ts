/**
 * Feature Flags for Release 0.1.8.1 - Code Optimizations
 *
 * Controls gradual rollout of refactored code with instant rollback capability.
 * All flags default to false (use legacy code) for maximum safety.
 */

export const FEATURE_FLAGS = {
  /**
   * Phase 1: Use consolidated BaseTriggerEvaluator instead of separate evaluators
   *
   * When enabled: SkipTriggerEvaluatorV2, ReviewTriggerEvaluatorV2, EscalateTriggerEvaluatorV2
   * When disabled: Original SkipTriggerEvaluator, ReviewTriggerEvaluator, EscalateTriggerEvaluator
   *
   * Benefit: Reduces 1,707 lines of 95% duplicate code to 700 lines
   * Risk: Low (pure refactor, behavior identical)
   * Rollback: Toggle to false in .env.local
   */
  USE_BASE_TRIGGER_EVALUATOR:
    process.env.NEXT_PUBLIC_USE_BASE_TRIGGER_EVALUATOR === 'true',

  /**
   * Phase 2: Use modular TaskMode components instead of monolithic component
   *
   * When enabled: TaskModeFullscreenV2 (composed of 6 child components)
   * When disabled: Original TaskModeFullscreen (1,151 line monolith)
   *
   * Benefit: Splits 1,151 lines into 6 focused components for easier maintenance
   * Risk: Medium (component refactor with state dependencies)
   * Rollback: Toggle to false in .env.local
   */
  USE_MODULAR_TASK_MODE:
    process.env.NEXT_PUBLIC_USE_MODULAR_TASK_MODE === 'true',

  /**
   * Phase 3: Use modular workflow config system instead of monolithic configs
   *
   * When enabled: WorkflowBuilder with composable patterns and stages
   * When disabled: Original DynamicChatFixed hardcoded config
   *
   * Benefit: Modularizes 1,248-line config into reusable patterns and stages
   * Risk: Low (config generation, no logic changes)
   * Rollback: Toggle to false in .env.local
   */
  USE_MODULAR_WORKFLOW_CONFIGS:
    process.env.NEXT_PUBLIC_USE_MODULAR_WORKFLOW_CONFIGS === 'true',

  /**
   * Phase 4 (InHerSight 0.1.9): Use database-driven workflow template system
   *
   * When enabled: WorkflowCompilationService with template inheritance and modifications
   * When disabled: Original hardcoded TypeScript workflow configs
   *
   * Benefit:
   * - No more per-customer workflow files (eliminates bloat)
   * - Runtime modification based on customer state (risk_score, company, etc.)
   * - Templates and modifications managed via database (no code deploys)
   * - Scalable across customers and workflows
   *
   * Risk: High (fundamental architecture change)
   * Rollback: Toggle to false in .env.local
   * Test Customer: Obsidian Black (renewal_base template + at-risk freebie mod)
   */
  USE_WORKFLOW_TEMPLATE_SYSTEM:
    process.env.NEXT_PUBLIC_USE_WORKFLOW_TEMPLATE_SYSTEM === 'true',
} as const;

/**
 * Type-safe flag access
 */
export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

/**
 * Helper to check if a feature flag is enabled
 *
 * @param flag - The feature flag to check
 * @returns true if flag is enabled, false otherwise
 *
 * @example
 * if (isFeatureEnabled('USE_BASE_TRIGGER_EVALUATOR')) {
 *   // Use new code
 * } else {
 *   // Use old code
 * }
 */
export function isFeatureEnabled(flag: FeatureFlagKey): boolean {
  return FEATURE_FLAGS[flag];
}

/**
 * Get all feature flag states (useful for debugging)
 *
 * @returns Object with all flag states
 */
export function getAllFeatureFlags(): Record<FeatureFlagKey, boolean> {
  return { ...FEATURE_FLAGS };
}
