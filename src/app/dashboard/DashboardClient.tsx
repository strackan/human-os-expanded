'use client';

/**
 * Dashboard Client Component
 *
 * Main production dashboard with zen aesthetic + Phase 3F components
 * Based on obsidian-black-v3 design, database-driven
 */

import { useState } from 'react';
import ZenGreeting from '@/components/dashboard/ZenGreeting';
import PriorityWorkflowCard from '@/components/dashboard/PriorityWorkflowCard';
import TodaysWorkflows from '@/components/dashboard/TodaysWorkflows';
import QuickActions from '@/components/dashboard/QuickActions';
import WhenYouReReady from '@/components/dashboard/WhenYouReReady';
import TaskModeFullscreen from '@/components/workflows/TaskMode';
import { useAuth } from '@/components/auth/AuthProvider';
import confetti from 'canvas-confetti';
import { createWorkflowExecution } from '@/lib/workflows/actions';
import { registerWorkflowConfig } from '@/config/workflows/index';
import { WorkflowConfig } from '@/components/artifacts/workflows/config/WorkflowConfig';
import { composeFromDatabase } from '@/lib/workflows/db-composer';

export default function DashboardClient() {
  const { user } = useAuth();
  const [taskModeOpen, setTaskModeOpen] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState<{
    workflowId: string;
    title: string;
    customerId: string;
    customerName: string;
  } | null>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<string>('in_progress');

  const userId = user?.id;

  const triggerConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
      decay: 0.85,
      gravity: 1.2,
    };

    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 26, startVelocity: 110 });
    fire(0.2, { spread: 60, startVelocity: 100 });
    fire(0.35, { spread: 100, scalar: 0.8, startVelocity: 90 });
    fire(0.1, { spread: 120, startVelocity: 50, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 90 });
  };

  const handleLaunchWorkflow = async () => {
    if (!userId) {
      console.error('[Dashboard] No user ID available');
      return;
    }

    try {
      console.log('[Dashboard] Launching database-driven workflow...');
      console.time('[Dashboard] Total workflow launch time');

      const workflowId = 'obsidian-black-renewal';
      const customerId = '550e8400-e29b-41d4-a716-446655440001';

      // Load workflow config from database
      const workflowConfig = await composeFromDatabase(
        workflowId,
        null, // company_id (null = stock workflow)
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
        console.error('[Dashboard] Failed to load workflow config');
        alert('Workflow template not found. Please contact your administrator to set up the "obsidian-black-renewal" workflow definition in the database.');
        return;
      }

      console.log('[Dashboard] Workflow loaded from database:', workflowConfig);

      // Register the config so TaskMode can find it
      registerWorkflowConfig(workflowId, workflowConfig as WorkflowConfig);
      console.log('[Dashboard] Config registered in workflow registry');

      // Create workflow execution record
      const executionResult = await createWorkflowExecution({
        workflowConfigId: workflowId,
        workflowName: (workflowConfig as any).workflowName || 'Renewal Planning',
        workflowType: 'renewal',
        customerId: customerId,
        userId: userId,
        assignedCsmId: userId,
        totalSteps: workflowConfig.slides?.length || 0,
      });

      if (executionResult.success && executionResult.executionId) {
        console.log('[Dashboard] Workflow execution created:', executionResult.executionId);
        setExecutionId(executionResult.executionId);
        setWorkflowStatus('in_progress');
      }

      // Set active workflow
      setActiveWorkflow({
        workflowId: workflowId,
        title: (workflowConfig as any).workflowName || 'Renewal Planning',
        customerId: customerId,
        customerName: 'Obsidian Black'
      });

      setTaskModeOpen(true);
      console.timeEnd('[Dashboard] Total workflow launch time');
    } catch (error: any) {
      console.error('[Dashboard] Error launching workflow:', error);
      console.timeEnd('[Dashboard] Total workflow launch time');

      // Provide helpful error messages based on error type
      let errorMessage = 'Error launching workflow. ';

      if (error.message?.includes('WORKFLOW_NOT_FOUND')) {
        errorMessage += 'The workflow template "obsidian-black-renewal" was not found in the database. Please contact your administrator to set up workflow definitions.';
      } else if (error.message?.includes('DB_FETCH_ERROR')) {
        errorMessage += 'Unable to connect to the database. Please check your connection and try again.';
      } else {
        errorMessage += 'Please check the console for details or contact support.';
      }

      alert(errorMessage);
    }
  };

  const handleWorkflowClick = (workflowId: string) => {
    console.log('[Dashboard] Workflow clicked:', workflowId);
    handleLaunchWorkflow();
  };

  const handleWorkflowComplete = (completed?: boolean) => {
    setTaskModeOpen(false);

    if (completed) {
      setTimeout(() => triggerConfetti(), 100);
      console.log('[Dashboard] Workflow completed!');
    }
  };

  const handleWorkflowAction = (actionType: string) => {
    console.log('[Dashboard] Workflow action performed:', actionType);

    if (actionType === 'snooze') {
      setWorkflowStatus('snoozed');
      setTaskModeOpen(false);
      setTimeout(() => {
        alert('✅ Workflow snoozed! It will reappear when the snooze time expires.');
      }, 100);
    } else if (actionType === 'skip') {
      setWorkflowStatus('skipped');
      setTaskModeOpen(false);
      setTimeout(() => {
        alert('✅ Workflow skipped and removed from your workflow list.');
      }, 100);
    } else if (actionType === 'escalate') {
      setWorkflowStatus('escalated');
      setTaskModeOpen(false);
      setTimeout(() => {
        alert('✅ Workflow escalated! The new owner will see it in their workflow list.');
      }, 100);
    }
  };

  return (
    <div id="dashboard-root" data-testid="dashboard-root" className="w-full">
        {/* Zen Greeting */}
        <section id="dashboard-greeting" data-testid="dashboard-greeting" className="dashboard-section dashboard-section--greeting">
          <ZenGreeting className="mb-12" />
        </section>

        {/* Main Dashboard Content */}
        <div id="dashboard-content" data-testid="dashboard-content" className="max-w-6xl mx-auto space-y-6 dashboard-content">
          {/* Priority Workflow Card - Database-Driven */}
          {userId && (
            <section id="dashboard-priority-workflow" data-testid="dashboard-priority-workflow" className="dashboard-section dashboard-section--priority">
              <PriorityWorkflowCard
                userId={userId}
                onLaunch={handleLaunchWorkflow}
              />
            </section>
          )}

          {/* Two columns: Today's Workflows + Quick Actions */}
          <section id="dashboard-main-grid" data-testid="dashboard-main-grid" className="grid grid-cols-2 gap-6 dashboard-section dashboard-section--main-grid">
            <div id="dashboard-workflows-column" data-testid="dashboard-workflows-column" className="dashboard-column dashboard-column--workflows">
              {userId ? (
                <TodaysWorkflows
                  userId={userId}
                  onWorkflowClick={(workflow) => handleWorkflowClick(workflow.workflowId)}
                />
              ) : (
                <TodaysWorkflows
                  onWorkflowClick={(workflow) => handleWorkflowClick(workflow.workflowId)}
                />
              )}
            </div>

            <div id="dashboard-actions-column" data-testid="dashboard-actions-column" className="dashboard-column dashboard-column--actions">
              <QuickActions expandByDefault={false} />
            </div>
          </section>

          {/* When You're Ready Divider */}
          <section id="dashboard-secondary-nav" data-testid="dashboard-secondary-nav" className="dashboard-section dashboard-section--secondary-nav">
            <WhenYouReReady />
          </section>
        </div>

      {/* TaskMode Modal */}
      {taskModeOpen && activeWorkflow && (
        <div id="dashboard-task-modal" data-testid="dashboard-task-modal" className="dashboard-modal dashboard-modal--task-mode">
          <TaskModeFullscreen
            workflowId={activeWorkflow.workflowId}
            workflowTitle={activeWorkflow.title}
            customerId={activeWorkflow.customerId}
            customerName={activeWorkflow.customerName}
            executionId={executionId || undefined}
            userId={userId || undefined}
            workflowStatus={workflowStatus}
            onClose={handleWorkflowComplete}
            onWorkflowAction={handleWorkflowAction}
          />
        </div>
      )}
    </div>
  );
}
