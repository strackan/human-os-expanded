/**
 * Base Template Types for Workflow System
 *
 * This defines the structure for workflow templates that get hydrated
 * with customer data at runtime to generate WorkflowConfig instances.
 *
 * Architecture:
 * - workflow_definitions.template_file_id → points to a template
 * - Template contains placeholders like {{CUSTOMER_NAME}}
 * - configBuilder.buildWorkflowConfig() hydrates template with real data
 * - Result is WorkflowConfig (in memory, not saved to file)
 */

import { WorkflowConfig, WorkflowSlide } from '@/components/artifacts/workflows/config/WorkflowConfig';

/**
 * Workflow Categories (4 indices for scoring/classification)
 */
export type WorkflowCategory = 'risk' | 'opportunity' | 'strategic' | 'renewal';

/**
 * Template Slide Structure
 * Same as WorkflowSlide but with template placeholders
 */
export interface TemplateSlide extends Omit<WorkflowSlide, 'chat' | 'artifacts'> {
  chat: {
    initialMessage?: {
      text: string; // Can contain {{PLACEHOLDERS}}
      buttons?: Array<{
        label: string;
        value: string;
        'label-background'?: string;
        'label-text'?: string;
      }>;
      component?: any; // Inline components (slider, textarea, etc.)
      nextBranches?: {
        [userResponse: string]: string;
      };
    };
    branches: {
      [branchName: string]: {
        response: string; // Can contain {{PLACEHOLDERS}}
        delay?: number;
        actions?: string[];
        storeAs?: string;
        nextBranch?: string;
        nextBranchOnText?: string;
        buttons?: any[];
        component?: any;
      };
    };
    userTriggers?: {
      [pattern: string]: string;
    };
    defaultMessage?: string;
  };
  artifacts: {
    sections: Array<{
      id: string;
      title: string; // Can contain {{PLACEHOLDERS}}
      type: string;
      visible: boolean;
      data?: any; // Will be populated at runtime
      editable?: boolean;
      content?: any;
      htmlContent?: string;
      styles?: string;
    }>;
  };
}

/**
 * Workflow Template Definition
 *
 * This is the base structure that gets registered in the template registry
 * and referenced by workflow_definitions.template_file_id
 */
export interface WorkflowTemplate {
  /**
   * Template ID - matches workflow_definitions.template_file_id
   * Examples: 'exec-contact-lost', 'expansion-opportunity', 'standard-renewal'
   */
  id: string;

  /**
   * Human-readable template name
   * Examples: "Executive Contact Lost", "Expansion Opportunity"
   */
  name: string;

  /**
   * Category classification (one of 4 indices)
   */
  category: WorkflowCategory;

  /**
   * Template description
   */
  description: string;

  /**
   * Number of slides in this workflow
   */
  slideCount: number;

  /**
   * Estimated completion time in minutes
   */
  estimatedMinutes: number;

  /**
   * Version for template evolution tracking
   */
  version: string;

  /**
   * Required data fields that must be present to hydrate this template
   * Format: 'object.field' (e.g., 'customer.name', 'customer.current_arr')
   */
  requiredFields: string[];

  /**
   * Optional fields that enhance the workflow but aren't required
   */
  optionalFields?: string[];

  /**
   * Layout configuration (can use defaults or override)
   */
  layout: {
    modalDimensions: {
      width: number;
      height: number;
      top: number;
      left: number;
    };
    dividerPosition: number;
    chatWidth: number;
    splitModeDefault: boolean;
  };

  /**
   * Chat configuration template
   */
  chat: {
    placeholder: string; // Can contain {{PLACEHOLDERS}}
    aiGreeting: string; // Can contain {{PLACEHOLDERS}}
    features: {
      attachments: boolean;
      voiceRecording: boolean;
      designMode: boolean;
      editMode: boolean;
      artifactsToggle: boolean;
    };
  };

  /**
   * Slides with template placeholders
   */
  slides: TemplateSlide[];

  /**
   * Customer overview metrics template (optional)
   */
  customerOverviewTemplate?: {
    metrics: {
      [key: string]: {
        label: string;
        valuePath: string; // Path to data: 'customer.current_arr'
        formatAs?: 'currency' | 'date' | 'number' | 'percent' | 'string';
        statusPath?: string; // Path to status color
        sublabelPath?: string;
        rolePath?: string; // For contact metrics
      };
    };
  };

  /**
   * Analytics template (optional)
   */
  analyticsTemplate?: {
    usageTrend?: {
      title: string;
      dataPath: string; // Path to array data
      showReferenceLine: boolean;
      referenceLineLabel?: string;
      chartContextLabelPath?: string;
      chartContextColorPath?: string;
    };
    userLicenses?: {
      title: string;
      dataPath: string;
      showReferenceLine: boolean;
      referenceLineLabel?: string;
      chartContextLabelPath?: string;
      chartContextColorPath?: string;
    };
    renewalInsights?: {
      renewalStagePath: string;
      confidencePath: string;
      recommendedActionPath: string;
      keyReasonsPath: string; // Array of {category, detail}
    };
  };
}

/**
 * Default layout for all templates
 */
export const DEFAULT_TEMPLATE_LAYOUT = {
  modalDimensions: {
    width: 90,
    height: 90,
    top: 5,
    left: 5
  },
  dividerPosition: 50,
  chatWidth: 50,
  splitModeDefault: true,
};

/**
 * Default chat features for all templates
 */
export const DEFAULT_CHAT_FEATURES = {
  attachments: false,
  voiceRecording: false,
  designMode: false,
  editMode: false,
  artifactsToggle: true,
};

/**
 * Template validation error
 */
export class TemplateValidationError extends Error {
  constructor(
    public templateId: string,
    public missingFields: string[],
    message?: string
  ) {
    super(message || `Template ${templateId} is missing required fields: ${missingFields.join(', ')}`);
    this.name = 'TemplateValidationError';
  }
}

/**
 * Placeholder pattern for template variables
 * Matches: {{CUSTOMER_NAME}}, {{customer.current_arr}}, etc.
 */
export const PLACEHOLDER_PATTERN = /\{\{([^}]+)\}\}/g;

/**
 * Extract placeholders from a string
 */
export function extractPlaceholders(text: string): string[] {
  const matches = text.matchAll(PLACEHOLDER_PATTERN);
  return Array.from(matches, m => m[1]);
}

/**
 * Check if template has all required data
 */
export function validateTemplateData(
  template: WorkflowTemplate,
  data: Record<string, any>
): { valid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];

  for (const fieldPath of template.requiredFields) {
    const value = getNestedValue(data, fieldPath);
    if (value === undefined || value === null) {
      missingFields.push(fieldPath);
    }
  }

  return {
    valid: missingFields.length === 0,
    missingFields
  };
}

/**
 * Get nested value from object using dot notation
 * Example: getNestedValue({customer: {name: 'Acme'}}, 'customer.name') → 'Acme'
 */
export function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Set nested value in object using dot notation
 */
export function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!(key in current)) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}
