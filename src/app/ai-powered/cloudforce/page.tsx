"use client";

import React, { useState } from "react";
import AiCloudforceWorkflowActions from "./components/AiCloudforceWorkflowActions";
import AiCloudforceWorkflowModal from "./components/AiCloudforceWorkflowModal";
import { cloudforceData } from "../../../data/ai-powered-data"; // To use some data for context
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
  UserCircleIcon,
  ChartBarIcon,
  ChatBubbleLeftEllipsisIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";

export type WorkflowType = "negotiation" | "email" | "meeting" | "contract" | null;

// Minimalist mock components to represent the structure of AIPoweredLayout
const MockTopCard = ({ customerName }: { customerName: string }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-6">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
          {customerName}
        </h1>
        <p className="text-sm text-gray-500 mt-1">AI-Powered Renewal Management</p>
      </div>
      <div className="mt-4 md:mt-0 flex space-x-2">
        <button 
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Previous Customer"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <button 
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Next Customer"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
);

const MockDashboardCard = ({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) => (
  <div className="bg-white rounded-xl shadow-lg p-5 md:p-6">
    <div className="flex items-center text-gray-700 mb-4">
      <Icon className="w-6 h-6 mr-3 text-indigo-600" />
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
    <div>{children}</div>
  </div>
);

const CloudForcePage = () => {
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowType>(null);

  const openWorkflow = (workflowName: WorkflowType) => {
    if (workflowName) {
      setActiveWorkflow(workflowName);
    }
  };

  const closeWorkflow = () => {
    setActiveWorkflow(null);
  };

  const { customer, stats, aiInsights } = cloudforceData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-100 p-4 md:p-6 lg:p-8">
      <MockTopCard customerName={customer.name} />

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Left and Center Content Columns (Mimicking AIPoweredLayout structure) */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-6">
          <MockDashboardCard title="Key Metrics" icon={ChartBarIcon}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {stats.slice(0, 3).map(stat => (
                <div key={stat.label} className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                  <p className="text-xl font-bold text-slate-800 mt-0.5">{stat.value}</p>
                </div>
              ))}
            </div>
          </MockDashboardCard>
          
          <MockDashboardCard title="AI Insights" icon={SparklesIcon}>
            <ul className="space-y-3">
              {aiInsights.slice(0,2).map(insight => (
                <li key={insight.text} className={`p-3 rounded-lg border-l-4 bg-${insight.color}-50 border-${insight.color}-400`}>
                  <p className={`text-sm text-${insight.color}-700 font-medium`}>{insight.category}</p>
                  <p className={`text-xs text-${insight.color}-600`}>{insight.text}</p>
                </li>
              ))}
            </ul>
          </MockDashboardCard>

          <MockDashboardCard title="Customer Engagement (Placeholder)" icon={ChatBubbleLeftEllipsisIcon}>
            <p className="text-sm text-gray-600">
              This card would typically display recent communications, Q&A, or other engagement details.
              For this focused task, it serves as a placeholder to maintain page structure.
            </p>
          </MockDashboardCard>
        </div>

        {/* Right Sidebar - THIS IS THE MODIFIED AREA */}
        <div className="lg:col-span-1 xl:col-span-1 space-y-6">
          <MockDashboardCard title="Account Details" icon={UserCircleIcon}>
             <p className="text-sm text-gray-600">Renewal: {stats.find(s => s.label === "Renewal Date")?.value}</p>
             <p className={`text-sm mt-1 ${cloudforceData.riskColor === 'red' ? 'text-red-600' : cloudforceData.riskColor === 'blue' ? 'text-blue-600' : 'text-yellow-600'}`}>Risk: {cloudforceData.riskLevel}</p>
          </MockDashboardCard>
          
          {/* This is the card we are replacing the content of */}
          <div className="bg-white rounded-xl shadow-lg p-5 md:p-6">
            <AiCloudforceWorkflowActions openWorkflow={openWorkflow} />
          </div>

          <MockDashboardCard title="Alerts (Placeholder)" icon={ExclamationTriangleIcon}>
            <p className="text-sm text-gray-600">No critical alerts at this time.</p>
          </MockDashboardCard>

        </div>
      </div>

      <AiCloudforceWorkflowModal
        isOpen={activeWorkflow !== null}
        workflowType={activeWorkflow}
        onClose={closeWorkflow}
      />
    </div>
  );
};

export default CloudForcePage; 