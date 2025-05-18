import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import KeyMetricsCard from '@/components/metrics/KeyMetricsCard';
import { SparklesIcon } from '@heroicons/react/24/outline';

const metrics = [
  { label: 'Value Moments', value: '14' },
  { label: 'NPS', value: '67' },
  { label: 'Milestones', value: '5' },
  { label: 'Personalized Touches', value: '22' },
  { label: 'Impact Reviews', value: '3' },
  { label: 'Last Impact', value: '1 week ago' },
];

const miniCharts = [
  { label: 'NPS Trend', data: [60, 62, 65, 66, 67] },
  { label: 'Value Moments', data: [10, 11, 12, 13, 14] },
  { label: 'Personalization', data: [15, 17, 19, 21, 22] },
];

const insights = [
  { category: 'Delight', color: 'green', text: 'Proactively created 3 moments of value this month.' },
  { category: 'Milestones', color: 'blue', text: 'Impact communicated at 2 key milestones.' },
  { category: 'Personalization', color: 'purple', text: 'Outreach personalized using data-driven insights.' },
  { category: 'Engagement', color: 'red', text: 'Customer engagement remains high.' },
];

const stages = [
  { name: 'Discovery', status: 'complete' },
  { name: 'Planning', status: 'complete' },
  { name: 'Execution', status: 'current' },
  { name: 'Review', status: 'upcoming' },
  { name: 'Celebrate', status: 'upcoming' },
];

const ImpactEngineersPage = () => (
  <AppLayout>
    <div className="flex flex-col gap-8">
      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col md:flex-row md:justify-between gap-4 min-h-[180px]">
        <div className="space-y-2 flex flex-col justify-center h-full">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-extrabold text-purple-700 tracking-tight">Impact Engineers</h2>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-gray-700 text-base items-center">
            <span className="font-medium text-gray-500">Status:</span>
            <span className="inline-block px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold ml-2">Active</span>
          </div>
        </div>
        {/* Progress Indicator */}
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          {stages.map((stage, idx) => (
            <React.Fragment key={stage.name}>
              <div className="flex flex-col items-center">
                <div className="flex items-center">
                  {stage.status === 'complete' ? (
                    <SparklesIcon className="h-6 w-6 text-green-500" />
                  ) : stage.status === 'current' ? (
                    <div className="h-6 w-6 rounded-full border-2 border-purple-500 bg-purple-100" />
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
                  )}
                  {idx < stages.length - 1 && (
                    <div className={`h-0.5 w-8 ${stage.status === 'complete' ? 'bg-green-500' : 'bg-gray-300'}`} />
                  )}
                </div>
                <span className={`mt-2 text-sm ${stage.status === 'complete' ? 'text-green-600' : stage.status === 'current' ? 'text-purple-600 font-medium' : 'text-gray-500'}`}>{stage.name}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Metrics and Insights */}
        <div className="flex-1">
          <KeyMetricsCard metrics={metrics} miniCharts={miniCharts} insights={insights} animate={false} />
        </div>
        {/* Right Sidebar: Recommended Action */}
        <aside className="w-full max-w-md flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center border border-gray-100">
            <span className="text-lg font-semibold text-gray-900 mb-2">Recommended Action:</span>
            <button
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 text-base flex items-center justify-center gap-2"
              tabIndex={0}
              aria-label="Create Impact Moment"
            >
              <SparklesIcon className="w-5 h-5" />
              Create Impact Moment
            </button>
            <p className="text-gray-500 text-sm mt-4 text-center">Personalize outreach and create new moments of value for your customers.</p>
          </div>
        </aside>
      </div>
    </div>
  </AppLayout>
);

export default ImpactEngineersPage; 