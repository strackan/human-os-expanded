/**
 * Test Workflow Definition
 *
 * Simple workflow for testing the workflow execution framework
 */

import { WorkflowDefinition } from '../WorkflowExecutor';

export const testWorkflowDefinition: WorkflowDefinition = {
  id: 'test-workflow',
  name: 'Test Workflow',
  description: 'A workflow to test the execution framework with dashboard artifacts',
  steps: [
    {
      id: 'step-1',
      number: 1,
      title: 'Basic Information',
      description: 'Enter basic information to get started',
      component: 'GenericFormStep',
      // Inline artifacts below the step form
      artifacts: [
        {
          id: 'status-grid-1',
          type: 'status_grid',
          title: 'Current Status',
          config: {
            columns: 4,
            items: [
              { label: 'Contract Signed', value: '✅', status: 'complete', sublabel: 'Jan 15, 2025' },
              { label: 'Payment Received', value: '✅', status: 'complete', sublabel: '$725,000' },
              { label: 'Kickoff Scheduled', value: '⏳', status: 'pending', sublabel: 'Pending' },
              { label: 'Success Plan', value: '❌', status: 'error', sublabel: 'Not started' }
            ]
          }
        }
      ]
    },
    {
      id: 'step-2',
      number: 2,
      title: 'Customer Analysis',
      description: 'Generate a comprehensive dashboard with metrics and charts',
      component: 'CustomerAnalysisStep',
      // Inline artifacts: Countdown + Action Tracker
      artifacts: [
        {
          id: 'countdown-1',
          type: 'countdown',
          title: 'Time Until Renewal',
          autoRefresh: false,
          config: {
            targetDate: '2026-02-28T23:59:59',
            theme: 'default',
            thresholds: [
              { days: 30, message: 'Renewal approaching! Less than 30 days remaining.' },
              { days: 7, message: 'URGENT: Less than 1 week until renewal!' }
            ],
            statusItems: [
              { label: 'Contract Status', status: 'Active' },
              { label: 'Renewal Stage', status: 'Discovery' }
            ]
          }
        },
        {
          id: 'action-tracker-1',
          type: 'action_tracker',
          title: 'Action Items',
          config: {
            showProgress: true,
            actions: [
              {
                id: 'action-1',
                title: 'Schedule QBR with executive sponsor',
                owner: 'Sarah Johnson',
                deadline: 'Jan 25, 2025',
                status: 'complete',
                checkable: true
              },
              {
                id: 'action-2',
                title: 'Review usage metrics and prepare analysis',
                owner: 'Mike Chen',
                deadline: 'Jan 28, 2025',
                status: 'pending',
                checkable: true
              },
              {
                id: 'action-3',
                title: 'Prepare renewal proposal with pricing',
                owner: 'Sarah Johnson',
                deadline: 'Feb 5, 2025',
                status: 'pending',
                checkable: true
              },
              {
                id: 'action-4',
                title: 'Follow up on integration issues',
                owner: 'Tech Support',
                deadline: 'Jan 20, 2025',
                status: 'overdue',
                checkable: true
              }
            ]
          }
        }
      ]
    },
    {
      id: 'step-3',
      number: 3,
      title: 'Action Plan',
      description: 'Review and manage action items',
      component: 'GenericFormStep',
      // Timeline + Alert artifacts
      artifacts: [
        {
          id: 'timeline-1',
          type: 'timeline',
          title: 'Renewal Timeline',
          config: {
            events: [
              {
                date: 'Jan 15, 2025',
                title: 'Discovery Meeting Completed',
                description: 'Met with stakeholders to assess current usage and future needs',
                status: 'complete'
              },
              {
                date: 'Jan 28, 2025',
                title: 'Present Renewal Proposal',
                description: 'Share pricing and terms with decision makers',
                status: 'current'
              },
              {
                date: 'Feb 10, 2025',
                title: 'Negotiate Terms',
                description: 'Address concerns and finalize contract details',
                status: 'pending'
              },
              {
                date: 'Feb 28, 2025',
                title: 'Contract Renewal Deadline',
                description: 'Final date for contract execution',
                status: 'pending'
              }
            ]
          }
        },
        {
          id: 'alert-1',
          type: 'alert',
          title: 'Action Required',
          config: {
            type: 'warning',
            title: 'Overdue Action Item',
            message: 'The integration issue follow-up is overdue by 5 days. Please address immediately to prevent renewal risk.',
            dismissible: true
          }
        }
      ]
    },
    {
      id: 'step-4',
      number: 4,
      title: 'Review & Complete',
      description: 'Review all information and complete the workflow',
      component: 'GenericFormStep',
      // Success alert
      artifacts: [
        {
          id: 'alert-2',
          type: 'alert',
          title: 'Ready to Complete',
          config: {
            type: 'success',
            title: 'All Steps Complete',
            message: 'You have successfully completed all workflow steps. Click "Complete Workflow" to finish.',
            dismissible: false
          }
        }
      ]
    }
  ]
};
