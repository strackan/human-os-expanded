import { WorkflowComposition } from '../../types';
import { initialContactSlide } from './initialContact.slide';
import { needsAssessmentSlide } from './needsAssessment.slide';

/**
 * Renewal Workflow Composition
 *
 * This composition defines a complete renewal workflow using:
 * - Modular slide templates
 * - Reusable artifact stages
 * - Composable chat patterns
 *
 * The composition approach reduces the original 1,248-line config
 * to a concise definition that references reusable components.
 */
export const renewalComposition: WorkflowComposition = {
  customer: {
    name: 'Dynamic Corp',
    nextCustomer: 'UserFirst Inc.'
  },
  slides: [
    initialContactSlide,
    needsAssessmentSlide
  ]
};

/**
 * Export individual slides for flexibility
 */
export { initialContactSlide, needsAssessmentSlide };
