'use client';

/**
 * Phase 1.2B Review Testing Page
 *
 * Standalone test environment for trigger-based workflow review system.
 * Tests: date triggers, event triggers, review modal, pending review workflow display
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import TaskModeFullscreen from '@/components/workflows/TaskMode';
import { createWorkflowExecution } from '@/lib/workflows/actions';
import { registerWorkflowConfig } from '@/config/workflows/index';
import { WorkflowConfig } from '@/components/artifacts/workflows/config/WorkflowConfig';
import { composeFromDatabase } from '@/lib/workflows/db-composer';
import { getPendingReviewWorkflows, approveWorkflowReview } from '@/lib/api/workflow-triggers';
import Button from '@/components/ui/Button';
// Removed unused import - confetti
// import confetti from 'canvas-confetti';

export default function ReviewTestPage() {
  const { user } = useAuth();
  const [taskModeOpen, setTaskModeOpen] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState<{
    workflowId: string;
    title: string;
    customerId: string;
    customerName: string;
  } | null>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [pendingReviewWorkflows, setPendingReviewWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'launch' | 'pending-review'>('launch');

  const userId = user?.id;

  // Fetch pending review workflows
  const fetchPendingReviewWorkflows = async () => {
    if (!userId) return;

    try {
      setFetchError(null);
      const response = await getPendingReviewWorkflows(userId);
      setPendingReviewWorkflows(response.workflows || []);
    } catch (error) {
      console.error('[ReviewTest] Error fetching pending review workflows:', error);
      setFetchError(error instanceof Error ? error.message : 'Failed to fetch pending review workflows');
      setPendingReviewWorkflows([]);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchPendingReviewWorkflows();
      const interval = setInterval(fetchPendingReviewWorkflows, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  const handleLaunchTestWorkflow = async (scenario: string) => {
    if (!userId) {
      alert('Please sign in to test review functionality');
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
      console.error('[ReviewTest] Error launching workflow:', error);
      alert(`Failed to launch test workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReviewDirectly = async () => {
    if (!userId) {
      alert('Please sign in to test review functionality');
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
        workflowName: 'Obsidian Black Renewal (Reviewd)',
        workflowType: 'renewal',
        customerId,
        assignedCsmId: userId,
        totalSteps: 6,
      });

      if (!result.success || !result.executionId) {
        throw new Error(result.error || 'Failed to create workflow execution');
      }

      // Immediately request review with a simple date trigger (1 day from now)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { requestReviewWithTriggers } = await import('@/lib/api/workflow-triggers');
      const reviewResult = await requestReviewWithTriggers(
        result.executionId,
        userId, // Request review from same user for testing
        [
          {
            id: 'auto-review-1',
            type: 'date',
            config: { date: tomorrow.toISOString(), timezone: 'UTC' },
            createdAt: new Date().toISOString()
          }
        ],
        'Test workflow - review requested directly from test page',
        'OR'
      );

      if (reviewResult.success) {
        alert('Workflow created and review requested successfully!');
        await fetchPendingReviewWorkflows();
      } else {
        throw new Error(reviewResult.error || 'Failed to request workflow review');
      }
    } catch (error) {
      console.error('[ReviewTest] Error requesting workflow review directly:', error);
      alert(`Failed to request workflow review: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTaskMode = () => {
    setTaskModeOpen(false);
    setActiveWorkflow(null);
    setExecutionId(null);
    fetchPendingReviewWorkflows();
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

  const handleApproveReview = async (workflowId: string) => {
    try {
      await approveWorkflowReview(workflowId, 'Manual approval from test page');
      await fetchPendingReviewWorkflows();
      alert('Workflow review approved successfully!');
    } catch (error) {
      console.error('[ReviewTest] Error approving review:', error);
      alert('Failed to approve review');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please sign in to test review functionality</p>
          <Button className="w-full">
            <a href="/signin" className="block w-full">Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Phase 1.2B Review Testing
              </h1>
              <p className="text-gray-600">
                Test trigger-based workflow review system with date and event conditions
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-lg px-4 py-2 rounded-full border-2 border-blue-300 bg-blue-50 text-blue-700 font-medium">
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
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Launch Test Workflows
          </button>
          <button
            onClick={() => setActiveTab('pending-review')}
            className={`flex-1 px-4 py-3 rounded-md font-medium transition-all ${
              activeTab === 'pending-review'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Pending Review Workflows ({pendingReviewWorkflows.length})
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
                  <div className="border-2 border-blue-500 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">📅 Date-Only Review</h3>
                    <p className="text-sm text-gray-700 mb-4">Test basic date-based review</p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleLaunchTestWorkflow('Date-Only')}
                        disabled={loading}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        Launch
                      </Button>
                      <Button
                        onClick={() => handleRequestReviewDirectly()}
                        disabled={loading}
                        className="flex-1 bg-blue-500 hover:bg-blue-600"
                        title="Create and immediately request workflow review"
                      >
                        Request Review Now
                      </Button>
                    </div>
                  </div>

                  <div className="border-2 border-blue-500 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">⚡ Date + Event Triggers</h3>
                    <p className="text-sm text-gray-700 mb-4">Test smart review with multiple triggers</p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleLaunchTestWorkflow('Smart Review')}
                        disabled={loading}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        Launch
                      </Button>
                      <Button
                        onClick={() => handleRequestReviewDirectly()}
                        disabled={loading}
                        className="flex-1 bg-blue-500 hover:bg-blue-600"
                        title="Create and immediately request workflow review"
                      >
                        Request Review Now
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
                    <span className="font-bold text-blue-600">1.</span>
                    <span>Launch a test workflow using the buttons above</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-blue-600">2.</span>
                    <span>Click the review button in the workflow</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-blue-600">3.</span>
                    <span>Select a reviewer and configure triggers</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-blue-600">4.</span>
                    <span>Switch to &quot;Pending Review Workflows&quot; tab to see results</span>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* Pending Review Workflows Tab */}
          {activeTab === 'pending-review' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Pending Review Workflows</h2>
                  <Button onClick={fetchPendingReviewWorkflows} size="sm">
                    🔄 Refresh
                  </Button>
                </div>

                {fetchError ? (
                  <div className="text-center py-12 text-blue-600">
                    <p className="text-lg mb-2">Error loading pending review workflows</p>
                    <p className="text-sm">{fetchError}</p>
                  </div>
                ) : pendingReviewWorkflows.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg mb-2">No pending review workflows</p>
                    <p className="text-sm">Launch a test workflow and request review to see it here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingReviewWorkflows.map((workflow) => (
                      <div key={workflow.id} className="border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {workflow.workflow_name || 'Workflow'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Review Requested: {workflow.review_requested_at ? new Date(workflow.review_requested_at).toLocaleDateString() : 'Unknown'}
                            </p>
                          </div>
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                            Pending Review
                          </span>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button
                            onClick={() => handleApproveReview(workflow.id)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Approve Review
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
