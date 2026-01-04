import { DynamicChatBranch } from '@/components/artifacts/workflows/config/WorkflowConfig';

/**
 * Configuration for auto-advance pattern
 */
export interface AutoAdvanceConfig {
  response: string;
  nextBranch: string;
  delay?: number;
  predelay?: number;
  artifactId?: string;
  actions?: Array<'showArtifact' | 'nextChat' | 'showMenu' | 'removeArtifact'>;
}

/**
 * Creates a chat branch that auto-advances to another branch after a delay
 *
 * This pattern is used for workflow steps that need to automatically progress
 * after showing information or performing an action.
 *
 * @param config - Auto-advance configuration
 * @returns A configured DynamicChatBranch
 *
 * @example
 * const branch = createAutoAdvance({
 *   response: "Working on it...",
 *   nextBranch: 'email-complete',
 *   delay: 3000,
 *   artifactId: 'email-draft',
 *   actions: ['showArtifact', 'nextChat']
 * });
 */
export function createAutoAdvance(config: AutoAdvanceConfig): DynamicChatBranch {
  return {
    response: config.response,
    nextBranches: {
      'auto-followup': config.nextBranch
    },
    ...(config.delay && { delay: config.delay }),
    ...(config.predelay && { predelay: config.predelay }),
    ...(config.artifactId && { artifactId: config.artifactId }),
    ...(config.actions && { actions: config.actions })
  };
}
