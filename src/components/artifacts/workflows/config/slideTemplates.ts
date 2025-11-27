/**
 * Slide Templates for Renubu Workflows
 *
 * Reusable slide builders for creating consistent workflow presentations.
 * Slides combine chat configuration, artifacts, and side panels into cohesive workflow steps.
 */

import { WorkflowSlide, DynamicChatButton, DynamicChatBranch, SidePanelConfig, CustomerOverviewConfig, AnalyticsConfigOrTemplate } from './WorkflowConfig';

/**
 * Base Slide Configuration
 *
 * Common configuration options for all slides
 */
export interface BaseSlideConfig {
  id: string;
  slideNumber: number;
  title: string;
  description: string;
  label: string;
  stepMapping?: string;
  showSideMenu?: boolean;
  customerOverview?: CustomerOverviewConfig;
  analytics?: AnalyticsConfigOrTemplate;
  onComplete?: {
    nextSlide?: number;
    actions?: string[];
    updateProgress?: boolean;
  };
}

/**
 * Chat Configuration for Slides
 */
export interface SlideChatConfig {
  initialMessage?: {
    text: string;
    buttons?: DynamicChatButton[];
    nextBranches?: {
      [userResponse: string]: string;
    };
  };
  branches: {
    [branchName: string]: DynamicChatBranch;
  };
  userTriggers?: {
    [pattern: string]: string;
  };
  defaultMessage?: string;
}

/**
 * Generic Workflow Slide Builder
 *
 * Creates a complete workflow slide with all necessary configuration
 */
export interface WorkflowSlideConfig extends BaseSlideConfig {
  chat: SlideChatConfig;
  artifacts: Array<{
    id: string;
    title: string;
    type: 'license-analysis' | 'email-draft' | 'email' | 'html' | 'custom' | 'workflow-summary' | 'planning-checklist' | 'planning-checklist-enhanced' | 'contract' | 'pricing-analysis' | 'document' | 'contact-strategy' | 'plan-summary' | 'quote' | 'component:interactive' | 'component:informative';
    visible: boolean;
    editable?: boolean;
    content?: any;
    data?: any;
    htmlContent?: string;
    styles?: string;
    isLoading?: boolean;
    error?: string;
    readOnly?: boolean;
  }>;
  sidePanel?: SidePanelConfig;
}

export const createWorkflowSlide = (config: WorkflowSlideConfig): WorkflowSlide => {
  return {
    id: config.id,
    slideNumber: config.slideNumber,
    title: config.title,
    description: config.description,
    label: config.label,
    stepMapping: config.stepMapping || config.id,
    showSideMenu: config.showSideMenu,
    customerOverview: config.customerOverview,
    analytics: config.analytics,
    chat: {
      initialMessage: config.chat.initialMessage,
      branches: config.chat.branches,
      userTriggers: config.chat.userTriggers,
      defaultMessage: config.chat.defaultMessage
    },
    artifacts: {
      sections: config.artifacts
    },
    sidePanel: config.sidePanel ? {
      ...config.sidePanel,
      title: {
        ...config.sidePanel.title,
        subtitle: config.sidePanel.title.subtitle || '',
        icon: config.sidePanel.title.icon || '📋'
      },
      steps: config.sidePanel.steps.map(step => ({
        ...step,
        description: step.description || '',
        icon: step.icon || '⚡',
        workflowBranch: step.workflowBranch || step.id,
        status: step.status === 'skipped' ? 'pending' : (step.status as 'pending' | 'in-progress' | 'completed')
      }))
    } : undefined,
    onComplete: config.onComplete
  };
};

/**
 * Initial Contact Slide Template
 *
 * Standard first slide for customer engagement workflows
 * Presents initial options: proceed, snooze, or skip
 */
export interface InitialContactSlideConfig extends Omit<BaseSlideConfig, 'id' | 'slideNumber' | 'title' | 'description' | 'label'> {
  initialMessage?: SlideChatConfig['initialMessage'];
  artifacts: WorkflowSlideConfig['artifacts'];
  branches: SlideChatConfig['branches'];
  sidePanel?: SidePanelConfig;
  userTriggers?: SlideChatConfig['userTriggers'];
}

export const createInitialContactSlide = (config: InitialContactSlideConfig): WorkflowSlide => {
  return createWorkflowSlide({
    id: 'initial-contact',
    slideNumber: 1,
    title: 'Renewals',
    description: 'Customer renewal workflow',
    label: 'Renewals',
    stepMapping: 'initial-contact',
    showSideMenu: config.showSideMenu ?? false,
    customerOverview: config.customerOverview,
    analytics: config.analytics,
    chat: {
      initialMessage: config.initialMessage,
      branches: config.branches,
      userTriggers: config.userTriggers,
      defaultMessage: "I'm sorry, I didn't understand that. Could you try again or select one of the available options?"
    },
    artifacts: config.artifacts,
    sidePanel: config.sidePanel,
    onComplete: config.onComplete
  });
};

/**
 * Needs Assessment Slide Template
 *
 * Second slide for analyzing customer requirements and opportunities
 */
export interface NeedsAssessmentSlideConfig extends Omit<BaseSlideConfig, 'id' | 'slideNumber' | 'title' | 'description' | 'label'> {
  initialMessage?: SlideChatConfig['initialMessage'];
  artifacts: WorkflowSlideConfig['artifacts'];
  branches: SlideChatConfig['branches'];
  sidePanel?: SidePanelConfig;
  userTriggers?: SlideChatConfig['userTriggers'];
}

export const createNeedsAssessmentSlide = (config: NeedsAssessmentSlideConfig): WorkflowSlide => {
  return createWorkflowSlide({
    id: 'needs-assessment',
    slideNumber: 2,
    title: 'Needs Assessment',
    description: 'Analyze customer requirements and growth opportunities',
    label: 'Needs Assessment',
    stepMapping: 'needs-assessment',
    showSideMenu: config.showSideMenu ?? false,
    customerOverview: config.customerOverview,
    analytics: config.analytics,
    chat: {
      initialMessage: config.initialMessage,
      branches: config.branches,
      userTriggers: config.userTriggers,
      defaultMessage: "I'm sorry, I didn't understand that. Could you try again or select one of the available options?"
    },
    artifacts: config.artifacts,
    sidePanel: config.sidePanel,
    onComplete: config.onComplete
  });
};

/**
 * Pricing Strategy Slide Template
 *
 * Slide focused on pricing analysis and strategy decisions
 */
export interface PricingStrategySlideConfig extends Omit<BaseSlideConfig, 'id' | 'slideNumber' | 'title' | 'description' | 'label'> {
  artifacts: WorkflowSlideConfig['artifacts'];
  branches: SlideChatConfig['branches'];
  sidePanel?: SidePanelConfig;
  userTriggers?: SlideChatConfig['userTriggers'];
}

export const createPricingStrategySlide = (config: PricingStrategySlideConfig): WorkflowSlide => {
  return createWorkflowSlide({
    id: 'pricing-strategy',
    slideNumber: 3,
    title: 'Pricing Strategy',
    description: 'Analyze and optimize pricing approach',
    label: 'Pricing Strategy',
    stepMapping: 'pricing-strategy',
    showSideMenu: config.showSideMenu ?? false,
    customerOverview: config.customerOverview,
    analytics: config.analytics,
    chat: {
      initialMessage: {
        text: "Now let's determine the optimal pricing strategy based on market analysis and customer value metrics.",
        buttons: [
          { label: 'View Analysis', value: 'view-pricing', completeStep: 'pricing-analysis' } as any,
          { label: 'Set Custom Price', value: 'custom-price' },
          { label: 'Skip Pricing', value: 'skip-pricing' }
        ]
      },
      branches: config.branches,
      userTriggers: config.userTriggers,
      defaultMessage: "I'm sorry, I didn't understand that. Could you try again or select one of the available options?"
    },
    artifacts: config.artifacts,
    sidePanel: config.sidePanel,
    onComplete: config.onComplete
  });
};

/**
 * Contact Planning Slide Template
 *
 * Slide for stakeholder analysis and contact strategy
 */
export interface ContactPlanningSlideConfig extends Omit<BaseSlideConfig, 'id' | 'slideNumber' | 'title' | 'description' | 'label'> {
  artifacts: WorkflowSlideConfig['artifacts'];
  branches: SlideChatConfig['branches'];
  sidePanel?: SidePanelConfig;
  userTriggers?: SlideChatConfig['userTriggers'];
}

export const createContactPlanningSlide = (config: ContactPlanningSlideConfig): WorkflowSlide => {
  return createWorkflowSlide({
    id: 'contact-planning',
    slideNumber: 4,
    title: 'Contact Strategy',
    description: 'Plan stakeholder engagement approach',
    label: 'Contact Strategy',
    stepMapping: 'contact-planning',
    showSideMenu: config.showSideMenu ?? false,
    customerOverview: config.customerOverview,
    analytics: config.analytics,
    chat: {
      initialMessage: {
        text: "Let's identify key stakeholders and develop our contact strategy for maximum impact.",
        buttons: [
          { label: 'View Strategy', value: 'view-strategy', completeStep: 'contact-strategy' } as any,
          { label: 'Modify Contacts', value: 'modify-contacts' },
          { label: 'Skip Strategy', value: 'skip-strategy' }
        ]
      },
      branches: config.branches,
      userTriggers: config.userTriggers,
      defaultMessage: "I'm sorry, I didn't understand that. Could you try again or select one of the available options?"
    },
    artifacts: config.artifacts,
    sidePanel: config.sidePanel,
    onComplete: config.onComplete
  });
};

/**
 * Plan Summary Slide Template
 *
 * Final slide summarizing the complete plan with action items
 */
export interface PlanSummarySlideConfig extends Omit<BaseSlideConfig, 'id' | 'slideNumber' | 'title' | 'description' | 'label'> {
  artifacts: WorkflowSlideConfig['artifacts'];
  branches: SlideChatConfig['branches'];
  sidePanel?: SidePanelConfig;
  userTriggers?: SlideChatConfig['userTriggers'];
}

export const createPlanSummarySlide = (config: PlanSummarySlideConfig): WorkflowSlide => {
  return createWorkflowSlide({
    id: 'plan-summary',
    slideNumber: 5,
    title: 'Plan Summary',
    description: 'Review complete renewal plan and next steps',
    label: 'Plan Summary',
    stepMapping: 'plan-summary',
    showSideMenu: config.showSideMenu ?? false,
    customerOverview: config.customerOverview,
    analytics: config.analytics,
    chat: {
      initialMessage: {
        text: "Excellent work! Let's review the complete renewal plan we've developed.",
        buttons: [
          { label: 'View Summary', value: 'view-summary', completeStep: 'plan-summary' } as any,
          { label: 'Make Changes', value: 'make-changes' },
          { label: 'Complete', value: 'complete' }
        ]
      },
      branches: config.branches,
      userTriggers: config.userTriggers,
      defaultMessage: "I'm sorry, I didn't understand that. Could you try again or select one of the available options?"
    },
    artifacts: config.artifacts,
    sidePanel: config.sidePanel,
    onComplete: config.onComplete
  });
};

/**
 * Helper: Create Side Panel Configuration
 *
 * Builds a side panel with progress tracking for workflow slides
 */
export interface SidePanelStepConfig {
  id: string;
  title: string;
  description: string;
  workflowBranch: string;
  icon?: string;
  status?: 'pending' | 'in-progress' | 'completed' | 'skipped';
}

export interface CreateSidePanelConfig {
  title: string;
  subtitle: string;
  icon?: string;
  steps: SidePanelStepConfig[];
  showProgressMeter?: boolean;
  showSteps?: boolean;
}

export const createSidePanel = (config: CreateSidePanelConfig): SidePanelConfig => {
  return {
    enabled: true,
    title: {
      text: config.title,
      subtitle: config.subtitle,
      icon: config.icon || '📋'
    },
    steps: config.steps.map(step => ({
      id: step.id,
      title: step.title,
      description: step.description,
      status: step.status || 'pending',
      workflowBranch: step.workflowBranch,
      icon: step.icon
    })),
    progressMeter: {
      currentStep: 1,
      totalSteps: config.steps.length,
      progressPercentage: 0,
      showPercentage: true,
      showStepNumbers: true
    },
    showProgressMeter: config.showProgressMeter ?? false,
    showSteps: config.showSteps ?? true
  };
};
