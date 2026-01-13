/**
 * Base Slide Types for Workflow System
 *
 * Architecture: Slide Library + Workflow Composition
 *
 * Core Concept:
 * - Slides are reusable building blocks (like "Prepare Quote", "Draft Email", "Review Account")
 * - Workflows are compositions of slides (e.g., [greeting, review-account, prepare-quote, email, summary])
 * - Same slide can be used across multiple workflow types
 * - workflow_type (risk/opportunity/strategic/renewal) is for scoring/categorization, NOT structure
 *
 * Example:
 * - "Prepare Quote" slide used in: Renewal workflows, Expansion workflows, Risk mitigation workflows
 * - "Review Account Health" slide used in: All workflow types
 * - "Assess Executive Departure Impact" slide used in: Only specific risk workflows
 */

import { WorkflowSlide } from '@/components/artifacts/workflows/config/WorkflowConfig';

/**
 * Template Reference
 * References a Handlebars template by ID with context variables
 */
export interface TemplateReference {
  /**
   * Template ID from TemplateRegistry
   */
  templateId: string;

  /**
   * Context variables for template rendering
   * These are merged with customer/workflow data
   */
  context?: Record<string, any>;
}

/**
 * Component Reference
 * References a React component by ID with props mapping
 */
export interface ComponentReference {
  /**
   * Component ID from ComponentRegistry
   */
  componentId: string;

  /**
   * Props to pass to the component
   * Can include direct values or context variable references
   */
  props: Record<string, any>;
}

/**
 * Chat Message Template
 * Defines a chat message using template references
 */
export interface ChatMessageTemplate {
  /**
   * Message text template reference
   */
  text: TemplateReference;

  /**
   * Optional buttons
   */
  buttons?: Array<{
    label: string;
    value: string;
    'label-background'?: string;
    'label-text'?: string;
  }>;

  /**
   * Branch mappings
   */
  nextBranches?: Record<string, string>;
}

/**
 * Chat Branch Template
 * Defines a chat branch using template references
 */
export interface ChatBranchTemplate {
  /**
   * Response text template reference
   */
  response: TemplateReference;

  /**
   * Delay before executing actions (seconds)
   */
  delay?: number;

  /**
   * Actions to execute
   */
  actions?: string[];

  /**
   * Store user input
   */
  storeAs?: string;

  /**
   * Next branch on text input
   */
  nextBranchOnText?: string;
}

/**
 * Artifact Section Template
 * Defines an artifact section using component references
 */
export interface ArtifactSectionTemplate {
  /**
   * Unique ID for this section
   */
  id: string;

  /**
   * Section title
   */
  title: string;

  /**
   * Component reference
   */
  component: ComponentReference;

  /**
   * Whether section is visible by default
   */
  visible?: boolean;

  /**
   * Whether section is editable
   */
  editable?: boolean;

  /**
   * Whether section is read-only
   */
  readOnly?: boolean;
}

/**
 * Slide Context
 * Additional context that customizes how a slide behaves in different workflows
 */
export interface SlideContext {
  /**
   * Purpose of this slide in the current workflow
   * Examples: 'executive_departure', 'renewal_preparation', 'expansion_opportunity'
   */
  purpose?: string;

  /**
   * Urgency level affects messaging tone
   */
  urgency?: 'low' | 'medium' | 'high' | 'critical';

  /**
   * Additional variables to inject into slide templates
   */
  variables?: Record<string, any>;

  /**
   * Override default slide behavior
   */
  overrides?: {
    title?: string;
    description?: string;
    estimatedMinutes?: number;
  };

  /**
   * Complete structure override (bypasses slide library entirely)
   * Use this when you need exact control over the slide structure
   * @deprecated Use template/component references instead
   */
  overrideStructure?: any;
}

/**
 * Slide Builder Function (Legacy)
 * Each slide is a function that takes context and returns a SlideDefinition
 * @deprecated Use SlideBuilderV2 for new slides
 */
export type SlideBuilder = (context?: SlideContext) => SlideDefinition;

/**
 * Slide Builder Function V2 (Template-based)
 * Returns a V2 slide definition using template and component references
 */
export type SlideBuilderV2 = (context?: SlideContext) => SlideDefinitionV2;

/**
 * Universal Slide Builder
 * Can return either V1 or V2 format
 */
export type UniversalSlideBuilder = SlideBuilder | SlideBuilderV2;

/**
 * Slide Definition (Legacy)
 * Template structure for a reusable slide using inline structure
 * @deprecated Use SlideDefinitionV2 with template/component references
 */
export interface SlideDefinition {
  /**
   * Unique slide ID (e.g., 'greeting', 'review-account', 'prepare-quote')
   */
  id: string;

  /**
   * Human-readable name
   */
  name: string;

  /**
   * Slide category for organization (module-specific)
   * CS module: 'common', 'risk', 'opportunity', 'strategic', 'renewal', 'action'
   * Productivity module: 'planner', 'gtd', 'capture', 'review'
   */
  category: string;

  /**
   * Description of what this slide does
   */
  description: string;

  /**
   * Estimated time to complete (minutes)
   */
  estimatedMinutes: number;

  /**
   * Required data fields to hydrate this slide
   * Format: 'object.field' (e.g., 'customer.name', 'customer.current_arr')
   */
  requiredFields: string[];

  /**
   * Optional fields that enhance the slide
   */
  optionalFields?: string[];

  /**
   * Slide structure (same as WorkflowSlide but with placeholders)
   */
  structure: Omit<WorkflowSlide, 'slideNumber'>;

  /**
   * Tags for searching/filtering slides
   */
  tags?: string[];

  /**
   * Version for slide evolution tracking
   */
  version?: string;

  /**
   * Title for planning checklist display
   * Used by greeting slide to build workflow checklist from slide sequence
   * Example: "Review account health and contract details"
   */
  checklistTitle?: string;
}

/**
 * Slide Definition V2 (Template-based)
 * New format using template and component references
 */
export interface SlideDefinitionV2 {
  /**
   * Unique slide ID (e.g., 'pricing-analysis', 'prepare-quote')
   */
  id: string;

  /**
   * Human-readable title
   */
  title: string;

  /**
   * Description of what this slide does
   */
  description: string;

  /**
   * Label for progress bar
   */
  label: string;

  /**
   * Step mapping for side panel
   */
  stepMapping: string;

  /**
   * Slide category for organization (module-specific)
   * CS module: 'common', 'risk', 'opportunity', 'strategic', 'renewal', 'action'
   * Productivity module: 'planner', 'gtd', 'capture', 'review'
   */
  category: string;

  /**
   * Estimated time to complete (minutes)
   */
  estimatedMinutes: number;

  /**
   * Required data fields to hydrate this slide
   */
  requiredFields: string[];

  /**
   * Optional fields that enhance the slide
   */
  optionalFields?: string[];

  /**
   * Chat configuration using templates
   */
  chat: {
    /**
     * Initial message template
     */
    initialMessage?: ChatMessageTemplate;

    /**
     * Branch templates
     */
    branches: Record<string, ChatBranchTemplate>;
  };

  /**
   * Artifact configuration using component references
   */
  artifacts: {
    sections: ArtifactSectionTemplate[];
  };

  /**
   * Tags for searching/filtering slides
   */
  tags?: string[];

  /**
   * Version for slide evolution tracking
   */
  version?: string;

  /**
   * Title for planning checklist display
   * Used by greeting slide to build workflow checklist from slide sequence
   * Example: "Review account health and contract details"
   */
  checklistTitle?: string;
}

/**
 * Workflow Composition
 * Defines how slides are assembled into a complete workflow
 */
export interface WorkflowComposition {
  /**
   * Workflow definition ID (from database)
   */
  id: string;

  /**
   * Human-readable name
   */
  name: string;

  /**
   * Module ID - defines which product domain this workflow belongs to
   * @example 'customer-success', 'productivity'
   */
  moduleId: string;

  /**
   * Category for scoring/prioritization (module-specific)
   * Valid categories depend on the moduleId
   */
  category: string;

  /**
   * Description
   */
  description: string;

  /**
   * Sequence of slide IDs
   */
  slideSequence: string[];

  /**
   * Context for each slide in the sequence
   */
  slideContexts?: Record<string, SlideContext>;

  /**
   * Overall workflow settings
   */
  settings?: {
    layout?: {
      modalDimensions?: { width: number; height: number; top: number; left: number };
      dividerPosition?: number;
      chatWidth?: number;
      splitModeDefault?: boolean;
    };
    chat?: {
      placeholder?: string;
      aiGreeting?: string;
    };
  };
}

/**
 * Common slide placeholders
 */
export const COMMON_PLACEHOLDERS = {
  CUSTOMER_NAME: '{{customer.name}}',
  CUSTOMER_ARR: '{{customer.current_arr}}',
  CUSTOMER_HEALTH: '{{customer.health_score}}',
  RENEWAL_DATE: '{{customer.renewal_date}}',
  DAYS_TO_RENEWAL: '{{customer.days_to_renewal}}',
  PRIMARY_CONTACT: '{{primary_contact.name}}',
  PRIMARY_CONTACT_EMAIL: '{{primary_contact.email}}',
  PRIMARY_CONTACT_TITLE: '{{primary_contact.title}}',
  USER_NAME: '{{user.name}}',
  USER_FIRST_NAME: '{{user.first_name}}',
};

/**
 * Default slide settings
 */
export const DEFAULT_SLIDE_SETTINGS = {
  estimatedMinutes: 2,
  category: 'common' as const,
  version: '1.0.0',
};

/**
 * Slide validation
 */
export function validateSlideDefinition(slide: SlideDefinition): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!slide.id) errors.push('Slide ID is required');
  if (!slide.name) errors.push('Slide name is required');
  if (!slide.structure) errors.push('Slide structure is required');
  if (!slide.requiredFields || slide.requiredFields.length === 0) {
    errors.push('Slide must define required fields');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Compose workflow from slides
 */
export function composeWorkflow(
  composition: WorkflowComposition,
  slideLibrary: Record<string, SlideBuilder>
): SlideDefinition[] {
  return composition.slideSequence.map((slideId, index) => {
    const slideBuilder = slideLibrary[slideId];

    if (!slideBuilder) {
      throw new Error(`Slide "${slideId}" not found in library`);
    }

    // Get context for this slide instance
    const context = composition.slideContexts?.[slideId];

    // Build the slide with context
    const slide = slideBuilder(context);

    return slide;
  });
}

/**
 * Helper to create a slide builder
 */
export function createSlideBuilder(
  baseDefinition: Omit<SlideDefinition, 'structure'>,
  structureFactory: (context?: SlideContext) => Omit<WorkflowSlide, 'slideNumber'>
): SlideBuilder {
  return (context?: SlideContext): SlideDefinition => {
    return {
      ...baseDefinition,
      structure: structureFactory(context),
      // Apply context overrides
      ...(context?.overrides && {
        name: context.overrides.title || baseDefinition.name,
        description: context.overrides.description || baseDefinition.description,
        estimatedMinutes: context.overrides.estimatedMinutes || baseDefinition.estimatedMinutes,
      })
    };
  };
}

/**
 * Merge context variables into text
 */
export function applyContextVariables(text: string, context?: SlideContext): string {
  if (!context?.variables) return text;

  let result = text;
  for (const [key, value] of Object.entries(context.variables)) {
    result = result.replace(new RegExp(`{{context.${key}}}`, 'g'), String(value));
  }
  return result;
}
