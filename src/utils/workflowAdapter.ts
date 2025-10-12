/**
 * Workflow Adapter
 *
 * Converts backend workflow configs (from automation/renewal-configs)
 * to frontend WorkflowDefinition format.
 *
 * Maps backend artifact types to frontend artifact renderer types.
 */

import { WorkflowDefinition, WorkflowStep } from '@/components/workflows/WorkflowExecutor';
import { ArtifactConfig } from '@/components/workflows/artifacts/ArtifactRenderer';

// =====================================================
// Backend Workflow Types (inferred from configs)
// =====================================================

interface BackendWorkflowConfig {
  id: string;
  name: string;
  description?: string;
  version?: string;
  trigger?: any;
  context?: {
    systemPrompt?: string;
  };
  steps: BackendWorkflowStep[];
}

interface BackendWorkflowStep {
  id: string;
  name: string;
  type?: string;
  description?: string;
  execution?: {
    llmPrompt?: string;
    processor?: string;
    storeIn?: string;
  };
  routing?: any;
  notifications?: any[];
  ui?: {
    cardTitle?: string;
    cardDescription?: string;
    artifacts?: BackendArtifact[];
  };
}

interface BackendArtifact {
  id: string;
  type: string;
  title: string;
  config: any;
  visible?: string;
}

// =====================================================
// Artifact Type Mapping
// =====================================================

/**
 * Map backend artifact types to frontend artifact types
 */
function mapArtifactType(backendType: string): ArtifactConfig['type'] {
  const typeMap: Record<string, ArtifactConfig['type']> = {
    'summary_panel': 'status_grid',
    'action_list': 'action_tracker',
    'timeline': 'timeline',
    'status_grid': 'status_grid',
    'countdown': 'countdown',
    'alert': 'alert',
    'checklist': 'checklist',
    'table': 'table',
    'markdown': 'markdown'
  };

  return typeMap[backendType] || 'markdown';
}

/**
 * Convert backend artifact config to frontend artifact config
 */
function convertArtifact(backendArtifact: BackendArtifact): ArtifactConfig {
  const frontendType = mapArtifactType(backendArtifact.type);

  // Convert config based on type
  let config = backendArtifact.config;

  // Special handling for summary_panel → status_grid
  if (backendArtifact.type === 'summary_panel' && backendArtifact.config.fields) {
    config = {
      columns: 4,
      items: backendArtifact.config.fields.map((field: any) => ({
        label: field.label,
        value: field.value,
        sublabel: field.sublabel,
        status: field.status || 'neutral'
      }))
    };
  }

  // Special handling for action_list → action_tracker
  if (backendArtifact.type === 'action_list') {
    config = {
      showProgress: backendArtifact.config.showProgress ?? true,
      actions: backendArtifact.config.actions || []
    };
  }

  return {
    id: backendArtifact.id,
    type: frontendType,
    title: backendArtifact.title,
    visible: backendArtifact.visible,
    config
  };
}

// =====================================================
// Workflow Conversion
// =====================================================

/**
 * Convert backend workflow config to frontend WorkflowDefinition
 *
 * @param backendWorkflow - Backend workflow config
 * @param componentMap - Map step IDs to frontend component names
 * @returns Frontend WorkflowDefinition
 */
export function convertWorkflowConfig(
  backendWorkflow: BackendWorkflowConfig,
  componentMap?: Record<string, string>
): WorkflowDefinition {
  const steps: WorkflowStep[] = backendWorkflow.steps.map((backendStep, index) => {
    // Determine component to use
    const component = componentMap?.[backendStep.id] || 'GenericFormStep';

    // Convert artifacts if they exist
    const artifacts = backendStep.ui?.artifacts
      ? backendStep.ui.artifacts.map(convertArtifact)
      : undefined;

    return {
      id: backendStep.id,
      number: index + 1,
      title: backendStep.ui?.cardTitle || backendStep.name,
      description: backendStep.ui?.cardDescription || backendStep.description || '',
      component,
      artifacts
    };
  });

  return {
    id: backendWorkflow.id,
    name: backendWorkflow.name,
    description: backendWorkflow.description || '',
    steps
  };
}

/**
 * Load and convert a specific workflow by ID
 *
 * In production, this would fetch from API or import from configs.
 * For now, we'll need to manually import the workflow files.
 *
 * @param workflowId - Workflow ID (e.g., 'overdue')
 * @returns Frontend WorkflowDefinition
 */
export async function loadWorkflow(workflowId: string): Promise<WorkflowDefinition | null> {
  // TODO: This will be implemented when we copy workflow configs
  // For now, return null and we'll handle in the calling code
  console.warn('[workflowAdapter] loadWorkflow not yet implemented for:', workflowId);
  return null;
}
