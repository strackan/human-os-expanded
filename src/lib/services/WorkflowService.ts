export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  status?: string;
  trigger_type?: string;
  created_at?: string;
  conditions?: any;
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  type: 'action' | 'decision' | 'notification';
  action_type?: string;
}

export class WorkflowService {
  static async getWorkflowTemplates(): Promise<WorkflowTemplate[]> {
    // Placeholder implementation
    return [];
  }

  static async getActiveWorkflows(): Promise<WorkflowTemplate[]> {
    // Placeholder implementation
    return [];
  }

  static async createWorkflow(template: WorkflowTemplate): Promise<string> {
    // Placeholder implementation
    return 'workflow-id';
  }
} 