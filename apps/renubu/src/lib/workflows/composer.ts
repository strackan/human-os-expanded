/**
 * Workflow Composer
 *
 * Composes workflows from slide library + composition definitions.
 *
 * This is the runtime engine that:
 * 1. Takes a WorkflowComposition (slide sequence + contexts)
 * 2. Loads slides from the SLIDE_LIBRARY
 * 3. Applies contexts to customize each slide
 * 4. Returns WorkflowConfig ready for TaskMode
 *
 * Key Innovation:
 * - Same slide (e.g., 'prepare-quote') behaves differently based on context
 * - No code changes needed for new workflows
 * - Workflows stored in database, composed at runtime
 */

import { SLIDE_LIBRARY, validateSlideSequence } from './slides';
import type {
  WorkflowComposition,
  SlideBuilder,
  UniversalSlideBuilder,
  SlideContext,
  SlideDefinition,
  SlideDefinitionV2,
  TemplateReference,
  ChatMessageTemplate,
  ChatBranchTemplate,
  ArtifactSectionTemplate,
} from './slides/baseSlide';
import type { WorkflowConfig, WorkflowSlide } from '@/components/artifacts/workflows/config/WorkflowConfig';
import { renderTemplate } from './templates/TemplateRegistry';
import { getComponent } from './components/ComponentRegistry';

/**
 * Composition Error
 */
export class CompositionError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'CompositionError';
  }
}

/**
 * Compose a workflow from a composition definition
 *
 * @param composition - Workflow composition (slide sequence + contexts)
 * @param slideLibrary - Slide library (defaults to SLIDE_LIBRARY)
 * @param context - Context for template rendering (customer, workflow data)
 * @returns WorkflowSlides ready for TaskMode
 *
 * @throws CompositionError if composition is invalid
 *
 * @example
 * const slides = composeWorkflow(executiveContactLostComposition, SLIDE_LIBRARY, { customer: customerData });
 */
export function composeWorkflow(
  composition: WorkflowComposition,
  slideLibrary: Record<string, UniversalSlideBuilder> = SLIDE_LIBRARY,
  context: Record<string, any> = {}
): WorkflowSlide[] {
  // Validate composition
  const validation = validateComposition(composition, slideLibrary);
  if (!validation.valid) {
    throw new CompositionError(
      'Invalid workflow composition',
      'INVALID_COMPOSITION',
      { errors: validation.errors }
    );
  }

  // Compose slides
  const slides: WorkflowSlide[] = [];

  for (let i = 0; i < composition.slideSequence.length; i++) {
    const slideId = composition.slideSequence[i];
    const slideBuilder = slideLibrary[slideId];

    if (!slideBuilder) {
      throw new CompositionError(
        `Slide '${slideId}' not found in library`,
        'SLIDE_NOT_FOUND',
        { slideId, availableSlides: Object.keys(slideLibrary) }
      );
    }

    // Get context for this slide and merge with runtime context
    const slideContext = composition.slideContexts?.[slideId];

    // For greeting slide, inject workflow info so it can build a checklist from actual steps
    const workflowInfo = slideId === 'greeting' ? {
      slideSequence: composition.slideSequence,
      slideLibrary,
      workflowName: composition.name,
      workflowCategory: composition.category,
    } : {};

    // Merge runtime context (customer, pricing) into slide context for V2 slides
    const mergedContext = slideContext ? {
      ...slideContext,
      variables: {
        ...slideContext.variables,
        ...context, // Merge customer, pricing from runtime context
        ...workflowInfo, // Inject workflow info for greeting slide
      },
    } : (slideId === 'greeting' ? { variables: { ...workflowInfo } } : undefined);

    // Check if context provides a complete override structure (legacy)
    if (slideContext?.overrideStructure) {
      // Use the override structure directly (bypassing slide library)
      const workflowSlide: WorkflowSlide = {
        slideNumber: i,
        ...slideContext.overrideStructure,
      };
      slides.push(workflowSlide);
      continue;
    }

    // Build the slide with merged context using slide library
    const slideDefinition = slideBuilder(mergedContext);

    // Check if this is a V2 slide (template-based)
    if (isSlideV2(slideDefinition)) {
      // Resolve V2 slide using template and component registries
      const workflowSlide = resolveSlideV2(slideDefinition, i, context);
      slides.push(workflowSlide);
    } else {
      // Legacy V1 format - use structure directly
      const workflowSlide: WorkflowSlide = {
        slideNumber: i,
        ...slideDefinition.structure,
      };
      slides.push(workflowSlide);
    }
  }

  return slides;
}

/**
 * Validate a workflow composition
 *
 * Checks:
 * - All slides in sequence exist in library
 * - Composition has required fields
 * - Contexts reference valid slides
 *
 * @param composition - Workflow composition to validate
 * @param slideLibrary - Slide library (defaults to SLIDE_LIBRARY)
 * @returns Validation result with errors
 *
 * @example
 * const result = validateComposition(myComposition);
 * if (!result.valid) {
 *   console.error('Composition errors:', result.errors);
 * }
 */
export function validateComposition(
  composition: WorkflowComposition,
  slideLibrary: Record<string, UniversalSlideBuilder> = SLIDE_LIBRARY
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required fields
  if (!composition.id) {
    errors.push('Composition must have an id');
  }

  if (!composition.slideSequence || composition.slideSequence.length === 0) {
    errors.push('Composition must have a non-empty slideSequence');
  }

  if (!composition.category) {
    errors.push('Composition must have a category (risk, opportunity, strategic, renewal)');
  }

  // Check slide sequence
  if (composition.slideSequence) {
    const slideValidation = validateSlideSequence(composition.slideSequence);
    if (!slideValidation.valid) {
      errors.push(
        `Missing slides in library: ${slideValidation.missing.join(', ')}`
      );
    }
  }

  // Check contexts reference valid slides
  if (composition.slideContexts) {
    const contextSlideIds = Object.keys(composition.slideContexts);
    const invalidContexts = contextSlideIds.filter(
      (id) => !composition.slideSequence.includes(id)
    );

    if (invalidContexts.length > 0) {
      errors.push(
        `Contexts reference slides not in sequence: ${invalidContexts.join(', ')}`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Build a complete WorkflowConfig from a composition
 *
 * This combines:
 * - Composed slides
 * - Workflow settings
 * - Customer context
 *
 * @param composition - Workflow composition
 * @param customerContext - Customer data for placeholders
 * @param slideLibrary - Slide library (defaults to SLIDE_LIBRARY)
 * @returns Complete WorkflowConfig
 *
 * @example
 * const config = buildWorkflowConfig(
 *   executiveContactLostComposition,
 *   { name: 'Acme Corp', current_arr: 250000, ... }
 * );
 */
export function buildWorkflowConfig(
  composition: WorkflowComposition,
  customerContext?: {
    name: string;
    [key: string]: any;
  },
  slideLibrary: Record<string, UniversalSlideBuilder> = SLIDE_LIBRARY
): Partial<WorkflowConfig> {
  // Build template rendering context
  // If customerContext has 'customer' and 'pricing' keys, use it as-is
  // Otherwise, wrap it as { customer: customerContext } for backward compatibility
  const templateContext = customerContext && ('customer' in customerContext || 'pricing' in customerContext)
    ? customerContext
    : {
        customer: customerContext || { name: 'Customer' },
      };

  // Compose slides with context
  const slides = composeWorkflow(composition, slideLibrary, templateContext as Record<string, any>);

  // Build config
  // Handle both old format (customerContext = { name, ... }) and new format ({ customer: {...}, pricing: {...} })
  const customerData = customerContext && 'customer' in customerContext
    ? customerContext.customer
    : customerContext;

  const config: Partial<WorkflowConfig> = {
    customer: customerData
      ? { name: customerData.name }
      : { name: 'Customer' },
    slides,
  };

  // Add settings if provided
  if (composition.settings) {
    if (composition.settings.layout) {
      config.layout = {
        modalDimensions: composition.settings.layout.modalDimensions || {
          width: 1600,
          height: 900,
          top: 80,
          left: 160,
        },
        dividerPosition: composition.settings.layout.dividerPosition ?? 50,
        chatWidth: composition.settings.layout.chatWidth ?? 600,
        splitModeDefault: composition.settings.layout.splitModeDefault ?? false,
      };
    }
    if (composition.settings.chat) {
      config.chat = {
        placeholder: composition.settings.chat.placeholder || 'Type your message...',
        aiGreeting: composition.settings.chat.aiGreeting || 'Hello! How can I help you today?',
        features: {
          attachments: false,
          voiceRecording: false,
          designMode: false,
          editMode: false,
          artifactsToggle: true,
        },
      };
    }
  }

  return config;
}

/**
 * Get a list of all available slide IDs from the library
 *
 * Useful for building workflow composition UIs.
 *
 * @param slideLibrary - Slide library (defaults to SLIDE_LIBRARY)
 * @returns Array of slide IDs
 */
export function getAvailableSlides(
  slideLibrary: Record<string, UniversalSlideBuilder> = SLIDE_LIBRARY
): string[] {
  return Object.keys(slideLibrary).sort();
}

/**
 * Get slides filtered by category
 *
 * Useful for building workflow composition UIs.
 *
 * @param category - Slide category to filter by
 * @param slideLibrary - Slide library (defaults to SLIDE_LIBRARY)
 * @returns Array of slide IDs in that category
 */
export function getSlidesByCategory(
  category: 'common' | 'action' | 'risk' | 'opportunity' | 'strategic' | 'renewal',
  slideLibrary: Record<string, UniversalSlideBuilder> = SLIDE_LIBRARY
): string[] {
  // For now, return all slides
  // TODO: Add category metadata to slides for filtering
  return getAvailableSlides(slideLibrary);
}

/**
 * Preview a workflow composition
 *
 * Returns a summary of the workflow without building it.
 *
 * @param composition - Workflow composition
 * @param slideLibrary - Slide library (defaults to SLIDE_LIBRARY)
 * @returns Preview summary
 *
 * @example
 * const preview = previewComposition(executiveContactLostComposition);
 * console.log(`Workflow: ${preview.name}`);
 * console.log(`Slides: ${preview.slideCount}`);
 * console.log(`Sequence: ${preview.slideIds.join(' → ')}`);
 */
export function previewComposition(
  composition: WorkflowComposition,
  slideLibrary: Record<string, UniversalSlideBuilder> = SLIDE_LIBRARY
): {
  id: string;
  name: string;
  category: string;
  slideCount: number;
  slideIds: string[];
  hasContexts: boolean;
  validation: { valid: boolean; errors: string[] };
} {
  const validation = validateComposition(composition, slideLibrary);

  return {
    id: composition.id,
    name: composition.name || composition.id,
    category: composition.category,
    slideCount: composition.slideSequence.length,
    slideIds: composition.slideSequence,
    hasContexts: Boolean(composition.slideContexts && Object.keys(composition.slideContexts).length > 0),
    validation,
  };
}

/**
 * Clone a composition with modifications
 *
 * Useful for creating workflow variants.
 *
 * @param composition - Base composition
 * @param modifications - Changes to apply
 * @returns New composition
 *
 * @example
 * // Create a "Quick Renewal" variant with fewer slides
 * const quickRenewal = cloneComposition(standardRenewalComposition, {
 *   id: 'quick-renewal',
 *   name: 'Quick Renewal',
 *   slideSequence: ['greeting', 'review-account', 'prepare-quote', 'workflow-summary']
 * });
 */
export function cloneComposition(
  composition: WorkflowComposition,
  modifications: Partial<WorkflowComposition>
): WorkflowComposition {
  return {
    ...composition,
    ...modifications,
    // Deep clone contexts if provided
    slideContexts: modifications.slideContexts
      ? { ...composition.slideContexts, ...modifications.slideContexts }
      : composition.slideContexts,
  };
}

/**
 * Resolve template reference to rendered text
 *
 * @param template - Template reference with ID and context
 * @param baseContext - Base context (customer, workflow data)
 * @returns Rendered template text
 */
function resolveTemplate(
  template: TemplateReference,
  baseContext: Record<string, any>
): string {
  // Merge template context with base context
  const mergedContext = {
    ...baseContext,
    ...template.context,
  };

  // Render template
  return renderTemplate(template.templateId, mergedContext);
}

/**
 * Resolve V2 slide definition (template-based) to WorkflowSlide
 *
 * @param slideV2 - V2 slide definition using templates and component references
 * @param slideNumber - Slide number in sequence
 * @param context - Context for template rendering (customer, workflow data)
 * @returns WorkflowSlide ready for TaskMode
 */
export function resolveSlideV2(
  slideV2: SlideDefinitionV2,
  slideNumber: number,
  context: Record<string, any>
): WorkflowSlide {
  // Resolve chat configuration
  const chat: WorkflowSlide['chat'] = {
    branches: {},
  };

  // Copy generateInitialMessage flag if present (enables LLM greeting generation)
  if ('generateInitialMessage' in slideV2.chat) {
    chat.generateInitialMessage = (slideV2.chat as any).generateInitialMessage;
  }

  // Resolve initial message if present
  if (slideV2.chat.initialMessage) {
    const msg = slideV2.chat.initialMessage;
    chat.initialMessage = {
      text: resolveTemplate(msg.text, context),
      buttons: msg.buttons,
      nextBranches: msg.nextBranches,
    };
  }

  // Resolve branches
  for (const [branchName, branchTemplate] of Object.entries(slideV2.chat.branches)) {
    chat.branches[branchName] = {
      response: resolveTemplate(branchTemplate.response, context),
      delay: branchTemplate.delay,
      actions: branchTemplate.actions as any, // TODO: Add proper action type validation
      storeAs: branchTemplate.storeAs,
      nextBranchOnText: branchTemplate.nextBranchOnText,
    };
  }

  // Resolve artifacts
  const artifacts: WorkflowSlide['artifacts'] = {
    sections: slideV2.artifacts.sections.map((sectionTemplate) => {
      // Get component metadata from registry to verify it exists
      const componentId = sectionTemplate.component.componentId;
      const componentType = getComponent(componentId);

      if (!componentType) {
        throw new CompositionError(
          `Component '${componentId}' not found in registry`,
          'COMPONENT_NOT_FOUND',
          { componentId }
        );
      }

      // Map component IDs to the string names expected by ArtifactRenderer
      const componentTypeMap: Record<string, string> = {
        'artifact.pricing-analysis': 'PricingAnalysisArtifact',
        'artifact.quote': 'QuoteArtifact',
        'artifact.email': 'EmailArtifact',
        'artifact.summary': 'PlanSummaryArtifact',
      };

      const componentTypeName = componentTypeMap[componentId];
      if (!componentTypeName) {
        console.warn(`[V2] No type mapping for component ${componentId}, using componentId`);
      }

      return {
        id: sectionTemplate.id,
        title: sectionTemplate.title,
        type: 'custom' as const,
        visible: sectionTemplate.visible ?? true,
        editable: sectionTemplate.editable,
        readOnly: sectionTemplate.readOnly,
        data: {
          componentType: componentTypeName || componentId,
          props: sectionTemplate.component.props,
        },
      };
    }),
  };

  // Build WorkflowSlide
  const workflowSlide: WorkflowSlide = {
    id: slideV2.id,
    slideNumber,
    title: slideV2.title,
    description: slideV2.description,
    label: slideV2.label,
    stepMapping: slideV2.stepMapping,
    chat,
    artifacts,
  };

  return workflowSlide;
}

/**
 * Check if a value is a V2 slide definition
 */
function isSlideV2(slide: any): slide is SlideDefinitionV2 {
  return slide && typeof slide === 'object' && 'chat' in slide && 'artifacts' in slide;
}
