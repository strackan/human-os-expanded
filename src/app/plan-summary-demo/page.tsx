"use client";

import React, { useState } from 'react';
import { TaskModeModal } from '@/components/artifacts/workflows/TaskModeAdvanced';
import { planSummaryDemoConfig } from '@/components/artifacts/workflows/config/configs/PlanSummaryDemoConfig';

export default function PlanSummaryDemoPage() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Plan Summary Demo</h1>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Comprehensive Workflow Tracking</h2>
          <p className="text-gray-600 mb-4">
            Comprehensive workflow tracking with completed tasks, integration status, and next steps planning.
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Features demonstrated:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Progress tracking and status visualization</li>
              <li>Completed tasks and milestone tracking</li>
              <li>Integration status monitoring</li>
              <li>Next steps planning and recommendations</li>
              <li>Key metrics and performance indicators</li>
              <li>Workflow execution reporting</li>
            </ul>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-4"
        >
          Launch Plan Summary Demo
        </button>

        <TaskModeModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          workflowConfig={planSummaryDemoConfig}
          workflowConfigName="plan-summary-demo"
          showArtifact={false}
          artifact_visible={true}
          starting_with="ai"
        />
      </div>
    </div>
  );
}