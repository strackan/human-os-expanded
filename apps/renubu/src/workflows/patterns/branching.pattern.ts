import { DynamicChatBranch, DynamicChatButton } from '@/components/artifacts/workflows/config/WorkflowConfig';

/**
 * Configuration for complex branching pattern
 */
export interface ComplexBranchConfig {
  response: string;
  buttons?: DynamicChatButton[];
  nextBranches?: Record<string, string>;
  actions?: DynamicChatBranch['actions'];
  artifactId?: string;
  delay?: number;
  predelay?: number;
  stepId?: string;
}

/**
 * Creates a complex chat branch with multiple options
 *
 * This pattern supports the most flexible branching scenarios with
 * optional buttons, actions, artifacts, and step completion.
 *
 * @param config - Complex branch configuration
 * @returns A configured DynamicChatBranch
 *
 * @example
 * const branch = createComplexBranch({
 *   response: "Let's review the contract",
 *   buttons: [{ label: 'Review', value: 'review', completeStep: 'review-contract' }],
 *   nextBranches: { 'review': 'contract-details' },
 *   actions: ['showArtifact', 'showMenu'],
 *   artifactId: 'enterprise-contract',
 *   delay: 1
 * });
 */
export function createComplexBranch(config: ComplexBranchConfig): DynamicChatBranch {
  return {
    response: config.response,
    ...(config.buttons && { buttons: config.buttons }),
    ...(config.nextBranches && { nextBranches: config.nextBranches }),
    ...(config.actions && { actions: config.actions }),
    ...(config.artifactId && { artifactId: config.artifactId }),
    ...(config.delay && { delay: config.delay }),
    ...(config.predelay && { predelay: config.predelay }),
    ...(config.stepId && { stepId: config.stepId })
  };
}

/**
 * Creates a simple text-only response branch
 *
 * @param response - The text response to show
 * @param delay - Optional delay in seconds
 * @returns A configured DynamicChatBranch
 */
export function createSimpleResponse(response: string, delay?: number): DynamicChatBranch {
  return {
    response,
    ...(delay && { delay })
  };
}
