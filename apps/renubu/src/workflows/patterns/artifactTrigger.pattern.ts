import { DynamicChatBranch } from '@/components/artifacts/workflows/config/WorkflowConfig';

/**
 * Configuration for artifact trigger pattern
 */
export interface ArtifactTriggerConfig {
  response: string;
  artifactId: string;
  showMenu?: boolean;
  delay?: number;
  additionalActions?: Array<'nextChat' | 'resetChat' | 'exitTaskMode'>;
}

/**
 * Creates a chat branch that triggers artifact display
 *
 * This pattern is used when you need to show an artifact to the user,
 * optionally with the side menu and additional actions.
 *
 * @param config - Artifact trigger configuration
 * @returns A configured DynamicChatBranch
 *
 * @example
 * const branch = createArtifactTrigger({
 *   response: "Here's the contract review",
 *   artifactId: 'enterprise-contract',
 *   showMenu: true
 * });
 */
export function createArtifactTrigger(config: ArtifactTriggerConfig): DynamicChatBranch {
  const actions: DynamicChatBranch['actions'] = ['showArtifact'];

  if (config.showMenu) {
    actions.push('showMenu');
  }

  if (config.additionalActions) {
    actions.push(...config.additionalActions);
  }

  return {
    response: config.response,
    actions,
    artifactId: config.artifactId,
    ...(config.delay && { delay: config.delay })
  };
}
