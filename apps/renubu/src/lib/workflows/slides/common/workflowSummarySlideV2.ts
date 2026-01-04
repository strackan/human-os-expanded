/**
 * Workflow Summary Slide V2 (Template-based)
 *
 * Uses Handlebars templates for chat messages and component references for artifacts.
 */

import type { SlideBuilderV2, SlideDefinitionV2, SlideContext } from '../baseSlide';

export const workflowSummarySlideV2: SlideBuilderV2 = (context?: SlideContext): SlideDefinitionV2 => {
  return {
    id: 'workflow-summary-v2',
    title: 'Summary',
    description: 'Plan summary and next steps',
    label: 'Summary',
    stepMapping: 'plan-summary',
    category: 'common',
    estimatedMinutes: 1,
    checklistTitle: 'Create action plan and next steps',
    requiredFields: [
      'customer.name',
      'customer.primaryContact.firstName',
    ],
    optionalFields: [],

    // Chat configuration using templates
    chat: {
      initialMessage: {
        text: {
          templateId: 'chat.summary.initial',
          context: context?.variables,
        },
        buttons: [
          { label: 'Complete', value: 'complete', 'label-background': 'bg-green-600 hover:bg-green-700', 'label-text': 'text-white' },
        ],
        nextBranches: {
          'complete': 'complete',
        },
      },
      branches: {
        'complete': {
          response: {
            templateId: 'chat.summary.complete',
          },
          delay: 1,
          actions: ['nextCustomer'],
        },
      },
    },

    // Artifact configuration using component references
    artifacts: {
      sections: [
        {
          id: 'plan-summary',
          title: 'Pricing Optimization Summary',
          component: {
            componentId: 'artifact.summary',
            props: context?.variables?.customer ? {
              tasksInitiated: [
                { id: '1', title: 'Market pricing analysis completed', completed: true, timestamp: 'Just now', assignee: 'AI' },
                { id: '2', title: `Renewal quote generated (Q-${new Date().getFullYear()}-${(context.variables.customer.name || 'CUST').substring(0, 2).toUpperCase()}-001)`, completed: true, timestamp: 'Just now', assignee: 'AI' },
                { id: '3', title: `Email draft prepared for ${context.variables.customer.primaryContact?.firstName}`, completed: true, timestamp: 'Just now', assignee: 'AI' },
                { id: '4', title: 'CRM updated with renewal strategy', completed: true, timestamp: 'Just now', assignee: 'AI' },
              ],
              accomplishments: [
                `Identified ${context.variables.pricing?.increasePercent}% pricing optimization opportunity ($${context.variables.pricing?.increaseAmount?.toLocaleString()} ARR increase)`,
                `Generated market-aligned quote bringing pricing to ${context.variables.pricing?.proposedPercentile}th percentile`,
                `Drafted personalized renewal email to ${context.variables.customer.primaryContact?.firstName} ${context.variables.customer.primaryContact?.lastName}`,
                'Established clear justification based on usage and market data',
              ],
              nextSteps: [
                {
                  id: '1',
                  title: `Send renewal quote email to ${context.variables.customer.primaryContact?.firstName}`,
                  description: 'Automated email with quote attachment and meeting request',
                  dueDate: 'Tomorrow',
                  type: 'ai',
                },
                {
                  id: '2',
                  title: 'Update CRM with pricing strategy',
                  description: 'All analysis and quote data synced to Salesforce automatically',
                  dueDate: 'Today',
                  type: 'ai',
                },
                {
                  id: '3',
                  title: `Set 3-day follow-up reminder`,
                  description: `I'll remind you to check on ${context.variables.customer.primaryContact?.firstName}'s response`,
                  dueDate: 'In 3 days',
                  type: 'ai',
                },
                {
                  id: '4',
                  title: `Schedule renewal discussion with ${context.variables.customer.primaryContact?.firstName}`,
                  description: '30-min call to present pricing strategy and discuss 2025 roadmap',
                  dueDate: 'This week',
                  type: 'user',
                },
                {
                  id: '5',
                  title: 'Review pricing justification before call',
                  description: `Refresh on key talking points: ${context.variables.customer.utilization}% utilization, market positioning`,
                  dueDate: 'Before call',
                  type: 'user',
                },
              ],
              followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }),
              salesforceUpdated: true,
              trackingEnabled: true,
            } : {
              // Default values for testing
              tasksInitiated: [
                { id: '1', title: 'Market pricing analysis completed', completed: true, timestamp: 'Just now', assignee: 'AI' },
                { id: '2', title: 'Renewal quote generated (Q-2025-OB-001)', completed: true, timestamp: 'Just now', assignee: 'AI' },
                { id: '3', title: 'Email draft prepared for Marcus', completed: true, timestamp: 'Just now', assignee: 'AI' },
                { id: '4', title: 'CRM updated with renewal strategy', completed: true, timestamp: 'Just now', assignee: 'AI' },
              ],
              accomplishments: [
                'Identified 8% pricing optimization opportunity ($14,800 ARR increase)',
                'Generated market-aligned quote bringing pricing to 50th percentile',
                'Drafted personalized renewal email to Marcus Chen',
                'Established clear justification based on usage and market data',
              ],
              nextSteps: [
                { id: '1', title: 'Send renewal quote email to Marcus', description: 'Automated email with quote attachment and meeting request', dueDate: 'Tomorrow', type: 'ai' },
                { id: '2', title: 'Update CRM with pricing strategy', description: 'All analysis and quote data synced to Salesforce automatically', dueDate: 'Today', type: 'ai' },
                { id: '3', title: 'Set 3-day follow-up reminder', description: "I'll remind you to check on Marcus's response", dueDate: 'In 3 days', type: 'ai' },
                { id: '4', title: 'Schedule renewal discussion with Marcus', description: '30-min call to present pricing strategy and discuss 2025 roadmap', dueDate: 'This week', type: 'user' },
                { id: '5', title: 'Review pricing justification before call', description: 'Refresh on key talking points: 87% utilization, market positioning', dueDate: 'Before call', type: 'user' },
              ],
              followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              salesforceUpdated: true,
              trackingEnabled: true,
            },
          },
          visible: true,
        },
      ],
    },

    tags: ['summary', 'completion', 'next-steps'],
    version: '2.0.0',
  };
};
