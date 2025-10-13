'use client';

import ZenGreeting from '@/components/dashboard/ZenGreeting';
import PriorityWorkflowCard from '@/components/dashboard/PriorityWorkflowCard';
import { useRouter } from 'next/navigation';

export default function ZenDashboardPage() {
  const router = useRouter();

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
          <PriorityWorkflowCard
            workflowTitle="Complete Strategic Account Plan for Obsidian Black"
            priority="Critical"
            dueDate="Today"
            arr="$2.4M"
            onLaunch={handleLaunchWorkflow}
          />

          {/* Two columns for Today's Workflows and Quick Actions */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border border-gray-200 shadow-sm">
              <p className="text-center text-gray-400 text-sm">Today's Workflows (Coming Soon)</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border border-gray-200 shadow-sm">
              <p className="text-center text-gray-400 text-sm">Quick Actions (Coming Soon)</p>
            </div>
          </div>

          {/* When You're Ready section */}
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">"When You're Ready" Section (Coming Soon)</p>
          </div>
        </div>
      </div>
    </>
  );
}
