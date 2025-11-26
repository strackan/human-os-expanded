/**
 * Workflow Summary Slide - Common Completion Slide
 *
 * Used at the END of ALL workflow types to summarize actions and create follow-up tasks.
 *
 * Reused in:
 * - Risk workflows (summarize mitigation actions)
 * - Opportunity workflows (summarize expansion plan)
 * - Strategic workflows (summarize strategic initiatives)
 * - Renewal workflows (summarize renewal actions)
 *
 * Context customization:
 * - workflowType: Type of workflow being summarized (risk, opportunity, strategic, renewal)
 * - completedActions: Array of actions taken during workflow
 * - nextSteps: Array of follow-up actions needed
 * - createTasks: Whether to create CRM tasks from next steps
 */

import { SlideBuilder, SlideContext, createSlideBuilder } from '../baseSlide';

/**
 * Summary intro messages by workflow type
 */
const SUMMARY_INTRO_MESSAGES: Record<string, string> = {
  risk: "Great work! You've completed the risk assessment workflow for {{customer.name}}. Here's a summary of what we accomplished.",
  opportunity: "Excellent! You've completed the expansion opportunity workflow for {{customer.name}}. Here's what we accomplished together.",
  strategic: "Well done! You've completed the strategic planning workflow for {{customer.name}}. Here's a summary of our strategic initiatives.",
  renewal: "Perfect! You've completed the renewal planning workflow for {{customer.name}}. Here's a summary of the renewal preparation.",
  default: "You've completed the workflow for {{customer.name}}. Here's a summary of what we accomplished.",
};

/**
 * Completion messages by workflow type
 */
const COMPLETION_MESSAGES: Record<string, string> = {
  risk: "The risk mitigation plan is now in place. Monitor progress on the action items and adjust as needed.",
  opportunity: "The expansion opportunity is well-positioned. Follow up on the next steps to move this forward.",
  strategic: "Your strategic plan is set. Execute on the initiatives and track progress against milestones.",
  renewal: "The renewal is on track. Complete the action items to ensure a smooth renewal process.",
  default: "Your action plan is ready. Follow through on the next steps to achieve the desired outcomes.",
};

/**
 * Default action categories by workflow type
 */
const ACTION_CATEGORIES: Record<string, string[]> = {
  risk: [
    'Risk Assessment Completed',
    'Mitigation Actions Identified',
    'Communications Sent',
    'Follow-up Scheduled',
  ],
  opportunity: [
    'Opportunity Analysis Completed',
    'Business Case Prepared',
    'Proposal Created',
    'Next Steps Defined',
  ],
  strategic: [
    'Strategic Review Completed',
    'Goals Aligned',
    'Initiatives Defined',
    'Timeline Established',
  ],
  renewal: [
    'Renewal Assessment Completed',
    'Contract Reviewed',
    'Pricing Prepared',
    'Timeline Confirmed',
  ],
  default: [
    'Assessment Completed',
    'Plan Created',
    'Actions Identified',
  ],
};

/**
 * Workflow Summary Slide Builder
 *
 * Reusable final slide for all workflow types.
 */
export const workflowSummarySlide: SlideBuilder = createSlideBuilder(
  {
    id: 'workflow-summary',
    name: 'Workflow Summary',
    category: 'common',
    description: 'Summary and next steps',
    estimatedMinutes: 3,
    requiredFields: ['customer.name'],
    checklistTitle: 'Create action plan and next steps',
  },
  (context?: SlideContext) => {
    const workflowType = (context?.purpose as string) || 'default';
    const completedActions = context?.variables?.completedActions || [];
    const nextSteps = context?.variables?.nextSteps || [];
    const createTasks = context?.variables?.createTasks !== false; // Default true
    const showConfetti = context?.variables?.showConfetti !== false; // Default true

    const introMessage = SUMMARY_INTRO_MESSAGES[workflowType] || SUMMARY_INTRO_MESSAGES.default;
    const completionMessage = COMPLETION_MESSAGES[workflowType] || COMPLETION_MESSAGES.default;
    const actionCategories = ACTION_CATEGORIES[workflowType] || ACTION_CATEGORIES.default;

    return {
      id: 'workflow-summary',
      title: 'Workflow Complete',
      description: 'Summary and next steps',
      label: 'Summary',
      stepMapping: 'workflow-summary',
      chat: {
        initialMessage: {
          text: introMessage,
          buttons: [
            {
              label: 'Complete Workflow',
              value: 'complete',
              'label-background': 'bg-green-600',
              'label-text': 'text-white',
            },
          ],
          nextBranches: {
            'complete': 'complete-workflow',
          },
        },
        branches: {
          'complete-workflow': {
            response: completionMessage,
            actions: ['closeWorkflow'],
          },
        },
      },
      artifacts: {
        sections: [
          {
            id: 'workflow-summary-doc',
            type: 'document',
            title: 'Workflow Summary',
            visible: true,
            content: `# {{customer.name}} - Workflow Summary

**Workflow Type**: ${workflowType.charAt(0).toUpperCase() + workflowType.slice(1)}
**Completed**: {{current_date}}

---

## What We Accomplished

${actionCategories.map((cat, i) => `### ${i + 1}. ${cat}\n✓ Completed`).join('\n\n')}

---

## Next Steps

${nextSteps.length > 0
  ? nextSteps.map((step: any, i: number) => {
      const s = typeof step === 'string' ? step : step.description;
      return `${i + 1}. ${s}`;
    }).join('\n')
  : '- Monitor progress on action items\n- Stay in regular contact with {{customer.name}}\n- Update CRM with latest information'}

---

## Recommendations

- **Monitor**: Track progress on action items and adjust as needed
- **Follow Up**: Stay in regular contact with {{customer.name}} to ensure success
- **Update CRM**: Keep customer records current with latest information

---

*${completionMessage}*
`,
          },
        ],
      },
      layout: 'side-by-side',
      chatInstructions: [
        `You are helping wrap up a customer success workflow.`,
        ``,
        `Workflow type: ${workflowType}`,
        ``,
        `The workflow is now complete. Answer questions about:`,
        `- Actions completed during the workflow`,
        `- Next steps and follow-up items`,
        `- Task management and tracking`,
        `- Best practices for follow-through`,
        `- How to monitor progress`,
        ``,
        `Available context:`,
        `- Customer: {{customer.name}}`,
        `- Completed: ${completedActions.length} actions`,
        `- Next Steps: ${nextSteps.length} follow-up items`,
      ].join('\n'),

      artifactPanel: {
        title: 'Workflow Complete',
        content: [
          {
            type: 'intro' as const,
            content: introMessage,
          },
          completedActions.length > 0
            ? {
                type: 'section' as const,
                title: 'What We Accomplished',
                subsections: actionCategories.map((category, categoryIndex) => ({
                  title: category,
                  items:
                    completedActions
                      .filter((action: any) => action.category === category || categoryIndex === 0)
                      .map((action: any, index: number) => ({
                        label: `${index + 1}`,
                        value: typeof action === 'string' ? action : action.description,
                        type: 'text' as const,
                        icon: '✓' as const,
                      })) || [],
                })),
              }
            : {
                type: 'section' as const,
                title: 'What We Accomplished',
                subsections: [
                  {
                    title: 'Summary',
                    items: [
                      {
                        label: 'Status',
                        value: 'Workflow completed successfully',
                        type: 'text' as const,
                        icon: '✓' as const,
                      },
                    ],
                  },
                ],
              },
          nextSteps.length > 0
            ? {
                type: 'section' as const,
                title: 'Next Steps',
                subsections: [
                  {
                    title: 'Action Items',
                    items: nextSteps.map((step: any, index: number) => {
                      const stepData = typeof step === 'string' ? { description: step } : step;
                      return {
                        label: `${index + 1}`,
                        value: stepData.description,
                        type: 'text' as const,
                        helpText: stepData.dueDate ? `Due: ${stepData.dueDate}` : undefined,
                        badge: stepData.priority || undefined,
                      };
                    }),
                  },
                ],
              }
            : null,
          createTasks
            ? {
                type: 'section' as const,
                title: 'Task Management',
                subsections: [
                  {
                    title: 'CRM Tasks',
                    items: [
                      {
                        label: 'Status',
                        value: nextSteps.length > 0
                          ? `${nextSteps.length} task(s) will be created in your CRM`
                          : 'No follow-up tasks to create',
                        type: 'text' as const,
                        icon: nextSteps.length > 0 ? 'task' : 'info',
                      },
                      nextSteps.length > 0
                        ? {
                            label: 'Location',
                            value: 'Tasks will appear in {{customer.name}}\'s account timeline',
                            type: 'text' as const,
                          }
                        : null,
                    ].filter(Boolean) as Array<{
                      label: string;
                      value: string;
                      type: string;
                      icon?: string;
                    }>,
                  },
                ],
              }
            : null,
          {
            type: 'section' as const,
            title: 'What\'s Next',
            subsections: [
              {
                title: 'Recommendations',
                items: [
                  {
                    label: 'Monitor',
                    value: 'Track progress on action items and adjust as needed',
                    type: 'text' as const,
                  },
                  {
                    label: 'Follow Up',
                    value: 'Stay in regular contact with {{customer.name}} to ensure success',
                    type: 'text' as const,
                  },
                  {
                    label: 'Update CRM',
                    value: 'Keep customer records current with latest information',
                    type: 'text' as const,
                  },
                ],
              },
            ],
          },
          {
            type: 'completion' as const,
            message: completionMessage,
            showConfetti: showConfetti,
          },
        ].filter(Boolean),
      },

      flowControl: {
        nextSlideLabel: 'Complete Workflow',
        canSkip: false, // Cannot skip summary
        isLastSlide: true,
      },
    };
  }
);

/**
 * Usage Examples:
 *
 * // Risk workflow summary
 * workflowSummarySlide({
 *   purpose: 'risk',
 *   variables: {
 *     completedActions: [
 *       { category: 'Risk Assessment Completed', description: 'Assessed impact of executive departure' },
 *       { category: 'Communications Sent', description: 'Sent outreach email to new contact' },
 *       { category: 'Follow-up Scheduled', description: 'Scheduled intro call for next week' }
 *     ],
 *     nextSteps: [
 *       { description: 'Complete intro call with new executive', dueDate: '2025-10-28', priority: 'High' },
 *       { description: 'Send follow-up materials after call', dueDate: '2025-10-29', priority: 'Medium' },
 *       { description: 'Update health score based on call outcome', dueDate: '2025-10-30', priority: 'Medium' }
 *     ],
 *     createTasks: true,
 *     showConfetti: true
 *   }
 * })
 *
 * // Opportunity workflow summary
 * workflowSummarySlide({
 *   purpose: 'opportunity',
 *   variables: {
 *     completedActions: [
 *       { category: 'Opportunity Analysis Completed', description: 'Analyzed expansion potential' },
 *       { category: 'Business Case Prepared', description: 'Created ROI analysis' },
 *       { category: 'Proposal Created', description: 'Prepared expansion quote' }
 *     ],
 *     nextSteps: [
 *       { description: 'Send expansion proposal to decision maker', dueDate: '2025-10-25', priority: 'High' },
 *       { description: 'Schedule demo call', dueDate: '2025-11-01', priority: 'High' },
 *       { description: 'Follow up on proposal', dueDate: '2025-11-05', priority: 'Medium' }
 *     ],
 *     createTasks: true
 *   }
 * })
 *
 * // Renewal workflow summary
 * workflowSummarySlide({
 *   purpose: 'renewal',
 *   variables: {
 *     completedActions: [
 *       { category: 'Renewal Assessment Completed', description: 'Reviewed account health' },
 *       { category: 'Contract Reviewed', description: 'Analyzed current contract terms' },
 *       { category: 'Pricing Prepared', description: 'Created renewal quote' },
 *       { category: 'Timeline Confirmed', description: 'Established renewal timeline' }
 *     ],
 *     nextSteps: [
 *       { description: 'Send renewal proposal to customer', dueDate: '2025-10-23', priority: 'High' },
 *       { description: 'Schedule renewal planning call', dueDate: '2025-10-25', priority: 'High' },
 *       { description: 'Prepare for contract negotiations', dueDate: '2025-11-01', priority: 'Medium' }
 *     ],
 *     createTasks: true
 *   }
 * })
 *
 * // Strategic workflow summary
 * workflowSummarySlide({
 *   purpose: 'strategic',
 *   variables: {
 *     completedActions: [
 *       { category: 'Strategic Review Completed', description: 'Completed quarterly business review' },
 *       { category: 'Goals Aligned', description: 'Aligned on strategic priorities' },
 *       { category: 'Initiatives Defined', description: 'Defined key initiatives for next quarter' }
 *     ],
 *     nextSteps: [
 *       { description: 'Share QBR summary with stakeholders', dueDate: '2025-10-22', priority: 'High' },
 *       { description: 'Schedule follow-up on strategic initiative #1', dueDate: '2025-11-01', priority: 'Medium' },
 *       { description: 'Review progress on metrics', dueDate: '2025-11-15', priority: 'Medium' }
 *     ],
 *     createTasks: true
 *   }
 * })
 */
