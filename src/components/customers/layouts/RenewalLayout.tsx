"use client";
import React from 'react';
import BaseCustomerLayout, { BaseCustomerLayoutProps } from './BaseCustomerLayout';
import { renewalsChatSteps } from '../../../components/chat/chatWorkflow';
import MiniSparklineChart from '../shared/MiniSparklineChart';

interface RenewalLayoutProps extends BaseCustomerLayoutProps {
  prevCustomer?: string;
  nextCustomer?: string;
}

const RenewalLayout: React.FC<RenewalLayoutProps> = (props) => {
  const handleChatComplete = () => {
    // Handle chat completion if needed
    console.log('Chat workflow completed');
  };

  return (
    <BaseCustomerLayout
      {...props}
      chatSteps={renewalsChatSteps}
      onChatComplete={handleChatComplete}
    >
      {/* Left Panel Content */}
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Key Metrics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {props.stats.map(stat => (
              <div key={stat.label} className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">AI Insights</h2>
          <ul className="space-y-3">
            {props.aiInsights.map(insight => (
              <li key={insight.text} className={`p-3 rounded-lg border-l-4 bg-${insight.color}-50 border-${insight.color}-400`}>
                <p className={`text-sm text-${insight.color}-700 font-medium`}>{insight.category}</p>
                <p className={`text-xs text-${insight.color}-600`}>{insight.text}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Mini Charts */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Trends</h2>
          <div className="grid grid-cols-2 gap-4">
            {props.miniCharts.map(chart => (
              <div key={chart.label} className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 font-medium">{chart.label}</p>
                <div className="mt-2">
                  <MiniSparklineChart data={chart.data} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BaseCustomerLayout>
  );
};

export default RenewalLayout; 