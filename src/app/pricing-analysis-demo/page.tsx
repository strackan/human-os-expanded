"use client";

import React, { useState } from 'react';
import { TaskModeModal } from '@/components/artifacts/workflows/TaskModeAdvanced';
import { pricingAnalysisDemoConfig } from '@/components/artifacts/workflows/config/configs/PricingAnalysisDemoConfig';

export default function PricingAnalysisDemoPage() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Pricing Analysis Demo</h1>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Strategic Pricing Optimization</h2>
          <p className="text-gray-600 mb-4">
            Strategic pricing optimization with market analysis, competitive positioning, and AI-powered recommendations.
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Features demonstrated:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Comprehensive pricing analysis dashboard</li>
              <li>Market analysis and competitive positioning</li>
              <li>AI-powered pricing recommendations</li>
              <li>Revenue optimization strategies</li>
              <li>Pricing scenario modeling</li>
              <li>Interactive pricing charts and graphs</li>
            </ul>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-4"
        >
          Launch Pricing Analysis Demo
        </button>

        <TaskModeModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          workflowConfig={pricingAnalysisDemoConfig}
          workflowConfigName="pricing-analysis-demo"
          showArtifact={false}
          artifact_visible={true}
          starting_with="ai"
        />
      </div>
    </div>
  );
}