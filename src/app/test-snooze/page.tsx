'use client';

/**
 * Phase 1.0 Snooze Testing Page
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import confetti from 'canvas-confetti';
import { WorkflowExecution } from '@/types';
import { SnoozedWorkflow } from '@/components/workflows/SnoozedWorkflowCard';

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
  const [testScenario, setTestScenario] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'launch' | 'snoozed'>('launch');

  const userId = user?.id;

  // Fetch snoozed workflows
  const fetchSnoozedWorkflows = async () => {
    if (!userId) return;

    try {
      const workflows = await getSnoozedWorkflows(userId);
      setSnoozedWorkflows(workflows);
    } catch (error) {
      console.error('[SnoozeTest] Error fetching snoozed workflows:', error);
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
      console.log(`[SnoozeTest] Launching test workflow for scenario: ${scenario}`);

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
      const result = await createWorkflowExecution(
        userId,
        workflowId,
        customerId,
        {
          title: `${scenario} Test - Obsidian Black Renewal`,
          description: `Testing snooze functionality: ${scenario}`,
        }
      );

      if (!result.success || !result.executionId) {
        throw new Error(result.error || 'Failed to create workflow execution');
      }

      console.log('[SnoozeTest] Workflow execution created:', result.executionId);

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

    // Refresh snoozed workflows list
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
    // Find the workflow in snoozed list
    const workflow = snoozedWorkflows.find(w => w.id === workflowId);
    if (!workflow) return;

    // Reopen in task mode
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
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to test snooze functionality</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href="/signin">Sign In</a>
            </Button>
          </CardContent>
        </Card>
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
            <>
            <Card>
              <CardHeader>
                <CardTitle>Test Scenarios</CardTitle>
                <CardDescription>
                  Launch workflows to test different snooze scenarios
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date-Only Snooze */}
                <Card className="border-2 hover:border-blue-500 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg">📅 Date-Only Snooze</CardTitle>
                    <CardDescription>
                      Test basic date-based snoozing (existing functionality)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => handleLaunchTestWorkflow('Date-Only')}
                      disabled={loading}
                      className="w-full"
                    >
                      Launch Test Workflow
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      • Snooze until specific date<br/>
                      • Simple mode in snooze modal
                    </p>
                  </CardContent>
                </Card>

                {/* Date + Event Trigger */}
                <Card className="border-2 hover:border-purple-500 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg">⚡ Date + Event Triggers</CardTitle>
                    <CardDescription>
                      Test smart snoozing with multiple triggers (NEW)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => handleLaunchTestWorkflow('Smart Snooze')}
                      disabled={loading}
                      variant="default"
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      Launch Test Workflow
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      • Date OR event triggers<br/>
                      • Wake on customer login<br/>
                      • Wake on usage threshold
                    </p>
                  </CardContent>
                </Card>

                {/* Load Testing */}
                <Card className="border-2 hover:border-green-500 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg">🚀 Batch Processing</CardTitle>
                    <CardDescription>
                      Test multiple workflows for load testing
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => {
                        // Launch 5 workflows quickly
                        for (let i = 0; i < 5; i++) {
                          setTimeout(() => {
                            handleLaunchTestWorkflow(`Batch Test ${i + 1}`);
                          }, i * 1000);
                        }
                      }}
                      disabled={loading}
                      variant="outline"
                      className="w-full"
                    >
                      Launch 5 Test Workflows
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      • Tests batch evaluation<br/>
                      • Performance with multiple workflows
                    </p>
                  </CardContent>
                </Card>

                {/* Edge Cases */}
                <Card className="border-2 hover:border-orange-500 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg">🔧 Edge Cases</CardTitle>
                    <CardDescription>
                      Test error handling and edge scenarios
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => handleLaunchTestWorkflow('Edge Case')}
                      disabled={loading}
                      variant="outline"
                      className="w-full"
                    >
                      Launch Test Workflow
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      • Invalid triggers<br/>
                      • Past dates<br/>
                      • Conflicting conditions
                    </p>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            {/* Testing Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Testing Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">1. Launch a Test Workflow</h3>
                  <p className="text-sm text-gray-600">
                    Click any scenario above to launch the Obsidian Black renewal workflow
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">2. Click Snooze Button</h3>
                  <p className="text-sm text-gray-600">
                    In the workflow, find the "Review Later" or snooze button to test the enhanced snooze modal
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">3. Configure Triggers</h3>
                  <p className="text-sm text-gray-600">
                    Test both "Simple" (date-only) and "Smart" (date + event) modes
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">4. View Snoozed Workflows</h3>
                  <p className="text-sm text-gray-600">
                    Switch to "Snoozed Workflows" tab to see your snoozed workflows with trigger status
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">5. Test Wake Now</h3>
                  <p className="text-sm text-gray-600">
                    Use "Wake Now" button to manually wake a snoozed workflow (CSM override)
                  </p>
                </div>
              </CardContent>
            </Card>
            </>
          )}

          {/* Snoozed Workflows Tab */}
          {activeTab === 'snoozed' && (
            <>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Snoozed Workflows</CardTitle>
                    <CardDescription>
                      Workflows waiting for triggers to fire
                    </CardDescription>
                  </div>
                  <Button
                    onClick={fetchSnoozedWorkflows}
                    variant="outline"
                    size="sm"
                  >
                    🔄 Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {snoozedWorkflows.length === 0 ? (
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
              </CardContent>
            </Card>

            {/* Trigger Evaluation Info */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-900">ℹ️ Trigger Evaluation</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-800 space-y-2">
                <p>
                  <strong>Daily Evaluation:</strong> Triggers are evaluated once per day by the cron job
                </p>
                <p>
                  <strong>Date Triggers:</strong> Check if current date/time has passed the trigger date
                </p>
                <p>
                  <strong>Event Triggers:</strong> Check system events (customer login, usage thresholds, etc.)
                </p>
                <p>
                  <strong>Auto-refresh:</strong> This page refreshes snoozed workflows every 30 seconds
                </p>
              </CardContent>
            </Card>
            </>
          )}
        </div>
      </div>

      {/* Task Mode Modal */}
      {taskModeOpen && activeWorkflow && executionId && (
        <TaskModeFullscreen
          workflowId={activeWorkflow.workflowId}
          title={activeWorkflow.title}
          customerId={activeWorkflow.customerId}
          customerName={activeWorkflow.customerName}
          executionId={executionId}
          onClose={handleCloseTaskMode}
          onComplete={handleCompleteWorkflow}
        />
      )}
    </div>
  );
}
