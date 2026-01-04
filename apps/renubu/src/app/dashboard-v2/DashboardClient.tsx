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
import { HybridWorkflowComposer } from '@/lib/services/HybridWorkflowComposer';

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

      const workflowId = 'obsidian-black-renewal-v2';
      const customerId = '550e8400-e29b-41d4-a716-446655440001';

      const customerContext = {
        name: 'Obsidian Black',
        current_arr: 185000,
        health_score: 87,
        contract_end_date: '2026-10-21',
        days_until_renewal: 365,
        utilization: 87,
        monthsToRenewal: 12,
        seatCount: 50,
      };

      // FULL NEW MODE: All 6 steps now use NEW template system (v1.9)
      const workflowConfig = await HybridWorkflowComposer.compose({
        workflowId,
        templateName: 'obsidian_black_renewal',
        customerId,
        userId,
        customerContext,
        useNewSlides: [0, 1, 2, 3, 4, 5] // All 6 steps: greeting + review + pricing + quote + email + summary
      });

      if (!workflowConfig) {
        console.error('[Dashboard-v2] Failed to load workflow config from HybridComposer');
        alert('Failed to load hybrid workflow. Check console for details.');
        return;
      }

      console.log('[Dashboard-v2] Hybrid workflow config loaded successfully:', {
        slides: workflowConfig.slides?.length,
        hybridInfo: (workflowConfig as any)._hybridInfo
      });

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
    console.log('[Dashboard] handleWorkflowComplete called with completed =', completed);
    setTaskModeOpen(false);

    if (completed) {
      console.log('[Dashboard] Triggering confetti in 100ms...');
      setTimeout(() => {
        console.log('[Dashboard] Firing confetti now!');
        triggerConfetti();
      }, 100);
      console.log('[Dashboard] Workflow completed!');
    } else {
      console.log('[Dashboard] No confetti - completed was not true');
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
        {/* V2 Dashboard Indicator */}
        <div className="bg-green-100 border-l-4 border-green-500 text-green-800 p-4 mb-4" role="alert">
          <p className="font-bold">Dashboard v2 - Full Template Migration Complete ✓</p>
          <p className="text-sm">
            <strong>All 6 Steps:</strong> <span className="bg-green-200 px-2 py-0.5 rounded">NEW (v1.9 Template System)</span><br/>
            <span className="text-xs text-green-700">Greeting → Review → Pricing → Quote → Email → Summary</span>
          </p>
        </div>

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
