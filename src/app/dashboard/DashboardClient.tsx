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
import { createWorkflowExecution, getTestUserId } from '@/lib/workflows/actions';
import { registerWorkflowConfig } from '@/config/workflows/index';
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

      const workflowId = 'obsidian-black-renewal';
      const customerId = '550e8400-e29b-41d4-a716-446655440001';

      // Load workflow config from database
      const workflowConfig = await composeFromDatabase(
        workflowId,
        null, // company_id (null = stock workflow)
        {
          customer: {
            name: 'Obsidian Black',
            current_arr: 185000,
            health_score: 87,
            contract_end_date: '2026-10-21',
            days_until_renewal: 365,
            utilization: 87,
            monthsToRenewal: 12,
            seatCount: 50,
          }
        }
      );

      if (!workflowConfig) {
        console.error('[Dashboard] Failed to load workflow config');
        alert('Failed to load workflow configuration');
        return;
      }

      console.log('[Dashboard] Workflow loaded from database:', workflowConfig);

      // Register the config so TaskMode can find it
      registerWorkflowConfig(workflowId, workflowConfig);
      console.log('[Dashboard] Config registered in workflow registry');

      // Create workflow execution record
      const executionResult = await createWorkflowExecution({
        workflowConfigId: workflowId,
        workflowName: workflowConfig.workflowName || 'Renewal Planning',
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
        title: workflowConfig.workflowName || 'Renewal Planning',
        customerId: customerId,
        customerName: 'Obsidian Black'
      });

      setTaskModeOpen(true);
    } catch (error) {
      console.error('[Dashboard] Error launching workflow:', error);
      alert('Error launching workflow. Check console for details.');
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
    <div className="w-full">
        {/* Zen Greeting */}
        <ZenGreeting className="mb-12" />

        {/* Main Dashboard Content */}
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Priority Workflow Card - Database-Driven */}
          {userId && (
            <PriorityWorkflowCard
              userId={userId}
              onLaunch={handleLaunchWorkflow}
            />
          )}

          {/* Two columns: Today's Workflows + Quick Actions */}
          <div className="grid grid-cols-2 gap-6">
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

            <QuickActions expandByDefault={false} />
          </div>

          {/* When You're Ready Divider */}
          <WhenYouReReady />
        </div>

      {/* TaskMode Modal */}
      {taskModeOpen && activeWorkflow && (
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
      )}
    </div>
  );
}
