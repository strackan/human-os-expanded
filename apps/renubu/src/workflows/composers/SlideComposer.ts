import { WorkflowSlide } from '@/components/artifacts/workflows/config/WorkflowConfig';
import { SlideTemplate } from '../types';

/**
 * SlideComposer builds complete workflow slides from templates
 *
 * This class is responsible for:
 * - Merging slide templates with resolved artifact stages
 * - Creating complete WorkflowSlide configurations
 * - Ensuring all required fields are present
 */
export class SlideComposer {
  /**
   * Composes a complete slide from template and artifact stages
   *
   * @param template - Slide template with chat and configuration
   * @param artifactSections - Resolved artifact sections from stages
   * @returns Complete WorkflowSlide ready for use
   */
  composeSlide(template: SlideTemplate, artifactSections: any[]): WorkflowSlide {
    return {
      id: template.id,
      slideNumber: template.slideNumber,
      title: template.title,
      description: template.description,
      label: template.label,
      stepMapping: template.stepMapping,
      showSideMenu: template.showSideMenu ?? false,

      // Chat configuration
      chat: {
        initialMessage: template.chat.initialMessage,
        branches: template.chat.branches,
        userTriggers: template.chat.userTriggers,
        defaultMessage: template.chat.defaultMessage
      },

      // Artifacts from resolved stages
      artifacts: {
        sections: artifactSections
      },

      // Side panel configuration
      ...(template.sidePanel && { sidePanel: template.sidePanel })
    };
  }

  /**
   * Composes multiple slides from templates
   *
   * @param templates - Array of slide templates
   * @param artifactSectionsMap - Map of slide ID to artifact sections
   * @returns Array of complete WorkflowSlides
   */
  composeSlides(
    templates: SlideTemplate[],
    artifactSectionsMap: Map<string, any[]>
  ): WorkflowSlide[] {
    return templates.map(template => {
      const artifactSections = artifactSectionsMap.get(template.id) || [];
      return this.composeSlide(template, artifactSections);
    });
  }
}
