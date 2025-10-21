'use client';

import { useState, useEffect } from 'react';
import ZenGreeting from '@/components/dashboard/ZenGreeting';
import PriorityWorkflowCard from '@/components/dashboard/PriorityWorkflowCard';
import TodaysWorkflows from '@/components/dashboard/TodaysWorkflows';
import QuickActions from '@/components/dashboard/QuickActions';
import WhenYouReReady from '@/components/dashboard/WhenYouReReady';
import TaskModeFullscreen from '@/components/workflows/TaskMode';
import { useRouter, useSearchParams } from 'next/navigation';
import { getWorkflowSequence, getWorkflowInSequence, hasNextWorkflow } from '@/config/workflowSequences';
import confetti from 'canvas-confetti';

interface PriorityWorkflow {
  id: string;
  title: string;
  customerId: string;
  customerName: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  dueDate: string;
  arr: string;
}

export default function ObsidianBlackDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [priorityWorkflow, setPriorityWorkflow] = useState<PriorityWorkflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [taskModeOpen, setTaskModeOpen] = useState(false);
  const [completedWorkflowIds, setCompletedWorkflowIds] = useState<Set<string>>(new Set());

  // Workflow Sequence State
  const [sequenceId, setSequenceId] = useState<string | null>(null);
  const [sequenceIndex, setSequenceIndex] = useState<number>(0);
  const [activeWorkflow, setActiveWorkflow] = useState<{
    workflowId: string;
    title: string;
    customerId: string;
    customerName: string;
  } | null>(null);

  const triggerConfetti = () => {
    // Fire confetti from multiple positions - 2x faster with quick fadeout
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
      decay: 0.85, // Faster fadeout
      gravity: 1.2 // Faster fall
    };

    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 110,
    });

    fire(0.2, {
      spread: 60,
      startVelocity: 100,
    });

    fire(0.35, {
      spread: 100,
      scalar: 0.8,
      startVelocity: 90
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 50,
      scalar: 1.2
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 90,
    });
  };

  // Parse URL parameters for workflow sequences
  useEffect(() => {
    const sequence = searchParams.get('sequence');
    if (sequence) {
      const workflowSequence = getWorkflowSequence(sequence);
      if (workflowSequence) {
        setSequenceId(sequence);
        setSequenceIndex(0);

        // Prepare first workflow from sequence (but don't open modal yet)
        const firstWorkflow = getWorkflowInSequence(sequence, 0);
        if (firstWorkflow) {
          setActiveWorkflow(firstWorkflow);
          // Don't auto-open modal - let user click the button to start
        }
      }
    }
  }, [searchParams]);

  useEffect(() => {
    // Set hardcoded demo data for Obsidian Black
    setPriorityWorkflow({
      id: 'obsidian-black-pricing',
      title: 'Renewal Planning for Obsidian Black',
      customerId: '550e8400-e29b-41d4-a716-446655440001',
      customerName: 'Obsidian Black',
      priority: 'Critical',
      dueDate: 'Today',
      arr: '$185K',
    });
    setLoading(false);
  }, []);

  const handleLaunchWorkflow = () => {
    console.log('[Obsidian Black] Launching Pricing workflow...');
    // If in sequence mode, use activeWorkflow, otherwise use priorityWorkflow
    if (!sequenceId && priorityWorkflow) {
      setActiveWorkflow({
        workflowId: priorityWorkflow.id,
        title: priorityWorkflow.title,
        customerId: priorityWorkflow.customerId,
        customerName: priorityWorkflow.customerName,
      });
    }
    setTaskModeOpen(true);
  };

  const handleNextWorkflow = () => {
    if (!sequenceId) {
      // Not in sequence mode, just close
      setTaskModeOpen(false);
      return;
    }

    // Check if there's a next workflow in the sequence
    if (hasNextWorkflow(sequenceId, sequenceIndex)) {
      const nextIndex = sequenceIndex + 1;
      const nextWorkflow = getWorkflowInSequence(sequenceId, nextIndex);

      if (nextWorkflow) {
        console.log(`[Obsidian Black] Moving to workflow ${nextIndex + 1}:`, nextWorkflow.customerName);
        setSequenceIndex(nextIndex);
        setActiveWorkflow(nextWorkflow);
        // Keep modal open, just update the workflow
      }
    } else {
      // No more workflows, close modal
      console.log('[Obsidian Black] Sequence complete!');
      setTaskModeOpen(false);
      setSequenceId(null);
      setSequenceIndex(0);
      setActiveWorkflow(null);
    }
  };

  const handleJumpToWorkflow = (index: number) => {
    if (!sequenceId) return;

    const targetWorkflow = getWorkflowInSequence(sequenceId, index);
    if (targetWorkflow) {
      console.log(`[Obsidian Black] Jumping to workflow ${index + 1}:`, targetWorkflow.customerName);
      setSequenceIndex(index);
      setActiveWorkflow(targetWorkflow);
    }
  };

  const handleWorkflowClick = (workflow: { workflowId: string; title: string; customerId: string; customerName: string; }) => {
    // Find the index of this workflow in the sequence
    if (sequenceId) {
      const sequence = getWorkflowSequence(sequenceId);
      const index = sequence?.workflows.findIndex(w => w.workflowId === workflow.workflowId) ?? -1;
      if (index >= 0) {
        setSequenceIndex(index);
        setActiveWorkflow(workflow);
        setTaskModeOpen(true);
      }
    } else {
      // Not in sequence mode, launch single workflow
      setActiveWorkflow(workflow);
      setTaskModeOpen(true);
    }
  };

  return (
    <>
      {/* Override the default max-width container for full gradient effect */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-purple-50 -z-10" />

      <div className="min-h-screen -mt-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-12">
        {/* Greeting Section */}
        <ZenGreeting className="mb-12" />

        {/* Main Dashboard Content */}
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Priority Workflow Card */}
          {loading ? (
            <div className="bg-white rounded-3xl p-10 border border-gray-200 shadow-sm animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          ) : priorityWorkflow ? (
            <PriorityWorkflowCard
              workflowTitle={priorityWorkflow.title}
              priority={priorityWorkflow.priority}
              dueDate={priorityWorkflow.dueDate}
              arr={priorityWorkflow.arr}
              onLaunch={handleLaunchWorkflow}
              completed={completedWorkflowIds.has(priorityWorkflow.id)}
            />
          ) : null}

          {/* Two columns for Today's Plays and Quick Actions */}
          <div className="grid grid-cols-2 gap-6">
            <TodaysWorkflows
              workflows={sequenceId ? getWorkflowSequence(sequenceId)?.workflows : undefined}
              onWorkflowClick={handleWorkflowClick}
              completedWorkflowIds={completedWorkflowIds}
            />
            <QuickActions expandByDefault={true} />
          </div>

          {/* When You're Ready Divider */}
          <WhenYouReReady />

          {/* Below the fold content will go here */}
        </div>
      </div>

      {/* Task Mode Fullscreen - V3 Config-Driven Architecture */}
      {taskModeOpen && activeWorkflow && (
        <TaskModeFullscreen
          key={`${activeWorkflow.workflowId}-${sequenceIndex}`}
          workflowId={activeWorkflow.workflowId}
          workflowTitle={activeWorkflow.title}
          customerId={activeWorkflow.customerId}
          customerName={activeWorkflow.customerName}
          onClose={(completed?: boolean) => {
            if (completed && activeWorkflow) {
              // Mark workflow as completed
              setCompletedWorkflowIds(prev => new Set(prev).add(activeWorkflow.workflowId));

              // Trigger confetti effect
              setTimeout(() => {
                triggerConfetti();
              }, 100);
            }

            setTaskModeOpen(false);
            setSequenceId(null);
            setSequenceIndex(0);
            setActiveWorkflow(null);
          }}
          sequenceInfo={sequenceId ? {
            sequenceId,
            currentIndex: sequenceIndex,
            totalCount: getWorkflowSequence(sequenceId)?.workflows.length || 0,
            onNextWorkflow: handleNextWorkflow,
            onJumpToWorkflow: handleJumpToWorkflow
          } : undefined}
        />
      )}
    </>
  );
}
