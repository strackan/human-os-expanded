/**
 * Hello World Workflow Definition
 *
 * Complete workflow showcasing the full WorkflowExecutor system:
 * - Customer Metrics panel (slides down from top)
 * - Chat interface (slides in from right)
 * - Artifacts panel (slides in from right)
 * - Task panel (slides in from right)
 * - Full step navigation and progress tracking
 */

import { WorkflowDefinition } from '../WorkflowExecutor';

export const helloWorldWorkflow: WorkflowDefinition = {
  id: 'hello-world',
  name: 'Hello World - Full System Demo',
  description: 'Experience the complete workflow system with all features enabled',
  steps: [
    {
      id: 'step-1',
      number: 1,
      title: 'Welcome to Full WorkflowExecutor',
      description: 'Explore all the powerful features available in the workflow system',
      component: 'GenericFormStep',
      artifacts: [
        {
          id: 'welcome-alert',
          type: 'alert',
          title: 'Welcome to the Complete Workflow Experience',
          config: {
            type: 'success',
            title: 'Full System Enabled!',
            message: 'This workflow demonstrates the complete WorkflowExecutor built Oct 9-10. Click the buttons in the header to explore:\n\n📊 Metrics - View customer data\n💬 Chat - Get contextual help\n⚡ Tasks - Manage action items',
            dismissible: false
          }
        },
        {
          id: 'feature-checklist',
          type: 'checklist',
          title: 'Available Features - Try Them All!',
          config: {
            items: [
              { id: 'metrics', label: 'Customer Metrics Panel (click 📊 Metrics button)', completed: false },
              { id: 'chat', label: 'Chat Interface (click 💬 Chat button)', completed: false },
              { id: 'tasks', label: 'Task Management (click ⚡ Tasks button)', completed: false },
              { id: 'artifacts', label: 'Artifacts Panel (this panel on the right)', completed: false },
              { id: 'navigation', label: 'Step Navigation (breadcrumbs at top)', completed: false }
            ],
            showProgress: true
          }
        }
      ]
    },
    {
      id: 'step-2',
      number: 2,
      title: 'Customer Context Demo',
      description: 'See how customer data flows through the system',
      component: 'GenericFormStep',
      artifacts: [
        {
          id: 'customer-info',
          type: 'status_grid',
          title: 'Customer Information',
          config: {
            columns: 2,
            items: [
              { label: 'Customer', value: 'Obsidian Black', status: 'neutral' },
              { label: 'Domain', value: 'obsidianblack.ops', status: 'neutral' },
              { label: 'Industry', value: 'Strategic Coordination', status: 'neutral' },
              { label: 'Workflow System', value: 'FULLY OPERATIONAL', status: 'complete' }
            ]
          }
        },
        {
          id: 'system-features',
          type: 'action_tracker',
          title: 'System Features',
          config: {
            showProgress: false,
            actions: [
              {
                id: 'feat-1',
                title: 'Real-time customer metrics from Supabase',
                owner: 'CustomerMetrics Component',
                status: 'complete',
                checkable: false
              },
              {
                id: 'feat-2',
                title: 'Persistent workflow state with auto-save',
                owner: 'WorkflowExecutor Core',
                status: 'complete',
                checkable: false
              },
              {
                id: 'feat-3',
                title: 'Contextual chat with workflow awareness',
                owner: 'WorkflowChatPanel',
                status: 'complete',
                checkable: false
              },
              {
                id: 'feat-4',
                title: 'Dynamic artifact rendering and management',
                owner: 'ArtifactDisplay',
                status: 'complete',
                checkable: false
              },
              {
                id: 'feat-5',
                title: 'Task tracking and assignment',
                owner: 'TaskPanel',
                status: 'complete',
                checkable: false
              }
            ]
          }
        }
      ]
    },
    {
      id: 'step-3',
      number: 3,
      title: 'Complete Your Journey',
      description: 'Finish the workflow and return to the dashboard',
      component: 'GenericFormStep',
      artifacts: [
        {
          id: 'completion-alert',
          type: 'alert',
          title: 'Ready to Complete',
          config: {
            type: 'info',
            title: 'You\'ve Explored the Full System',
            message: 'This workflow has demonstrated:\n\n✅ Customer metrics integration\n✅ Chat interface with contextual help\n✅ Task management capabilities\n✅ Artifact display and management\n✅ Step navigation and progress tracking\n✅ Auto-save functionality\n\nClick "Complete Workflow" below to finish.',
            dismissible: false
          }
        },
        {
          id: 'next-steps',
          type: 'checklist',
          title: 'Next Steps',
          config: {
            items: [
              { id: 'next-1', label: 'Try the Obsidian Black Strategic Planning workflow', completed: false },
              { id: 'next-2', label: 'Create your own workflow definitions', completed: false },
              { id: 'next-3', label: 'Customize customer metrics display', completed: false },
              { id: 'next-4', label: 'Configure workflow chat branches', completed: false }
            ],
            showProgress: true
          }
        }
      ]
    }
  ]
};
