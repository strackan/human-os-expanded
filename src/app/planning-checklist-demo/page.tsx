"use client";

import React, { useState } from 'react';
import TaskModeAdvanced from '@/components/artifacts/workflows/TaskModeAdvanced';
import { planningChecklistWorkingDemo } from '@/components/artifacts/workflows/config/configs/PlanningChecklistWorkingDemo';

export default function PlanningChecklistDemoPage() {
  const [isOpen, setIsOpen] = useState(true);

  // Debug: Log the configuration to verify it's correct
  console.log('Planning Checklist Working Demo Config:', {
    customerName: planningChecklistWorkingDemo.customer.name,
    configName: 'planning-checklist-working-demo',
    hasSlides: planningChecklistWorkingDemo.slides?.length || 0,
    isSlideConfig: !!planningChecklistWorkingDemo.slides
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Planning Checklist Demo - {planningChecklistWorkingDemo.customer.name}</h1>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Interactive Planning Checklist Artifact</h2>
          <p className="text-gray-600 mb-4">
            Comprehensive demo showcasing the planning checklist artifact with multiple template types and progress tracking.
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Features demonstrated:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Interactive checklist with multiple template types</li>
              <li>Progress tracking and step navigation</li>
              <li>Real-time artifact updates</li>
              <li>Side panel with workflow steps</li>
              <li>Chapter-based organization</li>
              <li>Action buttons for workflow control</li>
            </ul>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-4"
        >
          Launch Planning Checklist Demo
        </button>

        <TaskModeAdvanced
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          workflowConfig={planningChecklistWorkingDemo}
          workflowConfigName="planning-checklist-working-demo"
          showArtifact={false}
          artifact_visible={true}
          starting_with="ai"
        />
      </div>
    </div>
  );
}