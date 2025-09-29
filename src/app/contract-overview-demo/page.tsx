"use client";

import React, { useState } from 'react';
import TaskModeAdvanced from '@/components/artifacts/workflows/TaskModeAdvanced';
import { contractDemoConfig } from '@/components/artifacts/workflows/config/configs/ContractDemoConfig';

export default function ContractOverviewDemoPage() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Contract Overview Demo</h1>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Enterprise Contract Analysis Artifact</h2>
          <p className="text-gray-600 mb-4">
            Complex enterprise contract analysis with risk assessment, business terms categorization, and pricing breakdown.
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Features demonstrated:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Comprehensive contract overview display</li>
              <li>Risk assessment and scoring</li>
              <li>Business terms categorization</li>
              <li>Pricing and licensing analysis</li>
              <li>Timeline and milestone tracking</li>
              <li>Interactive contract sections</li>
            </ul>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-4"
        >
          Launch Contract Overview Demo
        </button>

        <TaskModeAdvanced
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          workflowConfig={contractDemoConfig}
          workflowConfigName="contract-demo"
          showArtifact={false}
          artifact_visible={true}
          starting_with="ai"
        />
      </div>
    </div>
  );
}