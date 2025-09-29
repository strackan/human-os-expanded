"use client";

import React, { useState } from 'react';
import TaskModeAdvanced from '@/components/artifacts/workflows/TaskModeAdvanced';
import { planningChecklistTestConfig } from '@/components/artifacts/workflows/config/configs/PlanningChecklistTestConfig';

export default function TestPlanningChecklistPage() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Test Planning Checklist Implementation</h1>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Implementation Test</h2>
          <p className="text-gray-600 mb-4">
            This page tests the new Planning Checklist artifact type with the showMenu action.
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Expected behavior:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Click "Start Planning" button</li>
              <li>Planning checklist artifact should appear</li>
              <li>Menu/sidebar should automatically show (showMenu action)</li>
              <li>Checklist should have interactive checkboxes</li>
              <li>Action buttons should work: "Let's Do It!", "Not Yet", "Go Back"</li>
            </ul>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-4"
        >
          Open Test Workflow
        </button>

        <TaskModeAdvanced
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          workflowConfig={planningChecklistTestConfig}
          workflowConfigName="planning-checklist-test"
          showArtifact={false}
          artifact_visible={true}
          starting_with="ai"
        />
      </div>
    </div>
  );
}