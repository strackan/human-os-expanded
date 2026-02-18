'use client';

/**
 * Dashboard Client Component
 *
 * Revamped dashboard with hero card, bounty system, and AI-native UX.
 * Above fold: ZenGreeting, DailyBountyStrip, HeroWorkflowCard, 3x SecondaryWorkflowCards
 * Below fold: "When You're Ready" divider, QuickActions
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import ZenGreeting from '@/components/dashboard/ZenGreeting';
import HeroWorkflowCard from '@/components/dashboard/HeroWorkflowCard';
import SecondaryWorkflowCard from '@/components/dashboard/SecondaryWorkflowCard';
import DailyBountyStrip from '@/components/dashboard/DailyBountyStrip';
import QuickActions from '@/components/dashboard/QuickActions';
import WhenYouReReady from '@/components/dashboard/WhenYouReReady';
import TaskModeFullscreen from '@/components/workflows/TaskMode';
import { useAuth } from '@/components/auth/AuthProvider';
import confetti from 'canvas-confetti';
import { createWorkflowExecution } from '@/lib/workflows/actions';
import { registerWorkflowConfig } from '@/config/workflows/index';
import { WorkflowConfig } from '@/components/artifacts/workflows/config/WorkflowConfig';
import { composeFromDatabase } from '@/lib/workflows/db-composer';
import { WorkflowPersistenceService } from '@/lib/persistence/WorkflowPersistenceService';
import { WorkflowQueryService, type WorkflowExecution } from '@/lib/workflows/actions/WorkflowQueryService';
import { calculateBountyPoints } from '@/lib/workflows/bounty';
import type { DashboardWorkflow } from '@/components/dashboard/HeroWorkflowCard';

/**
 * Fetch LLM-generated greeting from server API
 */
async function fetchGreetingFromAPI(params: {
  customerName: string;
  customerId?: string;
  workflowPurpose?: string;
  workflowType?: string;
  slideId?: string;
  fallbackGreeting?: string;
}): Promise<{ text: string; toolsUsed: string[]; tokensUsed: number; cached?: boolean }> {
  const response = await fetch('/api/workflows/greeting', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Greeting API failed: ${response.status}`);
  }

  return response.json();
}

export default function DashboardClient() {
  const { user } = useAuth();
  const [taskModeOpen, setTaskModeOpen] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState<{
    workflowId: string;
    title: string;
    customerId: string;
    customerName: string;
    prefetchedGreeting?: string;
  } | null>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<string>('in_progress');
  const [isLaunchingWorkflow, setIsLaunchingWorkflow] = useState(false);

  // Dashboard workflow state
  const [heroWorkflow, setHeroWorkflow] = useState<DashboardWorkflow | null>(null);
  const [secondaryWorkflows, setSecondaryWorkflows] = useState<DashboardWorkflow[]>([]);
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(true);

  // Bounty state
  const [dailyBounty, setDailyBounty] = useState({ earned: 0, goal: 100, streak: 0 });

  // Resume dialog state
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [resumableExecution, setResumableExecution] = useState<{
    executionId: string;
    slideIndex: number;
    savedAt: string;
  } | null>(null);
  const [pendingWorkflowConfig, setPendingWorkflowConfig] = useState<(WorkflowConfig & { workflowName?: string }) | null>(null);
  const [pendingGreeting, setPendingGreeting] = useState<string | null>(null);
  // Store which workflow is being launched for resume/fresh flow
  const [pendingLaunchWorkflow, setPendingLaunchWorkflow] = useState<DashboardWorkflow | null>(null);

  const userId = user?.id;

  // Fetch top 4 workflows on mount
  const fetchDashboardWorkflows = useCallback(async () => {
    if (!userId) return;

    setIsLoadingWorkflows(true);
    try {
      const queryService = new WorkflowQueryService();
      const result = await queryService.getActiveWorkflows(userId);

      if (result.success && result.workflows && result.workflows.length > 0) {
        const sorted = [...result.workflows].sort(
          (a, b) => (b.priority_score || 0) - (a.priority_score || 0)
        );

        const toDashboardWorkflow = (w: WorkflowExecution & { customers?: { current_arr?: number; health_score?: number; renewal_date?: string } }): DashboardWorkflow => ({
          id: w.id,
          workflowConfigId: w.workflow_config_id,
          workflowName: w.workflow_name,
          workflowType: w.workflow_type || 'renewal',
          customerId: w.customer_id,
          customerName: w.customer_name || 'Unknown Customer',
          priorityScore: w.priority_score || 0,
          currentArr: w.customers?.current_arr ?? undefined,
          healthScore: w.customers?.health_score ?? undefined,
          renewalDate: w.customers?.renewal_date ?? undefined,
        });

        setHeroWorkflow(toDashboardWorkflow(sorted[0]));
        setSecondaryWorkflows(sorted.slice(1, 4).map(toDashboardWorkflow));
      } else {
        setHeroWorkflow(null);
        setSecondaryWorkflows([]);
      }
    } catch (error) {
      console.error('[Dashboard] Error fetching workflows:', error);
      setHeroWorkflow(null);
      setSecondaryWorkflows([]);
    } finally {
      setIsLoadingWorkflows(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDashboardWorkflows();
  }, [fetchDashboardWorkflows]);

  // Fetch bounty data on mount
  useEffect(() => {
    if (!userId) return;

    const fetchBounty = async () => {
      try {
        const res = await fetch('/api/bounty');
        if (res.ok) {
          const data = await res.json();
          setDailyBounty({
            earned: data.earned ?? 0,
            goal: data.goal ?? 100,
            streak: data.streak ?? 0,
          });
        }
      } catch {
        // Bounty fetch is non-critical
      }
    };

    fetchBounty();
  }, [userId]);

  const triggerConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
      decay: 0.85,
      gravity: 1.2,
    };

    function fire(particleRatio: number, opts: Record<string, number>) {
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

  const handleLaunchWorkflow = async (workflow: DashboardWorkflow) => {
    console.log('[Dashboard] handleLaunchWorkflow called for:', workflow.customerName);

    if (!userId) {
      console.error('[Dashboard] No user ID available');
      return;
    }

    if (isLaunchingWorkflow) {
      console.log('[Dashboard] Already launching workflow, ignoring click');
      return;
    }

    setIsLaunchingWorkflow(true);

    try {
      console.time('[Dashboard] Total workflow launch time');

      const workflowId = workflow.workflowConfigId;
      const customerId = workflow.customerId;
      const customerName = workflow.customerName;

      const startTime = Date.now();

      const [workflowConfig, greetingResult] = await Promise.all([
        composeFromDatabase(
          workflowId,
          null,
          {
            name: customerName,
            current_arr: workflow.currentArr || 0,
            health_score: workflow.healthScore || 0,
            contract_end_date: workflow.renewalDate || '',
            days_until_renewal: workflow.daysUntilRenewal || 0,
            utilization: 0,
            monthsToRenewal: workflow.daysUntilRenewal ? Math.round(workflow.daysUntilRenewal / 30) : 0,
            seatCount: 0,
          }
        ).then(result => {
          console.log('[Dashboard] Workflow config loaded in', Date.now() - startTime, 'ms');
          return result;
        }),
        fetchGreetingFromAPI({
          customerName: customerName,
          customerId: customerId,
          workflowType: workflow.workflowType,
          slideId: 'greeting',
          fallbackGreeting: `Good afternoon! Let's prepare for ${customerName}'s renewal.`,
        }).then(result => {
          console.log('[Dashboard] LLM API returned in', Date.now() - startTime, 'ms');
          return result;
        }).catch(() => {
          return { text: `Good afternoon! Let's prepare for ${customerName}'s renewal.`, toolsUsed: [], tokensUsed: 0 };
        }),
      ]);

      if (!workflowConfig) {
        console.error('[Dashboard] Failed to load workflow config');
        setIsLaunchingWorkflow(false);
        alert('Workflow template not found. Please contact your administrator.');
        return;
      }

      registerWorkflowConfig(workflowId, workflowConfig as WorkflowConfig);

      // Check for resumable execution
      const resumable = await WorkflowPersistenceService.checkForResumable(
        workflowId,
        customerId,
        userId
      );

      if (resumable) {
        setPendingWorkflowConfig(workflowConfig);
        setPendingGreeting(greetingResult.text);
        setPendingLaunchWorkflow(workflow);
        setResumableExecution({
          executionId: resumable.executionId,
          slideIndex: resumable.snapshot.currentSlideIndex,
          savedAt: resumable.snapshot.savedAt,
        });
        setShowResumeDialog(true);
        setIsLaunchingWorkflow(false);
        return;
      }

      const executionResult = await createWorkflowExecution({
        workflowConfigId: workflowId,
        workflowName: (workflowConfig as WorkflowConfig & { workflowName?: string }).workflowName || workflow.workflowName,
        workflowType: workflow.workflowType,
        customerId: customerId,
        userId: userId,
        assignedCsmId: userId,
        totalSteps: workflowConfig.slides?.length || 0,
      });

      if (executionResult.success && executionResult.executionId) {
        setExecutionId(executionResult.executionId);
        setWorkflowStatus('in_progress');
      }

      setActiveWorkflow({
        workflowId: workflowId,
        title: (workflowConfig as WorkflowConfig & { workflowName?: string }).workflowName || workflow.workflowName,
        customerId: customerId,
        customerName: customerName,
        prefetchedGreeting: greetingResult.text,
      });

      setTaskModeOpen(true);
      console.timeEnd('[Dashboard] Total workflow launch time');
    } catch (error) {
      console.error('[Dashboard] Error launching workflow:', error);

      let errorMessage = 'Error launching workflow. ';
      const message = error instanceof Error ? error.message : '';
      if (message.includes('WORKFLOW_NOT_FOUND')) {
        errorMessage += 'The workflow template was not found in the database.';
      } else if (message.includes('DB_FETCH_ERROR')) {
        errorMessage += 'Unable to connect to the database.';
      } else {
        errorMessage += 'Please check the console for details.';
      }
      alert(errorMessage);
    } finally {
      setIsLaunchingWorkflow(false);
    }
  };

  const handleWorkflowComplete = async (completed?: boolean) => {
    setTaskModeOpen(false);

    if (completed) {
      // Record bounty points
      if (heroWorkflow) {
        try {
          const res = await fetch('/api/bounty/record', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ priorityScore: heroWorkflow.priorityScore }),
          });
          if (res.ok) {
            const data = await res.json();
            setDailyBounty(prev => ({
              ...prev,
              earned: data.earned ?? prev.earned,
              streak: data.streak ?? prev.streak,
            }));
          }
        } catch {
          // Non-critical
        }
      }

      setTimeout(() => triggerConfetti(), 100);
      console.log('[Dashboard] Workflow completed!');

      // Refresh workflows
      fetchDashboardWorkflows();
    }
  };

  const handleWorkflowAction = (actionType: string) => {
    console.log('[Dashboard] Workflow action performed:', actionType);

    if (actionType === 'snooze') {
      setWorkflowStatus('snoozed');
      setTaskModeOpen(false);
      setTimeout(() => {
        alert('Workflow snoozed! It will reappear when the snooze time expires.');
      }, 100);
    } else if (actionType === 'skip') {
      setWorkflowStatus('skipped');
      setTaskModeOpen(false);
      setTimeout(() => {
        alert('Workflow skipped and removed from your workflow list.');
      }, 100);
    } else if (actionType === 'escalate') {
      setWorkflowStatus('escalated');
      setTaskModeOpen(false);
      setTimeout(() => {
        alert('Workflow escalated! The new owner will see it in their workflow list.');
      }, 100);
    }

    // Refresh workflows after action
    fetchDashboardWorkflows();
  };

  // Resume dialog handlers
  const handleResumeWorkflow = () => {
    if (!resumableExecution || !pendingWorkflowConfig || !pendingLaunchWorkflow) return;

    setExecutionId(resumableExecution.executionId);
    setWorkflowStatus('in_progress');
    setActiveWorkflow({
      workflowId: pendingLaunchWorkflow.workflowConfigId,
      title: pendingWorkflowConfig.workflowName || pendingLaunchWorkflow.workflowName,
      customerId: pendingLaunchWorkflow.customerId,
      customerName: pendingLaunchWorkflow.customerName,
      prefetchedGreeting: undefined,
    });

    setShowResumeDialog(false);
    setResumableExecution(null);
    setPendingWorkflowConfig(null);
    setPendingGreeting(null);
    setPendingLaunchWorkflow(null);

    setTaskModeOpen(true);
  };

  const handleStartFresh = async () => {
    if (!pendingWorkflowConfig || !userId || !pendingLaunchWorkflow) return;

    setShowResumeDialog(false);

    const executionResult = await createWorkflowExecution({
      workflowConfigId: pendingLaunchWorkflow.workflowConfigId,
      workflowName: pendingWorkflowConfig.workflowName || pendingLaunchWorkflow.workflowName,
      workflowType: pendingLaunchWorkflow.workflowType,
      customerId: pendingLaunchWorkflow.customerId,
      userId: userId,
      assignedCsmId: userId,
      totalSteps: pendingWorkflowConfig.slides?.length || 0,
    });

    if (executionResult.success && executionResult.executionId) {
      setExecutionId(executionResult.executionId);
      setWorkflowStatus('in_progress');
    }

    setActiveWorkflow({
      workflowId: pendingLaunchWorkflow.workflowConfigId,
      title: pendingWorkflowConfig.workflowName || pendingLaunchWorkflow.workflowName,
      customerId: pendingLaunchWorkflow.customerId,
      customerName: pendingLaunchWorkflow.customerName,
      prefetchedGreeting: pendingGreeting || undefined,
    });

    setResumableExecution(null);
    setPendingWorkflowConfig(null);
    setPendingGreeting(null);
    setPendingLaunchWorkflow(null);

    setTaskModeOpen(true);
  };

  const handleCancelResume = () => {
    setShowResumeDialog(false);
    setResumableExecution(null);
    setPendingWorkflowConfig(null);
    setPendingGreeting(null);
    setPendingLaunchWorkflow(null);
  };

  // Calculate next workflow bounty points for the strip
  const nextWorkflowPoints = heroWorkflow
    ? calculateBountyPoints(heroWorkflow.priorityScore).points
    : undefined;

  return (
    <div
      id="dashboard-root"
      data-testid="dashboard-root"
      className="w-full min-h-screen"
      style={{ backgroundColor: 'var(--dashboard-bg, #f8f7f4)' }}
    >
      {/* ===== ABOVE THE FOLD ===== */}
      <div className="max-w-5xl mx-auto px-6 pt-8 pb-12 space-y-8">
        {/* Zen Greeting */}
        <section id="dashboard-greeting" data-testid="dashboard-greeting">
          <ZenGreeting className="mb-4" />
        </section>

        {/* Daily Bounty Strip */}
        <section id="dashboard-bounty" data-testid="dashboard-bounty">
          <DailyBountyStrip
            earned={dailyBounty.earned}
            goal={dailyBounty.goal}
            streak={dailyBounty.streak}
            nextWorkflowPoints={nextWorkflowPoints}
          />
        </section>

        {/* Hero Workflow Card */}
        {userId && (
          <section id="dashboard-hero" data-testid="dashboard-hero">
            <HeroWorkflowCard
              workflow={heroWorkflow}
              onLaunch={handleLaunchWorkflow}
              isLoading={isLoadingWorkflows}
              isLaunching={isLaunchingWorkflow}
            />
          </section>
        )}

        {/* Secondary Workflow Cards */}
        {secondaryWorkflows.length > 0 && (
          <section id="dashboard-secondary" data-testid="dashboard-secondary" className="grid grid-cols-3 gap-4">
            {secondaryWorkflows.map((w, i) => (
              <SecondaryWorkflowCard
                key={w.id}
                workflow={w}
                onClick={handleLaunchWorkflow}
                index={i}
              />
            ))}
          </section>
        )}
      </div>

      {/* ===== BELOW THE FOLD ===== */}
      <div className="max-w-5xl mx-auto px-6 pb-16 space-y-6">
        {/* When You're Ready divider */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.7 }}
          id="dashboard-secondary-nav"
          data-testid="dashboard-secondary-nav"
        >
          <WhenYouReReady />
        </motion.section>

        {/* Quick Actions */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.8 }}
          id="dashboard-quick-actions"
          data-testid="dashboard-quick-actions"
        >
          <QuickActions expandByDefault={false} />
        </motion.section>
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
            prefetchedGreeting={activeWorkflow.prefetchedGreeting}
          />
        </div>
      )}

      {/* Resume Workflow Dialog */}
      {showResumeDialog && resumableExecution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Resume Previous Session?</h2>
              <p className="text-gray-600">
                You have an in-progress workflow from{' '}
                {new Date(resumableExecution.savedAt).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Progress: Step {resumableExecution.slideIndex + 1}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleResumeWorkflow}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Resume Where I Left Off
              </button>
              <button
                onClick={handleStartFresh}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Start Fresh
              </button>
              <button
                onClick={handleCancelResume}
                className="w-full px-4 py-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
