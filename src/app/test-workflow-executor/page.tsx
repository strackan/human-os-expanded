/**
 * Test Workflow Executor Page
 *
 * Page for testing the workflow execution framework (Checkpoint 1)
 */

'use client';

import React from 'react';
import { WorkflowExecutor } from '@/components/workflows/WorkflowExecutor';
import { testWorkflowDefinition } from '@/components/workflows/definitions/testWorkflow';

export default function TestWorkflowExecutorPage() {
  const handleComplete = (executionId: string) => {
    console.log('Workflow completed:', executionId);
    alert(`Workflow completed successfully! Execution ID: ${executionId}`);
  };

  const handleExit = () => {
    console.log('User exited workflow');
    window.location.href = '/';
  };

  return (
    <div className="h-screen">
      <WorkflowExecutor
        workflowDefinition={testWorkflowDefinition}
        customerId="550e8400-e29b-41d4-a716-446655440001"
        onComplete={handleComplete}
        onExit={handleExit}
      />
    </div>
  );
}
