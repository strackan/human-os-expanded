/**
 * Workflow Summary Stage Configuration
 *
 * Generates a reusable workflow summary artifact
 */

export interface WorkflowSummaryConfig {
  customerName: string;
  currentStage: string;
  progressPercentage: number;
  completedActions: string[];
  pendingActions: string[];
  nextSteps: string[];
  keyMetrics: {
    currentARR: string;
    projectedARR: string;
    growthRate: string;
    riskScore: string;
    renewalDate: string;
  };
  recommendations: string[];
}

/**
 * Creates a workflow summary artifact section
 *
 * @param config - Workflow summary configuration
 * @returns Artifact section for workflow summary
 */
export function createWorkflowSummaryStage(config: WorkflowSummaryConfig) {
  return {
    id: 'workflow-summary',
    title: 'Workflow Summary',
    type: 'workflow-summary' as const,
    visible: false,
    content: {
      customerName: config.customerName,
      currentStage: config.currentStage,
      progressPercentage: config.progressPercentage,
      completedActions: config.completedActions,
      pendingActions: config.pendingActions,
      nextSteps: config.nextSteps,
      keyMetrics: config.keyMetrics,
      recommendations: config.recommendations
    }
  };
}

/**
 * Default workflow summary configuration for Dynamic Corp
 */
export const dynamicCorpSummaryConfig: WorkflowSummaryConfig = {
  customerName: 'Dynamic Corp',
  currentStage: 'Needs Assessment',
  progressPercentage: 50,
  completedActions: [
    'Initial customer contact established',
    'Growth analysis completed (65% YoY growth)',
    'Expansion opportunity identified',
    'Email drafted to Michael Roberts (CTO)'
  ],
  pendingActions: [
    'Schedule follow-up meeting with Michael Roberts',
    'Prepare detailed expansion proposal',
    'Coordinate with technical team for APAC support details',
    'Review Series C funding impact on pricing'
  ],
  nextSteps: [
    'Wait for response to initial email (2-3 days)',
    'Prepare comprehensive renewal package',
    'Schedule technical consultation for APAC expansion',
    'Draft multi-year contract terms'
  ],
  keyMetrics: {
    currentARR: '$725,000',
    projectedARR: '$1,087,500',
    growthRate: '65%',
    riskScore: '2.1/10',
    renewalDate: 'Feb 28, 2026'
  },
  recommendations: [
    'Prioritize multi-year deal to lock in growth',
    'Leverage APAC expansion for premium pricing',
    'Use Series C funding as negotiation point',
    'Offer priority support as differentiator'
  ]
};
