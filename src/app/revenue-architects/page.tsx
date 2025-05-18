import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import KeyMetricsCard from '@/components/metrics/KeyMetricsCard';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

const metrics = [
  { label: 'Current ARR', value: '$450,000' },
  { label: 'Renewal Date', value: 'Aug 15, 2024' },
  { label: 'Usage', value: '92%' },
  { label: '2Y Avg PI%', value: '6.2%' },
  { label: 'Support Tickets (30d)', value: '3' },
  { label: 'Last Engagement', value: '4 days ago' },
];

const miniCharts = [
  { label: 'ARR Trend', data: [420, 430, 440, 445, 450] },
  { label: 'Usage', data: [88, 90, 91, 92, 92] },
  { label: 'PI%', data: [5.8, 6.0, 6.1, 6.2, 6.2] },
];

const insights = [
  { category: 'Profit', color: 'green', text: 'Customer is likely to accept a 5-7% price increase.' },
  { category: 'Engagement', color: 'blue', text: 'Recent support tickets resolved quickly; sentiment positive.' },
  { category: 'Sponsor', color: 'purple', text: 'Executive sponsor attended last QBR.' },
  { category: 'Risk', color: 'red', text: 'No open escalations; renewal risk is low.' },
];

const stages = [
  { name: 'Planning', status: 'current' },
  { name: 'Outreach', status: 'upcoming' },
  { name: 'Negotiation', status: 'upcoming' },
  { name: 'Approval', status: 'upcoming' },
  { name: 'Closed', status: 'upcoming' },
];

const RevenueArchitectsPage = () => (
  <AppLayout>
    <div className="flex flex-col gap-8">
      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col md:flex-row md:justify-between gap-4 min-h-[180px]">
        <div className="space-y-2 flex flex-col justify-center h-full">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-extrabold text-green-700 tracking-tight">Acme Corporation</h2>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-gray-700 text-base items-center">
            <span className="font-medium text-gray-500">Success Likelihood:</span>
            <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold ml-2">High</span>
          </div>
        </div>
        {/* Progress Indicator */}
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          {stages.map((stage, idx) => (
            <React.Fragment key={stage.name}>
              <div className="flex flex-col items-center">
                <div className="flex items-center">
                  {stage.status === 'complete' ? (
                    <CheckCircleIcon className="h-6 w-6 text-green-500" />
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
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-base flex items-center justify-center gap-2"
              tabIndex={0}
              aria-label="Prepare for Renewal"
            >
              <CheckCircleIcon className="w-5 h-5" />
              Prepare for Renewal
            </button>
            <p className="text-gray-500 text-sm mt-4 text-center">Please review the information to the left and feel free to ask any questions about this account.</p>
          </div>
        </aside>
      </div>
    </div>
  </AppLayout>
);

export default RevenueArchitectsPage; 