"use client";

import React, { useState } from 'react';
import TaskModeAdvanced from '@/components/artifacts/workflows/TaskModeAdvanced';
import { contactStrategyDemoConfig } from '@/components/artifacts/workflows/config/configs/ContactStrategyDemoConfig';

export default function ContactStrategyDemoPage() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Contact Strategy Demo</h1>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Stakeholder Mapping & Relationship Management</h2>
          <p className="text-gray-600 mb-4">
            Interactive demo of stakeholder mapping and relationship management with contact editing and strategy recommendations.
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Features demonstrated:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Interactive stakeholder mapping</li>
              <li>Contact editing and management</li>
              <li>Relationship strength assessment</li>
              <li>Strategic contact recommendations</li>
              <li>Communication history tracking</li>
              <li>Influence and engagement scoring</li>
            </ul>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-4"
        >
          Launch Contact Strategy Demo
        </button>

        <TaskModeAdvanced
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          workflowConfig={contactStrategyDemoConfig}
          workflowConfigName="contact-strategy-demo"
          showArtifact={false}
          artifact_visible={true}
          starting_with="ai"
        />
      </div>
    </div>
  );
}