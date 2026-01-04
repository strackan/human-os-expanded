import { WorkflowSlide } from '@/components/artifacts/workflows/config/WorkflowConfig';
import { WorkflowComposition } from '../types';
import { StageComposer } from './StageComposer';
import { SlideComposer } from './SlideComposer';

/**
 * WorkflowBuilder orchestrates the composition of complete workflows
 *
 * This class is responsible for:
 * - Coordinating stage resolution and slide composition
 * - Building complete workflow configurations from compositions
 * - Providing a high-level API for workflow creation
 */
export class WorkflowBuilder {
  private stageComposer: StageComposer;
  private slideComposer: SlideComposer;

  constructor() {
    this.stageComposer = new StageComposer();
    this.slideComposer = new SlideComposer();
  }

  /**
   * Builds a complete workflow configuration from a composition
   *
   * @param composition - Workflow composition with customer info and slide templates
   * @returns Array of complete WorkflowSlides ready for use
   *
   * @example
   * const builder = new WorkflowBuilder();
   * const slides = builder.build(renewalComposition);
   */
  build(composition: WorkflowComposition): WorkflowSlide[] {
    // Create a map of slide ID to resolved artifact sections
    const artifactSectionsMap = new Map<string, any[]>();

    // Resolve artifact stages for each slide
    composition.slides.forEach(slideTemplate => {
      if (slideTemplate.artifactStages && slideTemplate.artifactStages.length > 0) {
        const artifactSections = this.stageComposer.resolveStages(slideTemplate.artifactStages);
        artifactSectionsMap.set(slideTemplate.id, artifactSections);
      } else {
        artifactSectionsMap.set(slideTemplate.id, []);
      }
    });

    // Compose complete slides
    return this.slideComposer.composeSlides(composition.slides, artifactSectionsMap);
  }

  /**
   * Get the stage composer instance (for advanced usage)
   */
  getStageComposer(): StageComposer {
    return this.stageComposer;
  }

  /**
   * Get the slide composer instance (for advanced usage)
   */
  getSlideComposer(): SlideComposer {
    return this.slideComposer;
  }

  /**
   * Validate a workflow composition before building
   *
   * @param composition - Workflow composition to validate
   * @returns Validation result with any errors
   */
  validate(composition: WorkflowComposition): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate customer info
    if (!composition.customer.name) {
      errors.push('Customer name is required');
    }

    // Validate slides
    if (!composition.slides || composition.slides.length === 0) {
      errors.push('At least one slide is required');
    }

    composition.slides.forEach((slide, index) => {
      if (!slide.id) {
        errors.push(`Slide ${index} is missing an ID`);
      }
      if (!slide.title) {
        errors.push(`Slide ${index} (${slide.id}) is missing a title`);
      }
      if (!slide.chat) {
        errors.push(`Slide ${index} (${slide.id}) is missing chat configuration`);
      }

      // Validate stage references
      if (slide.artifactStages) {
        const availableStages = this.stageComposer.getAvailableStages();
        slide.artifactStages.forEach(stageRef => {
          if (!availableStages.includes(stageRef.id)) {
            errors.push(`Slide ${slide.id} references unknown stage '${stageRef.id}'`);
          }
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
