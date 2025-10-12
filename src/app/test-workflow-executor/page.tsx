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
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(true);

  // Track sidebar state for positioning
  React.useEffect(() => {
    const checkSidebarState = () => {
      const sidebar = document.querySelector('#global-sidebar');
      if (sidebar) {
        const isCollapsed = sidebar.getAttribute('data-collapsed') === 'true';
        setSidebarCollapsed(isCollapsed);
      }
    };

    checkSidebarState();

    const sidebar = document.querySelector('#global-sidebar');
    if (sidebar) {
      const observer = new MutationObserver(checkSidebarState);
      observer.observe(sidebar, { attributes: true, attributeFilter: ['data-collapsed'] });
      return () => observer.disconnect();
    }
  }, []);

  const handleComplete = (executionId: string) => {
    console.log('Workflow completed:', executionId);
    alert(`Workflow completed successfully! Execution ID: ${executionId}`);
  };

  const handleExit = () => {
    console.log('User exited workflow');
    window.location.href = '/';
  };

  return (
    <div
      className={`fixed top-16 right-0 bottom-0 ${sidebarCollapsed ? 'left-16' : 'left-64'} transition-all duration-300`}
    >
      <WorkflowExecutor
        workflowDefinition={testWorkflowDefinition}
        customerId="550e8400-e29b-41d4-a716-446655440001"
        onComplete={handleComplete}
        onExit={handleExit}
      />
    </div>
  );
}
