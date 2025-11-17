import { StageReference } from '../types';
import {
  createPricingAnalysisStage,
  dynamicCorpPricingConfig,
  createContractReviewStage,
  dynamicCorpContractConfig,
  createEmailComposerStage,
  dynamicCorpEmailConfig,
  createWorkflowSummaryStage,
  dynamicCorpSummaryConfig,
  createPlanningChecklistStage,
  dynamicCorpChecklistConfig
} from '../stages';

/**
 * Stage registry maps stage IDs to their factory functions
 */
type StageFactory = (config?: any) => any;

const stageRegistry: Record<string, { factory: StageFactory; defaultConfig: any }> = {
  'pricingAnalysis': {
    factory: createPricingAnalysisStage,
    defaultConfig: dynamicCorpPricingConfig
  },
  'contractReview': {
    factory: createContractReviewStage,
    defaultConfig: dynamicCorpContractConfig
  },
  'emailComposer': {
    factory: createEmailComposerStage,
    defaultConfig: dynamicCorpEmailConfig
  },
  'workflowSummary': {
    factory: createWorkflowSummaryStage,
    defaultConfig: dynamicCorpSummaryConfig
  },
  'planningChecklist': {
    factory: createPlanningChecklistStage,
    defaultConfig: dynamicCorpChecklistConfig
  }
};

/**
 * StageComposer resolves stage references to actual artifact sections
 *
 * This class is responsible for:
 * - Looking up stage definitions by reference ID
 * - Merging custom config with default config
 * - Generating artifact sections from stage templates
 */
export class StageComposer {
  /**
   * Resolves a single stage reference to an artifact section
   *
   * @param stageRef - Stage reference with ID and optional config override
   * @returns Artifact section ready to be included in a slide
   */
  resolveStage(stageRef: StageReference): any {
    const stageDefinition = stageRegistry[stageRef.id];

    if (!stageDefinition) {
      throw new Error(`Stage '${stageRef.id}' not found in registry`);
    }

    // Merge custom config with default config
    const config = stageRef.config
      ? { ...stageDefinition.defaultConfig, ...stageRef.config }
      : stageDefinition.defaultConfig;

    // Call the factory function to create the artifact section
    return stageDefinition.factory(config);
  }

  /**
   * Resolves multiple stage references to artifact sections
   *
   * @param stageRefs - Array of stage references
   * @returns Array of artifact sections
   */
  resolveStages(stageRefs: StageReference[]): any[] {
    return stageRefs.map(ref => this.resolveStage(ref));
  }

  /**
   * Get all available stage IDs
   *
   * @returns Array of available stage IDs
   */
  getAvailableStages(): string[] {
    return Object.keys(stageRegistry);
  }
}
