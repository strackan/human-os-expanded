/**
 * Workflow Sequences Configuration
 *
 * Defines chronological sequences of workflows for demo purposes.
 * Each sequence represents a series of workflows that can be chained together
 * to demonstrate a realistic CSM workload over multiple days.
 */

export interface WorkflowSpec {
  workflowId: string;
  title: string;
  customerId: string;
  customerName: string;
  description?: string;
  day?: string; // Optional day label (e.g., "Day 1", "Day 2")
}

export interface WorkflowSequence {
  id: string;
  name: string;
  description: string;
  workflows: WorkflowSpec[];
}

/**
 * Bluesoft Demo Sprint - October 2025
 *
 * Three-workflow demo showcasing:
 * 1. Strategic Account Planning (Crisis/Recovery)
 * 2. Expansion Opportunity (Proactive Growth)
 * 3. Executive Engagement (Critical Stakeholder Management)
 */
export const bluesoftDemo2025: WorkflowSequence = {
  id: 'bluesoft-demo-2025',
  name: 'Bluesoft Demo Sprint - October 2025',
  description: 'Complete CSM workflow demonstration: crisis management, proactive expansion, and executive engagement',
  workflows: [
    {
      workflowId: 'obsblk-strategic-planning',
      title: 'Complete Strategic Account Plan for Obsidian Black',
      customerId: '550e8400-e29b-41d4-a716-446655440001',
      customerName: 'Obsidian Black',
      description: 'At-risk account recovery planning',
      day: 'Day 1'
    },
    {
      workflowId: 'techflow-expansion-opportunity',
      title: 'Expansion Opportunity for TechFlow Industries',
      customerId: 'techflow-001',
      customerName: 'TechFlow Industries',
      description: 'Proactive multi-year expansion with underpriced, high-growth customer',
      day: 'Day 2'
    },
    {
      workflowId: 'obsblk-executive-engagement',
      title: 'Executive Engagement with Obsidian Black',
      customerId: '550e8400-e29b-41d4-a716-446655440001',
      customerName: 'Obsidian Black',
      description: 'Critical executive engagement following Marcus escalation email',
      day: 'Day 3'
    },
    {
      workflowId: 'bluesoft-account-overview',
      title: 'Account Overview with Contract Q&A',
      customerId: 'bluesoft-001',
      customerName: 'Bluesoft Industries',
      description: 'Review account overview with interactive contract, contacts, and pricing Q&A',
      day: 'Day 4'
    }
    // Additional workflows can be added here for extended demos
  ]
};

/**
 * Registry of all available workflow sequences
 */
export const workflowSequences: Record<string, WorkflowSequence> = {
  'bluesoft-demo-2025': bluesoftDemo2025
};

/**
 * Get a workflow sequence by ID
 */
export function getWorkflowSequence(sequenceId: string): WorkflowSequence | null {
  return workflowSequences[sequenceId] || null;
}

/**
 * Get a specific workflow from a sequence by index
 */
export function getWorkflowInSequence(
  sequenceId: string,
  index: number
): WorkflowSpec | null {
  const sequence = getWorkflowSequence(sequenceId);
  if (!sequence || index < 0 || index >= sequence.workflows.length) {
    return null;
  }
  return sequence.workflows[index];
}

/**
 * Get the next workflow in a sequence
 */
export function getNextWorkflowInSequence(
  sequenceId: string,
  currentIndex: number
): WorkflowSpec | null {
  return getWorkflowInSequence(sequenceId, currentIndex + 1);
}

/**
 * Check if there is a next workflow in the sequence
 */
export function hasNextWorkflow(
  sequenceId: string,
  currentIndex: number
): boolean {
  const sequence = getWorkflowSequence(sequenceId);
  if (!sequence) return false;
  return currentIndex < sequence.workflows.length - 1;
}

/**
 * Check if this is the last workflow in the sequence
 */
export function isLastWorkflow(
  sequenceId: string,
  currentIndex: number
): boolean {
  const sequence = getWorkflowSequence(sequenceId);
  if (!sequence) return true;
  return currentIndex >= sequence.workflows.length - 1;
}

/**
 * Get all available workflow sequences
 */
export function getAllWorkflowSequences(): WorkflowSequence[] {
  return Object.values(workflowSequences);
}
