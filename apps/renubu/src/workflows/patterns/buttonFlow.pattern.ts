import { DynamicChatBranch, DynamicChatButton } from '@/components/artifacts/workflows/config/WorkflowConfig';

/**
 * Configuration for creating a button flow pattern
 */
export interface ButtonFlowConfig {
  response: string;
  buttons: DynamicChatButton[];
  nextBranches: Record<string, string>;
  delay?: number;
  actions?: DynamicChatBranch['actions'];
  artifactId?: string;
}

/**
 * Creates a standardized button flow chat branch
 *
 * This pattern is used for chat branches that present options to the user
 * via buttons and route to different branches based on selection.
 *
 * @param config - Button flow configuration
 * @returns A configured DynamicChatBranch
 *
 * @example
 * const branch = createButtonFlow({
 *   response: "What would you like to do?",
 *   buttons: [
 *     { label: 'Option A', value: 'a' },
 *     { label: 'Option B', value: 'b' }
 *   ],
 *   nextBranches: {
 *     'a': 'branch-a',
 *     'b': 'branch-b'
 *   }
 * });
 */
export function createButtonFlow(config: ButtonFlowConfig): DynamicChatBranch {
  return {
    response: config.response,
    buttons: config.buttons,
    nextBranches: config.nextBranches,
    ...(config.delay && { delay: config.delay }),
    ...(config.actions && { actions: config.actions }),
    ...(config.artifactId && { artifactId: config.artifactId })
  };
}
