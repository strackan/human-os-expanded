'use client';

/**
 * Phase 1.1 Skip Testing Page
 *
 * Standalone test environment for trigger-based workflow skipping.
 * Tests: date triggers, event triggers, skip modal, skipped workflow display
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import TaskModeFullscreen from '@/components/workflows/TaskMode';
import { createWorkflowExecution } from '@/lib/workflows/actions';
import { registerWorkflowConfig } from '@/config/workflows/index';
import { WorkflowConfig } from '@/components/artifacts/workflows/config/WorkflowConfig';
import { composeFromDatabase } from '@/lib/workflows/db-composer';
import { getSkippedWorkflows, reactivateWorkflowNow } from '@/lib/api/workflow-triggers';
import Button from '@/components/ui/Button';
// Removed unused import - confetti
// import confetti from 'canvas-confetti';

export default function SkipTestPage() {
  const { user } = useAuth();
  const [taskModeOpen, setTaskModeOpen] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState<{
    workflowId: string;
    title: string;
    customerId: string;
    customerName: string;
  } | null>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [skippedWorkflows, setSkippedWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'launch' | 'skipped'>('launch');

  const userId = user?.id;

  // Fetch skipped workflows
  const fetchSkippedWorkflows = async () => {
    if (!userId) return;

    try {
      setFetchError(null);
      const response = await getSkippedWorkflows(userId);
      setSkippedWorkflows(response.workflows || []);
    } catch (error) {
      console.error('[SkipTest] Error fetching skipped workflows:', error);
      setFetchError(error instanceof Error ? error.message : 'Failed to fetch skipped workflows');
      setSkippedWorkflows([]);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchSkippedWorkflows();
      const interval = setInterval(fetchSkippedWorkflows, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  const handleLaunchTestWorkflow = async (scenario: string) => {
    if (!userId) {
      alert('Please sign in to test skip functionality');
      return;
    }

    setLoading(true);

    try {
      const workflowId = 'obsidian-black-renewal';
      const customerId = '550e8400-e29b-41d4-a716-446655440001';

      const workflowConfig = await composeFromDatabase(workflowId, null, {
        name: 'Obsidian Black',
        current_arr: 185000,
        health_score: 87,
        contract_end_date: '2026-10-21',
        days_until_renewal: 365,
      });

      if (!workflowConfig) {
        alert('Workflow template not found. Please ensure the database is seeded.');
        return;
      }

      registerWorkflowConfig(workflowId, workflowConfig as WorkflowConfig);

      const result = await createWorkflowExecution({
        userId,
        workflowConfigId: workflowId,
        workflowName: 'Obsidian Black Renewal',
        workflowType: 'renewal',
        customerId,
        assignedCsmId: userId,
        totalSteps: 6,
      });

      if (!result.success || !result.executionId) {
        throw new Error(result.error || 'Failed to create workflow execution');
      }

      setExecutionId(result.executionId);
      setActiveWorkflow({
        workflowId,
        title: `${scenario} Test - Obsidian Black Renewal`,
        customerId,
        customerName: 'Obsidian Black',
      });
      setTaskModeOpen(true);
    } catch (error) {
      console.error('[SkipTest] Error launching workflow:', error);
      alert(`Failed to launch test workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipWorkflowDirectly = async () => {
    if (!userId) {
      alert('Please sign in to test skip functionality');
      return;
    }

    setLoading(true);

    try {
      const workflowId = 'obsidian-black-renewal';
      const customerId = '550e8400-e29b-41d4-a716-446655440001';

      // Create workflow execution
      const result = await createWorkflowExecution({
        userId,
        workflowConfigId: workflowId,
        workflowName: 'Obsidian Black Renewal (Skipped)',
        workflowType: 'renewal',
        customerId,
        assignedCsmId: userId,
        totalSteps: 6,
      });

      if (!result.success || !result.executionId) {
        throw new Error(result.error || 'Failed to create workflow execution');
      }

      // Immediately skip it with a simple date trigger (1 week from now)
      const oneWeekFromNow = new Date();
      oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

      const { skipWithTriggers } = await import('@/lib/api/workflow-triggers');
      const skipResult = await skipWithTriggers(
        result.executionId,
        [
          {
            id: 'auto-skip-1',
            type: 'date',
            config: { date: oneWeekFromNow.toISOString(), timezone: 'UTC' },
            createdAt: new Date().toISOString()
          }
        ],
        'Test workflow - skipped directly from test page',
        'OR'
      );

      if (skipResult.success) {
        alert('Workflow created and skipped successfully!');
        await fetchSkippedWorkflows();
      } else {
        throw new Error(skipResult.error || 'Failed to skip workflow');
      }
    } catch (error) {
      console.error('[SkipTest] Error skipping workflow directly:', error);
      alert(`Failed to skip workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTaskMode = () => {
    setTaskModeOpen(false);
    setActiveWorkflow(null);
    setExecutionId(null);
    fetchSkippedWorkflows();
  };

  // Removed unused function - handleCompleteWorkflow
  // const handleCompleteWorkflow = () => {
  //   confetti({
  //     particleCount: 100,
  //     spread: 70,
  //     origin: { y: 0.6 }
  //   });
  //   handleCloseTaskMode();
  // };

  const handleReactivateNow = async (workflowId: string) => {
    try {
      await reactivateWorkflowNow(workflowId, 'Manual reactivation from test page');
      await fetchSkippedWorkflows();
      alert('Workflow reactivated successfully!');
    } catch (error) {
      console.error('[SkipTest] Error reactivating workflow:', error);
      alert('Failed to reactivate workflow');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please sign in to test skip functionality</p>
          <Button className="w-full">
            <a href="/signin" className="block w-full">Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Phase 1.1 Skip Testing
              </h1>
              <p className="text-gray-600">
                Test trigger-based workflow skipping with date and event conditions
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-lg px-4 py-2 rounded-full border-2 border-orange-300 bg-orange-50 text-orange-700 font-medium">
              🧪 Test Mode
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm p-1 mb-6 flex gap-1">
          <button
            onClick={() => setActiveTab('launch')}
            className={`flex-1 px-4 py-3 rounded-md font-medium transition-all ${
              activeTab === 'launch'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Launch Test Workflows
          </button>
          <button
            onClick={() => setActiveTab('skipped')}
            className={`flex-1 px-4 py-3 rounded-md font-medium transition-all ${
              activeTab === 'skipped'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Skipped Workflows ({skippedWorkflows.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Launch Tab */}
          {activeTab === 'launch' && (
            <div className="space-y-6">
              {/* Test Scenarios */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Test Scenarios</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border-2 border-orange-500 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">📅 Date-Only Skip</h3>
                    <p className="text-sm text-gray-700 mb-4">Test basic date-based skipping</p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleLaunchTestWorkflow('Date-Only')}
                        disabled={loading}
                        className="flex-1 bg-orange-600 hover:bg-orange-700"
                      >
                        Launch
                      </Button>
                      <Button
                        onClick={() => handleSkipWorkflowDirectly()}
                        disabled={loading}
                        className="flex-1 bg-orange-500 hover:bg-orange-600"
                        title="Create and immediately skip workflow"
                      >
                        Skip Directly
                      </Button>
                    </div>
                  </div>

                  <div className="border-2 border-red-500 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">⚡ Date + Event Triggers</h3>
                    <p className="text-sm text-gray-700 mb-4">Test smart skipping with multiple triggers</p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleLaunchTestWorkflow('Smart Skip')}
                        disabled={loading}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                      >
                        Launch
                      </Button>
                      <Button
                        onClick={() => handleSkipWorkflowDirectly()}
                        disabled={loading}
                        className="flex-1 bg-red-500 hover:bg-red-600"
                        title="Create and immediately skip workflow"
                      >
                        Skip Directly
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Testing Instructions</h2>
                <ol className="space-y-3 text-gray-700">
                  <li className="flex gap-3">
                    <span className="font-bold text-orange-600">1.</span>
                    <span>Launch a test workflow using the buttons above</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-orange-600">2.</span>
                    <span>Click the skip button in the workflow</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-orange-600">3.</span>
                    <span>Configure date and/or event triggers</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-orange-600">4.</span>
                    <span>Switch to &quot;Skipped Workflows&quot; tab to see results</span>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* Skipped Workflows Tab */}
          {activeTab === 'skipped' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Skipped Workflows</h2>
                  <Button onClick={fetchSkippedWorkflows} size="sm">
                    🔄 Refresh
                  </Button>
                </div>

                {fetchError ? (
                  <div className="text-center py-12 text-red-600">
                    <p className="text-lg mb-2">Error loading skipped workflows</p>
                    <p className="text-sm">{fetchError}</p>
                  </div>
                ) : skippedWorkflows.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg mb-2">No skipped workflows</p>
                    <p className="text-sm">Launch a test workflow and skip it to see it here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {skippedWorkflows.map((workflow) => (
                      <div key={workflow.id} className="border border-orange-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {workflow.workflow_name || 'Workflow'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Skipped: {workflow.skipped_at ? new Date(workflow.skipped_at).toLocaleDateString() : 'Unknown'}
                            </p>
                          </div>
                          <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-medium rounded-full">
                            Skipped
                          </span>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button
                            onClick={() => handleReactivateNow(workflow.id)}
                            size="sm"
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            Reactivate Now
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Mode Modal */}
      {taskModeOpen && activeWorkflow && executionId && (
        <TaskModeFullscreen
          workflowId={activeWorkflow.workflowId}
          workflowTitle={activeWorkflow.title}
          customerId={activeWorkflow.customerId}
          customerName={activeWorkflow.customerName}
          executionId={executionId}
          userId={userId}
          onClose={handleCloseTaskMode}
        />
      )}
    </div>
  );
}
