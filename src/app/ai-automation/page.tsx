import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import KeyMetricsCard from '@/components/metrics/KeyMetricsCard';
import { BoltIcon } from '@heroicons/react/24/outline';

const metrics = [
  { label: 'Tasks Automated', value: '1,250' },
  { label: 'Time Saved', value: '320 hrs' },
  { label: 'Accuracy', value: '98.7%' },
  { label: 'Churn Risk Reduced', value: '12%' },
  { label: 'AI Workflows', value: '7' },
  { label: 'Last Run', value: '2 hours ago' },
];

const miniCharts = [
  { label: 'Automation Trend', data: [800, 950, 1100, 1200, 1250] },
  { label: 'Time Saved', data: [200, 240, 280, 310, 320] },
  { label: 'Accuracy', data: [97.5, 98.0, 98.2, 98.5, 98.7] },
];

const insights = [
  { category: 'Churn Prediction', color: 'red', text: 'Churn risk reduced by 12% through automated outreach.' },
  { category: 'Workflow Triggers', color: 'blue', text: 'AI triggered 3 renewal workflows this week.' },
  { category: 'Efficiency', color: 'green', text: '320 hours saved for CSMs this quarter.' },
  { category: 'Coverage', color: 'purple', text: 'All key inflection points are now automated.' },
];

const stages = [
  { name: 'Setup', status: 'complete' },
  { name: 'Monitoring', status: 'current' },
  { name: 'Optimization', status: 'upcoming' },
  { name: 'Expansion', status: 'upcoming' },
  { name: 'Review', status: 'upcoming' },
];

const AIPoweredAutomationPage = () => (
  <AppLayout>
    <div className="flex flex-col gap-8">
      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col md:flex-row md:justify-between gap-4 min-h-[180px]">
        <div className="space-y-2 flex flex-col justify-center h-full">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-extrabold text-blue-700 tracking-tight">AI-Powered Automation</h2>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-gray-700 text-base items-center">
            <span className="font-medium text-gray-500">Status:</span>
            <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold ml-2">Active</span>
          </div>
        </div>
        {/* Progress Indicator */}
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          {stages.map((stage, idx) => (
            <React.Fragment key={stage.name}>
              <div className="flex flex-col items-center">
                <div className="flex items-center">
                  {stage.status === 'complete' ? (
                    <BoltIcon className="h-6 w-6 text-green-500" />
                  ) : stage.status === 'current' ? (
                    <div className="h-6 w-6 rounded-full border-2 border-blue-500 bg-blue-100" />
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
                  )}
                  {idx < stages.length - 1 && (
                    <div className={`h-0.5 w-8 ${stage.status === 'complete' ? 'bg-green-500' : 'bg-gray-300'}`} />
                  )}
                </div>
                <span className={`mt-2 text-sm ${stage.status === 'complete' ? 'text-green-600' : stage.status === 'current' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>{stage.name}</span>
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-base flex items-center justify-center gap-2"
              tabIndex={0}
              aria-label="Enable Automation"
            >
              <BoltIcon className="w-5 h-5" />
              Enable Automation
            </button>
            <p className="text-gray-500 text-sm mt-4 text-center">Review automation stats and enable new workflows to maximize efficiency.</p>
          </div>
        </aside>
      </div>
    </div>
  </AppLayout>
);

export default AIPoweredAutomationPage; 