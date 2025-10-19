/**
 * Establish Account Plan Workflow Definition
 *
 * Guides CSMs through evaluating a customer and selecting the appropriate
 * account plan (invest, expand, manage, monitor).
 *
 * Steps:
 * 1. Customer Context Review - Display key metrics and historical data
 * 2. Strategic Assessment - Guide CSM through evaluation questions
 * 3. Plan Selection - Select appropriate account plan
 * 4. Review & Confirm - Confirm decision and save
 *
 * Phase: Account Plan & Workflow Automation UI
 */

import { WorkflowDefinition } from '../WorkflowExecutor';

export const establishAccountPlanWorkflow: WorkflowDefinition = {
  id: 'establish-account-plan',
  name: 'Establish Account Plan',
  description: 'Evaluate customer strategic value and select appropriate engagement level',
  steps: [
    {
      id: 'step-1-context',
      number: 1,
      title: 'Customer Context Review',
      description: 'Review key customer metrics and relationship history',
      component: 'SimpleFormStep',
      artifacts: [
        {
          id: 'customer-metrics-dashboard',
          type: 'dashboard',
          title: 'Customer Overview',
          config: {
            metrics: [
              {
                label: 'ARR',
                value: '{{customer.arr}}',
                trend: 'up',
                trendValue: '+15%'
              },
              {
                label: 'Contract Status',
                value: '{{customer.contract_status}}',
                sublabel: '{{customer.renewal_date}}'
              },
              {
                label: 'Health Score',
                value: '{{customer.health_score}}',
                status: '{{customer.health_status}}'
              },
              {
                label: 'Engagement',
                value: '{{customer.engagement_score}}',
                trend: '{{customer.engagement_trend}}'
              }
            ]
          }
        },
        {
          id: 'renewal-history',
          type: 'table',
          title: 'Renewal History',
          config: {
            columns: [
              { key: 'date', label: 'Date', width: '30%' },
              { key: 'outcome', label: 'Outcome', width: '25%' },
              { key: 'arr_change', label: 'ARR Change', width: '25%' },
              { key: 'notes', label: 'Notes', width: '20%' }
            ],
            data: '{{customer.renewal_history}}',
            emptyMessage: 'No renewal history available'
          }
        }
      ]
    },
    {
      id: 'step-2-assessment',
      number: 2,
      title: 'Strategic Assessment',
      description: 'Answer key questions to evaluate customer strategic value',
      component: 'SimpleFormStep',
      artifacts: [
        {
          id: 'assessment-checklist',
          type: 'checklist',
          title: 'Assessment Factors',
          config: {
            items: [
              {
                id: 'arr-potential',
                text: 'High ARR or significant growth potential',
                status: 'pending'
              },
              {
                id: 'strategic-value',
                text: 'Strategic importance (market position, reference value)',
                status: 'pending'
              },
              {
                id: 'expansion-opportunity',
                text: 'Clear expansion or upsell opportunities identified',
                status: 'pending'
              },
              {
                id: 'health-risk',
                text: 'Health concerns or retention risks present',
                status: 'pending'
              },
              {
                id: 'relationship-quality',
                text: 'Strong executive relationships established',
                status: 'pending'
              }
            ]
          }
        }
      ]
    },
    {
      id: 'step-3-plan-selection',
      number: 3,
      title: 'Select Account Plan',
      description: 'Choose the appropriate engagement level for this customer',
      component: 'AccountPlanStep',
      artifacts: [
        {
          id: 'plan-recommendation',
          type: 'alert',
          title: 'AI Recommendation',
          config: {
            type: 'info',
            title: 'Recommended Plan: {{recommended_plan}}',
            message: 'Based on ARR ({{customer.arr}}), health score ({{customer.health_score}}), and engagement trends, we recommend the {{recommended_plan}} plan. This aligns with the customer\'s strategic value and current needs.',
            dismissible: false
          }
        }
      ]
    },
    {
      id: 'step-4-review',
      number: 4,
      title: 'Review & Confirm',
      description: 'Review your account plan selection and next steps',
      component: 'ReviewStep',
      artifacts: [
        {
          id: 'plan-summary',
          type: 'alert',
          title: 'Plan Established',
          config: {
            type: 'success',
            title: 'Account Plan Saved Successfully',
            message: 'The {{selected_plan}} plan has been applied to this account. Workflows will now be prioritized based on this engagement level.',
            dismissible: false
          }
        },
        {
          id: 'next-actions',
          type: 'action_tracker',
          title: 'Recommended Next Steps',
          config: {
            showProgress: false,
            actions: [
              {
                id: 'action-1',
                title: 'Review upcoming workflow queue',
                owner: 'You',
                deadline: 'Today',
                status: 'pending',
                checkable: false
              },
              {
                id: 'action-2',
                title: 'Schedule initial touchpoint based on plan cadence',
                owner: 'You',
                deadline: 'This week',
                status: 'pending',
                checkable: false
              },
              {
                id: 'action-3',
                title: 'Document strategic objectives in customer record',
                owner: 'You',
                deadline: 'This week',
                status: 'pending',
                checkable: false
              }
            ]
          }
        }
      ]
    }
  ]
};

export default establishAccountPlanWorkflow;
