'use client';

/**
 * Phase 1.0 Snooze Testing Page - Simplified
 *
 * Standalone test environment for trigger-based workflow snoozing.
 * Tests: date triggers, event triggers, snooze modal, snoozed workflow display
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import TaskModeFullscreen from '@/components/workflows/TaskMode';
import { SnoozedWorkflowsList } from '@/components/workflows/SnoozedWorkflowCard';
import { createWorkflowExecution } from '@/lib/workflows/actions';
import { registerWorkflowConfig } from '@/config/workflows/index';
import { WorkflowConfig } from '@/components/artifacts/workflows/config/WorkflowConfig';
import { composeFromDatabase } from '@/lib/workflows/db-composer';
import { getSnoozedWorkflows, wakeWorkflowNow } from '@/lib/api/workflow-triggers';
import Button from '@/components/ui/Button';
import confetti from 'canvas-confetti';
import { SnoozedWorkflow } from '@/components/workflows/SnoozedWorkflowCard';

// Local type for workflow execution
interface WorkflowExecution {
  id: string;
  workflow_id?: string;
  workflow_name?: string | null;
  workflow_type?: string | null;
  title?: string | null;
  customer_id?: string | null;
  customer_name?: string | null;
  user_id?: string | null;
  status?: string;
  snoozed_at?: string | null;
  created_at?: string;
  assigned_to_name?: string | null;
  priority_score?: number | null;
  wake_triggers?: any;
  trigger_fired_at?: string | null;
  fired_trigger_type?: string | null;
  last_evaluated_at?: string | null;
  metadata?: any;
}

// Helper to transform WorkflowExecution to SnoozedWorkflow
const transformToSnoozedWorkflow = (execution: WorkflowExecution): SnoozedWorkflow => {
  return {
    id: execution.id,
    workflowName: execution.workflow_name || execution.title || 'Workflow',
    workflowType: execution.workflow_type || 'unknown',
    customerName: execution.customer_name || 'Unknown Customer',
    customerId: execution.customer_id || '',
    snoozedAt: execution.snoozed_at || execution.created_at,
    snoozedBy: execution.user_id || '',
    snoozedByName: execution.assigned_to_name || undefined,
    status: execution.status,
    priorityScore: execution.priority_score || undefined,
    wake_triggers: execution.wake_triggers as any,
    trigger_fired_at: execution.trigger_fired_at || undefined,
    fired_trigger_type: execution.fired_trigger_type || undefined,
    last_evaluated_at: execution.last_evaluated_at || undefined,
    metadata: execution.metadata || undefined,
  };
};

export default function SnoozeTestPage() {
  const { user } = useAuth();
  const [taskModeOpen, setTaskModeOpen] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState<{
    workflowId: string;
    title: string;
    customerId: string;
    customerName: string;
  } | null>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [snoozedWorkflows, setSnoozedWorkflows] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [testScenario, setTestScenario] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'launch' | 'snoozed'>('launch');

  const userId = user?.id;

  // Fetch snoozed workflows
  const fetchSnoozedWorkflows = async () => {
    if (!userId) {
      console.log('[SnoozeTest] fetchSnoozedWorkflows - no userId, skipping');
      return;
    }

    try {
      console.log('[SnoozeTest] Fetching snoozed workflows for userId:', userId);
      setFetchError(null);
      const response = await getSnoozedWorkflows(userId);
      console.log('[SnoozeTest] getSnoozedWorkflows response:', response);
      console.log('[SnoozeTest] Response type:', typeof response, 'Has workflows?', !!response?.workflows);

      // Extract workflows array from response object
      const workflowArray = Array.isArray(response?.workflows) ? response.workflows : [];
      console.log('[SnoozeTest] Setting snoozed workflows state with', workflowArray.length, 'items');
      setSnoozedWorkflows(workflowArray);
    } catch (error) {
      console.error('[SnoozeTest] Error fetching snoozed workflows:', error);
      setFetchError(error instanceof Error ? error.message : 'Failed to fetch snoozed workflows');
      setSnoozedWorkflows([]); // Ensure it's always an array on error
    }
  };

  useEffect(() => {
    if (userId) {
      fetchSnoozedWorkflows();
      // Refresh every 30 seconds to see trigger evaluations
      const interval = setInterval(fetchSnoozedWorkflows, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  const handleLaunchTestWorkflow = async (scenario: string) => {
    if (!userId) {
      alert('Please sign in to test snooze functionality');
      return;
    }

    setLoading(true);
    setTestScenario(scenario);

    try {
      const workflowId = 'obsidian-black-renewal';
      const customerId = '550e8400-e29b-41d4-a716-446655440001';

      // Load workflow config from database
      const workflowConfig = await composeFromDatabase(
        workflowId,
        null,
        {
          name: 'Obsidian Black',
          current_arr: 185000,
          health_score: 87,
          contract_end_date: '2026-10-21',
          days_until_renewal: 365,
          utilization: 87,
          monthsToRenewal: 12,
          seatCount: 50,
        }
      );

      if (!workflowConfig) {
        alert('Workflow template not found. Please ensure the database is seeded.');
        return;
      }

      // Register the config
      registerWorkflowConfig(workflowId, workflowConfig as WorkflowConfig);

      // Create workflow execution
      const result = await createWorkflowExecution({
        userId,
        workflowConfigId: workflowId,
        workflowName: 'Obsidian Black Renewal',
        workflowType: 'renewal',
        customerId,
        assignedCsmId: userId, // Assign to the same user for testing
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
      console.error('[SnoozeTest] Error launching workflow:', error);
      alert(`Failed to launch test workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTaskMode = () => {
    setTaskModeOpen(false);
    setActiveWorkflow(null);
    setExecutionId(null);
    fetchSnoozedWorkflows();
  };

  const handleCompleteWorkflow = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    handleCloseTaskMode();
  };

  const handleWakeNow = async (workflowId: string) => {
    try {
      await wakeWorkflowNow(workflowId, 'Manual wake from test page');
      await fetchSnoozedWorkflows();
      alert('Workflow woken successfully!');
    } catch (error) {
      console.error('[SnoozeTest] Error waking workflow:', error);
      alert('Failed to wake workflow');
    }
  };

  const handleViewDetails = async (workflowId: string) => {
    const workflow = snoozedWorkflows.find(w => w.id === workflowId);
    if (!workflow) return;

    setExecutionId(workflowId);
    setActiveWorkflow({
      workflowId: workflow.workflow_id || 'obsidian-black-renewal',
      title: workflow.title || 'Workflow',
      customerId: workflow.customer_id || '',
      customerName: 'Customer',
    });
    setTaskModeOpen(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please sign in to test snooze functionality</p>
          <Button className="w-full">
            <a href="/signin" className="block w-full">Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Phase 1.0 Snooze Testing
              </h1>
              <p className="text-gray-600">
                Test trigger-based workflow snoozing with date and event conditions
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-lg px-4 py-2 rounded-full border-2 border-purple-300 bg-purple-50 text-purple-700 font-medium">
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
            onClick={() => setActiveTab('snoozed')}
            className={`flex-1 px-4 py-3 rounded-md font-medium transition-all ${
              activeTab === 'snoozed'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Snoozed Workflows ({snoozedWorkflows.length})
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
                  {/* Date-Only */}
                  <div className="border-2 border-blue-500 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">📅 Date-Only Snooze</h3>
                    <p className="text-sm text-gray-700 mb-4">Test basic date-based snoozing (existing functionality)</p>
                    <Button
                      onClick={() => handleLaunchTestWorkflow('Date-Only')}
                      disabled={loading}
                      className="w-full"
                    >
                      Launch Test Workflow
                    </Button>
                  </div>

                  {/* Smart Snooze */}
                  <div className="border-2 border-purple-500 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">⚡ Date + Event Triggers</h3>
                    <p className="text-sm text-gray-700 mb-4">Test smart snoozing with multiple triggers (NEW)</p>
                    <Button
                      onClick={() => handleLaunchTestWorkflow('Smart Snooze')}
                      disabled={loading}
                      variant="primary"
                      className="w-full"
                    >
                      Launch Test Workflow
                    </Button>
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
                    <span>Click the snooze button in the workflow</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-blue-600">3.</span>
                    <span>Configure date and/or event triggers</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-blue-600">4.</span>
                    <span>Switch to "Snoozed Workflows" tab to see results</span>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* Snoozed Workflows Tab */}
          {activeTab === 'snoozed' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Snoozed Workflows</h2>
                  <Button onClick={fetchSnoozedWorkflows} size="sm">
                    🔄 Refresh
                  </Button>
                </div>

                {fetchError ? (
                  <div className="text-center py-12 text-red-600">
                    <p className="text-lg mb-2">Error loading snoozed workflows</p>
                    <p className="text-sm">{fetchError}</p>
                  </div>
                ) : snoozedWorkflows.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg mb-2">No snoozed workflows</p>
                    <p className="text-sm">Launch a test workflow and snooze it to see it here</p>
                  </div>
                ) : (
                  <SnoozedWorkflowsList
                    workflows={snoozedWorkflows.map(transformToSnoozedWorkflow)}
                    onWakeNow={handleWakeNow}
                    onViewDetails={handleViewDetails}
                  />
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
