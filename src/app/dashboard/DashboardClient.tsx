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
import WhenYouReReady from '@/components/dashboard/WhenYouReReady';
import TaskModeFullscreen from '@/components/workflows/TaskMode';
import { ZenNotificationBanner, ZenWorkflowStateTabs, ZenQuickInsights } from '@/components/dashboard/zen';
import { useAuth } from '@/components/auth/AuthProvider';
import confetti from 'canvas-confetti';
import { createWorkflowExecution, getTestUserId } from '@/lib/workflows/actions';
import { registerWorkflowConfig } from '@/config/workflows/index';

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
      console.log('[Dashboard] Launching workflow...');

      // For now, use a default workflow
      // TODO: This should be dynamic based on the clicked workflow
      setActiveWorkflow({
        workflowId: 'obsidian-black-renewal',
        title: 'Workflow',
        customerId: '550e8400-e29b-41d4-a716-446655440001',
        customerName: 'Customer'
      });

      setTaskModeOpen(true);
    } catch (error) {
      console.error('[Dashboard] Error launching workflow:', error);
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
    <>
      {/* Zen gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-purple-50 -z-10" />

      <div className="min-h-screen -mt-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-12">
        {/* Phase 3F: Notification Banner */}
        {userId && (
          <ZenNotificationBanner
            userId={userId}
            onWorkflowClick={handleWorkflowClick}
          />
        )}

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

          {/* Phase 3F: Workflow State Tabs */}
          {userId && (
            <ZenWorkflowStateTabs
              userId={userId}
              onWorkflowClick={handleWorkflowClick}
            />
          )}

          {/* Two columns: Today's Workflows + Quick Insights */}
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

            {userId && <ZenQuickInsights userId={userId} />}
          </div>

          {/* When You're Ready Divider */}
          <WhenYouReReady />
        </div>
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
    </>
  );
}
