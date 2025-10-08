/**
 * Test Workflow Definition
 *
 * Simple workflow for testing the workflow execution framework
 */

import { WorkflowDefinition } from '../WorkflowExecutor';

export const testWorkflowDefinition: WorkflowDefinition = {
  id: 'test-workflow',
  name: 'Test Workflow',
  description: 'A simple workflow to test the execution framework',
  steps: [
    {
      id: 'step-1',
      number: 1,
      title: 'Basic Information',
      description: 'Enter basic information to get started',
      component: 'GenericFormStep'
    },
    {
      id: 'step-2',
      number: 2,
      title: 'Details',
      description: 'Provide additional details',
      component: 'GenericFormStep'
    },
    {
      id: 'step-3',
      number: 3,
      title: 'Review',
      description: 'Review and confirm your information',
      component: 'GenericFormStep'
    }
  ]
};
