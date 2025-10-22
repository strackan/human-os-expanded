/**
 * Obsidian Black Dashboard V2 - Database-Driven Version
 *
 * This is a clone of the obsidian-black page but using the new:
 * - Slide library system
 * - Workflow composition
 * - Template hydration
 * - Database-driven config builder
 *
 * Compare to the original: src/app/obsidian-black/page.tsx
 */

'use client';

import { useState, useEffect } from 'react';
import ZenGreeting from '@/components/dashboard/ZenGreeting';
import PriorityWorkflowCard from '@/components/dashboard/PriorityWorkflowCard';
import TodaysWorkflows from '@/components/dashboard/TodaysWorkflows';
import QuickActions from '@/components/dashboard/QuickActions';
import WhenYouReReady from '@/components/dashboard/WhenYouReReady';
import TaskModeFullscreen from '@/components/workflows/TaskMode';
import confetti from 'canvas-confetti';

// V2 NOTE: For now, we're using the existing obsidian-black-pricing config
// to demonstrate that the V2 page works. The slide library system is still
// a work in progress for matching the exact UX of handcrafted workflows.
import { obsidianBlackPricingConfig } from '@/config/workflows/obsidianBlackPricing.config';
import type { WorkflowConfig } from '@/components/artifacts/workflows/config/WorkflowConfig';
import { registerWorkflowConfig } from '@/config/workflows/index';

interface PriorityWorkflow {
  id: string;
  title: string;
  customerId: string;
  customerName: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  dueDate: string;
  arr: string;
}

export default function ObsidianBlackDashboardV2() {
  const [priorityWorkflow, setPriorityWorkflow] = useState<PriorityWorkflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [taskModeOpen, setTaskModeOpen] = useState(false);
  const [completedWorkflowIds, setCompletedWorkflowIds] = useState<Set<string>>(new Set());

  // NEW: Store the generated config instead of just workflow ID
  const [workflowConfig, setWorkflowConfig] = useState<WorkflowConfig | null>(null);

  const triggerConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
      decay: 0.85,
      gravity: 1.2
    };

    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, { spread: 26, startVelocity: 110 });
    fire(0.2, { spread: 60, startVelocity: 100 });
    fire(0.35, { spread: 100, scalar: 0.8, startVelocity: 90 });
    fire(0.1, { spread: 120, startVelocity: 50, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 90 });
  };

  // NEW: Mock customer data (in production this comes from database)
  const mockCustomerData: WorkflowCustomerData = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Obsidian Black',
    domain: 'obsidianblack.com',
    industry: 'Technology',
    current_arr: 185000,
    health_score: 72,
    churn_risk_score: 3,
    utilization_percent: 85,
    contract_start_date: '2025-03-15',
    contract_end_date: '2026-03-15',
    renewal_date: '2026-03-15',
    days_until_renewal: 145,
    usage_score: 78,
    nps_score: 8,
    adoption_rate: 82,
    license_count: 100,
    active_users: 85,
    relationship_strength: 'strong',
    primary_contact: {
      id: 'contact-1',
      name: 'Sarah Johnson',
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah.johnson@obsidianblack.com',
      title: 'VP of Engineering',
      is_primary: true,
    },
  };

  useEffect(() => {
    // Simulate loading priority workflow from database
    setTimeout(() => {
      setPriorityWorkflow({
        id: 'obsidian-black-renewal',
        title: 'Renewal Planning for Obsidian Black',
        customerId: '550e8400-e29b-41d4-a716-446655440001',
        customerName: 'Obsidian Black',
        priority: 'Critical',
        dueDate: 'Today',
        arr: '$185K',
      });
      setLoading(false);
    }, 500);
  }, []);

  const handleLaunchWorkflow = async () => {
    if (!priorityWorkflow) return;

    try {
      // V2: Using existing config to show that the page works
      // TODO: Replace with slide library + hydration once it matches original UX
      console.log('🔧 Using obsidian-black-pricing config...');

      const config = obsidianBlackPricingConfig;
      console.log('✅ Config loaded successfully!', config);

      // Register the config so TaskMode can find it
      registerWorkflowConfig('obsidian-black-pricing', config);
      console.log('✅ Config registered in workflow registry');

      setWorkflowConfig(config);
      setTaskModeOpen(true);
    } catch (error) {
      console.error('❌ Error loading workflow config:', error);
    }
  };

  const handleWorkflowComplete = (completed?: boolean) => {
    setTaskModeOpen(false);

    if (completed && priorityWorkflow) {
      // Mark workflow as completed
      setCompletedWorkflowIds(prev => new Set(prev).add(priorityWorkflow.id));

      // Trigger confetti celebration
      setTimeout(() => triggerConfetti(), 100);

      // In production: Update database
      console.log('✅ Workflow completed!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header with version badge */}
      <div className="absolute top-4 right-4">
        <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
          V2: Database-Driven
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Zen Greeting */}
        <ZenGreeting />

        {/* Priority Workflow Card - Full Width */}
        {priorityWorkflow && (
          <div className="mb-8">
            <PriorityWorkflowCard
              workflow={priorityWorkflow}
              onLaunch={handleLaunchWorkflow}
              isCompleted={completedWorkflowIds.has(priorityWorkflow.id)}
            />
          </div>
        )}

        {/* Two columns: Today's Workflows + Quick Actions */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <TodaysWorkflows
            workflows={undefined}
            onWorkflowClick={(workflowId) => {
              console.log('Clicked workflow:', workflowId);
            }}
            completedWorkflowIds={completedWorkflowIds}
          />
          <QuickActions />
        </div>

        {/* When You're Ready Section */}
        <WhenYouReReady />

        {/* Info Panel - Shows what's different */}
        <div className="mt-8 bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            📋 V2 Status
          </h3>
          <div className="space-y-3 text-base text-gray-900">
            <div className="flex items-start">
              <span className="mr-2 text-lg">✅</span>
              <span>
                <strong className="font-bold">Layout Fixed:</strong> Priority card 100% width, Today's Plays + Quick Actions side-by-side
              </span>
            </div>
            <div className="flex items-start">
              <span className="mr-2 text-lg">✅</span>
              <span>
                <strong className="font-bold">Workflow Registry:</strong> Dynamic registration working - configs can be added at runtime
              </span>
            </div>
            <div className="flex items-start">
              <span className="mr-2 text-lg">🔄</span>
              <span>
                <strong className="font-bold">Using Original Config:</strong> Currently using obsidian-black-pricing config for exact UX match
              </span>
            </div>
            <div className="flex items-start">
              <span className="mr-2 text-lg">🚧</span>
              <span>
                <strong className="font-bold">Slide Library WIP:</strong> Slide library system exists but needs refinement to match handcrafted workflow UX
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-blue-300">
            <p className="text-sm text-gray-800 font-semibold">
              Compare: Original at <code className="bg-gray-200 px-2 py-1 rounded">/obsidian-black</code> vs V2 at <code className="bg-gray-200 px-2 py-1 rounded">/obsidian-black-v2</code>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Both should now have identical layout and workflow experience.
            </p>
          </div>
        </div>
      </div>

      {/* TaskMode Modal */}
      {taskModeOpen && workflowConfig && (
        <TaskModeFullscreen
          workflowId="obsidian-black-pricing"
          customerId={priorityWorkflow?.customerId || ''}
          customerName={priorityWorkflow?.customerName || ''}
          onClose={() => handleWorkflowComplete(false)}
          onComplete={handleWorkflowComplete}
        />
      )}
    </div>
  );
}
