"use client";

import React, { useState } from 'react';
import TaskModeAdvanced from '@/components/artifacts/workflows/TaskModeAdvanced';
import { allArtifactsMasterDemo } from '@/components/artifacts/workflows/config/configs/AllArtifactsMasterDemo';

export default function CompleteWorkflowDemoPage() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Complete Workflow Demo</h1>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Comprehensive Enterprise Renewal Workflow</h2>
          <p className="text-gray-600 mb-4">
            Comprehensive enterprise renewal workflow showcasing all 5 artifacts working together in a realistic scenario.
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Complete artifact showcase including:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Planning Checklist - Interactive task management</li>
              <li>Contact Strategy - Stakeholder mapping and relationship management</li>
              <li>Contract Overview - Enterprise contract analysis and risk assessment</li>
              <li>Pricing Analysis - Strategic pricing optimization and market analysis</li>
              <li>Plan Summary - Comprehensive workflow tracking and execution</li>
              <li>Integrated workflow with planning plugins and progress meters</li>
            </ul>
          </div>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Estimated Time:</strong> 15-20 minutes for complete walkthrough
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-4"
        >
          Launch Complete Workflow Demo
        </button>

        <TaskModeAdvanced
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          workflowConfig={allArtifactsMasterDemo}
          workflowConfigName="all-artifacts-master-demo"
          showArtifact={false}
          artifact_visible={true}
          starting_with="ai"
        />
      </div>
    </div>
  );
}