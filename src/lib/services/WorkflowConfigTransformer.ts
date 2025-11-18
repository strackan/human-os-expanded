/**
 * Workflow Config Transformer
 *
 * Converts CompiledWorkflowConfig (from workflow_templates system)
 * into WorkflowConfig format (expected by TaskModeFullscreen)
 *
 * Part of InHerSight 0.1.9 - Workflow Template System Integration
 */

import type { CompiledWorkflowConfig, WorkflowStepDefinition, ArtifactDefinition } from './WorkflowCompilationService';
import type { WorkflowConfig, WorkflowSlide } from '@/components/artifacts/workflows/config/WorkflowConfig';

export class WorkflowConfigTransformer {
  /**
   * Convert CompiledWorkflowConfig to WorkflowConfig
   *
   * Transforms the template-based compiled workflow into the slide-based
   * format expected by TaskModeFullscreen component.
   */
  static transformToWorkflowConfig(
    compiled: CompiledWorkflowConfig,
    customerName: string
  ): WorkflowConfig {
    // Convert steps to slides
    const slides = this.convertStepsToSlides(
      compiled.steps,
      compiled.artifacts
    );

    return {
      customer: {
        name: customerName,
      },
      layout: {
        modalDimensions: {
          width: 80,
          height: 90,
          top: 10,
          left: 10,
        },
        dividerPosition: 50,
        chatWidth: 50,
        splitModeDefault: true,
      },
      chat: {
        placeholder: 'Type your message...',
        aiGreeting: 'Hello! How can I assist you today?',
        mode: 'dynamic',
        conversationSeed: [],
        features: {
          attachments: false,
          voiceRecording: false,
          designMode: false,
          editMode: false,
          artifactsToggle: true,
        },
      },
      artifacts: {
        sections: [],
      },
      slides: slides,
      _variableContext: {
        customer: {
          name: customerName,
        },
      },
    };
  }

  /**
   * Convert WorkflowStepDefinition[] to WorkflowSlide[]
   */
  private static convertStepsToSlides(
    steps: WorkflowStepDefinition[],
    artifacts: ArtifactDefinition[]
  ): WorkflowSlide[] {
    return steps.map((step, index) => {
      // Find artifacts that this step shows
      const stepArtifacts = step.shows_artifacts
        ? artifacts.filter(art => step.shows_artifacts?.includes(art.artifact_id))
        : [];

      return {
        id: step.step_id,
        slideNumber: index,
        title: step.step_name,
        description: step.description || '',
        label: step.step_name,
        stepMapping: step.step_id,
        showSideMenu: false,

        // Convert step to chat configuration
        chat: {
          initialMessage: {
            text: step.description || `Let's work on: ${step.step_name}`,
            buttons: this.createStepButtons(step, index, steps.length),
            nextBranches: this.createNextBranches(step, index, steps.length)
          },
          branches: this.createBranches(step, index, steps.length),
          userTriggers: {},
          defaultMessage: 'I understand. What would you like to do next?',
        },

        // Convert artifacts for this step
        artifacts: {
          sections: stepArtifacts.map(art => this.transformArtifact(art, step)),
        },

        // Side panel configuration
        sidePanel: {
          enabled: true,
          title: {
            text: 'Workflow Progress',
            subtitle: 'Track your progress',
            icon: 'checklist',
          },
          steps: steps.map((s, i) => ({
            id: s.step_id,
            title: s.step_name,
            description: s.description || '',
            status: i < index ? 'completed' : i === index ? 'in-progress' : 'pending',
            workflowBranch: s.step_id,
            icon: this.getStepIcon(s.step_type),
          })),
          progressMeter: {
            currentStep: index + 1,
            totalSteps: steps.length,
            progressPercentage: Math.round(((index + 1) / steps.length) * 100),
            showPercentage: true,
            showStepNumbers: true,
          },
          showProgressMeter: true,
          showSteps: true,
        },

        onComplete: {
          nextSlide: index + 1 < steps.length ? index + 1 : undefined,
          updateProgress: true,
        },
      };
    });
  }

  /**
   * Create nextBranches mapping for a step's initial message
   */
  private static createNextBranches(step: WorkflowStepDefinition, stepIndex: number, totalSteps: number): Record<string, string> | undefined {
    // For greeting/intro steps
    if (step.step_type === 'intro' || step.step_id === 'greeting') {
      return { 'start': 'proceed' };
    }

    // For summary/last step with complete button
    if (step.step_type === 'summary' || stepIndex === totalSteps - 1) {
      return { 'complete': 'complete', 'continue': 'proceed' };
    }

    // For other steps with continue button
    return { 'continue': 'proceed' };
  }

  /**
   * Create branches for a step
   */
  private static createBranches(step: WorkflowStepDefinition, stepIndex: number, totalSteps: number): Record<string, any> {
    const branches: Record<string, any> = {};

    // Check if this is the last step
    const isLastStep = stepIndex === totalSteps - 1;

    // Standard proceed branch
    branches.proceed = {
      response: `Great! Let's proceed with ${step.step_name.toLowerCase()}.`,
      actions: isLastStep ? [] : ['nextSlide']
    };

    // For last step, add complete branch with closeWorkflow action
    if (isLastStep || step.step_type === 'summary') {
      branches.complete = {
        response: 'Excellent work! Closing the workflow now.',
        actions: ['closeWorkflow'],
        delay: 1
      };
    }

    return branches;
  }

  /**
   * Create buttons for a step
   * Priority: step.metadata.buttons > default buttons
   */
  private static createStepButtons(step: WorkflowStepDefinition, _stepIndex: number, _totalSteps: number) {
    // Check if step has custom buttons in metadata
    if (step.metadata?.buttons && Array.isArray(step.metadata.buttons)) {
      return step.metadata.buttons;
    }

    // Default buttons for steps without custom buttons
    const buttons = [];

    // For greeting/intro steps, provide start + snooze buttons
    if (step.step_type === 'intro' || step.step_id === 'greeting') {
      buttons.push({
        label: "Let's Begin!",
        value: 'start',
        'label-background': 'bg-blue-600',
        'label-text': 'text-white'
      });
      buttons.push({
        label: 'Review Later',
        value: 'snooze',
        'label-background': 'bg-gray-500',
        'label-text': 'text-white'
      });
    } else {
      // For other steps, just continue button
      buttons.push({
        label: 'Continue',
        value: 'continue',
        'label-background': 'bg-green-600',
        'label-text': 'text-white',
        completeStep: step.step_id,
      });
    }

    return buttons;
  }

  /**
   * Transform artifact from compilation to slide section format
   * Uses component mapping if available (for rich artifacts like emails/quotes)
   */
  private static transformArtifact(artifact: any, step?: WorkflowStepDefinition): any {
    // Check if artifact has component mapping from compilation service
    if (artifact._component) {
      return {
        id: artifact.artifact_id,
        title: artifact.artifact_name,
        type: 'custom',  // Use 'custom' type to route to component rendering
        visible: true,
        editable: !artifact._component.props.readOnly,
        data: {
          componentType: this.getComponentTypeName(artifact._component.componentId),
          props: artifact._component.props
        }
      };
    }

    // Special handling for planning-checklist artifacts
    if (artifact.artifact_type === 'planning-checklist' && step?.metadata?.checklist_items) {
      return {
        id: artifact.artifact_id,
        title: artifact.artifact_name,
        type: 'custom',
        visible: true,
        editable: false,
        data: {
          componentType: 'PlanningChecklistArtifact',
          props: {
            title: artifact.config?.title || "Here's what we'll accomplish together:",
            items: step.metadata.checklist_items.map((label: string, index: number) => ({
              id: `${index + 1}`,
              label,
              completed: false
            })),
            showActions: false
          }
        }
      };
    }

    // Special handling for account-overview artifacts
    if (artifact.artifact_type === 'account-overview') {
      return {
        id: artifact.artifact_id,
        title: artifact.artifact_name,
        type: 'custom',
        visible: true,
        editable: false,
        data: {
          componentType: 'AccountOverviewArtifact',
          props: {
            // Props will be populated at runtime with customer data
          }
        }
      };
    }

    // Fallback to template-based rendering for documents, dashboards, etc.
    return {
      id: artifact.artifact_id,
      title: artifact.artifact_name,
      type: this.mapArtifactType(artifact.artifact_type),
      visible: true,
      editable: true,
      content: artifact.template_content,
      data: artifact.config,
    };
  }

  /**
   * Map componentId to componentType name for renderer routing
   */
  private static getComponentTypeName(componentId: string): string {
    const mapping: Record<string, string> = {
      'artifact.email': 'EmailArtifact',
      'artifact.quote': 'QuoteArtifact',
      'artifact.pricing-analysis': 'PricingAnalysisArtifact',
      'artifact.summary': 'PlanSummaryArtifact',
    };
    return mapping[componentId] || 'GenericArtifact';
  }

  /**
   * Map artifact type from template system to TaskMode types
   */
  private static mapArtifactType(
    templateType: string
  ): 'license-analysis' | 'email-draft' | 'email' | 'html' | 'custom' | 'workflow-summary' | 'planning-checklist' | 'planning-checklist-enhanced' | 'contract' | 'pricing-analysis' | 'document' | 'contact-strategy' | 'plan-summary' | 'quote' {
    // Map common types
    const typeMap: Record<string, any> = {
      'email': 'email',
      'email-draft': 'email-draft',
      'quote': 'quote',
      'contract': 'contract',
      'pricing': 'pricing-analysis',
      'checklist': 'planning-checklist',
      'document': 'document',
      'summary': 'workflow-summary',
      // Additional template artifact types
      'dashboard': 'html',  // Dashboards render as HTML/custom markup
      'presentation': 'document',  // Presentations render as documents with slides
      'table': 'html',  // Tables render as HTML
    };

    return typeMap[templateType.toLowerCase()] || 'custom';
  }

  /**
   * Get icon for step type
   */
  private static getStepIcon(stepType?: string): string {
    const iconMap: Record<string, string> = {
      'analysis': 'chart-bar',
      'creation': 'document-plus',
      'communication': 'envelope',
      'meeting': 'users',
      'negotiation': 'handshake',
      'decision': 'clipboard-check',
    };

    return iconMap[stepType || ''] || 'clipboard-list';
  }
}
