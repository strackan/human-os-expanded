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
            buttons: this.createDefaultButtons(step),
          },
          branches: {
            start: {
              response: `Great! Let's proceed with ${step.step_name.toLowerCase()}.`,
              buttons: this.createDefaultButtons(step),
            },
          },
          userTriggers: {},
          defaultMessage: 'I understand. What would you like to do next?',
        },

        // Convert artifacts for this step
        artifacts: {
          sections: stepArtifacts.map(art => this.transformArtifact(art)),
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
   * Create default buttons for a step
   */
  private static createDefaultButtons(step: WorkflowStepDefinition) {
    const buttons = [];

    // Add task-related buttons
    if (step.creates_tasks && step.creates_tasks.length > 0) {
      buttons.push({
        label: 'View Tasks',
        value: 'view_tasks',
        'label-background': 'bg-blue-600',
        'label-text': 'text-white',
      });
    }

    // Always add continue button
    buttons.push({
      label: 'Continue',
      value: 'continue',
      'label-background': 'bg-green-600',
      'label-text': 'text-white',
      completeStep: step.step_id,
    });

    return buttons;
  }

  /**
   * Transform artifact from compilation to slide section format
   * Uses component mapping if available (for rich artifacts like emails/quotes)
   */
  private static transformArtifact(artifact: any): any {
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
