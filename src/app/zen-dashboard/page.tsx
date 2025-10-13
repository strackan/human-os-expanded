'use client';

import { useState, useEffect } from 'react';
import ZenGreeting from '@/components/dashboard/ZenGreeting';
import PriorityWorkflowCard from '@/components/dashboard/PriorityWorkflowCard';
import TodaysWorkflows from '@/components/dashboard/TodaysWorkflows';
import QuickActions from '@/components/dashboard/QuickActions';
import WhenYouReReady from '@/components/dashboard/WhenYouReReady';
import { useRouter } from 'next/navigation';

interface PriorityWorkflow {
  id: string;
  title: string;
  customerId: string;
  customerName: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  dueDate: string;
  arr: string;
}

export default function ZenDashboardPage() {
  const router = useRouter();
  const [priorityWorkflow, setPriorityWorkflow] = useState<PriorityWorkflow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard/today-workflows');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const data = await response.json();
        setPriorityWorkflow(data.priorityWorkflow);
      } catch (error) {
        console.error('[Zen Dashboard] Error fetching data:', error);
        // Fallback to hardcoded data
        setPriorityWorkflow({
          id: 'obsblk-strategic-planning',
          title: 'Complete Strategic Account Plan for Obsidian Black',
          customerId: '550e8400-e29b-41d4-a716-446655440001',
          customerName: 'Obsidian Black',
          priority: 'Critical',
          dueDate: 'Today',
          arr: '$185K',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLaunchWorkflow = () => {
    // TODO: Navigate to workflow executor with proper workflow ID
    console.log('Launching Strategic Account Planning workflow...');
    // For now, navigate to demo-dashboard which has the workflow
    router.push('/demo-dashboard');
  };

  return (
    <>
      {/* Override the default max-width container for full gradient effect */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-purple-50 -z-10" />

      <div className="min-h-screen -mt-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-12">
        {/* Greeting Section */}
        <ZenGreeting className="mb-12" />

        {/* Placeholder for future sections */}
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
            />
          ) : null}

          {/* Two columns for Today's Workflows and Quick Actions */}
          <div className="grid grid-cols-2 gap-6">
            <TodaysWorkflows />
            <QuickActions />
          </div>

          {/* When You're Ready Divider */}
          <WhenYouReReady />

          {/* Below the fold content will go here */}
        </div>
      </div>
    </>
  );
}
