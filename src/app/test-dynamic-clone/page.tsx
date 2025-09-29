"use client";

import React, { useState } from 'react';
import TaskModeAdvanced from '@/components/artifacts/workflows/TaskModeAdvanced';
import { dynamicClone } from '@/components/artifacts/workflows/config/configs/DynamicClone';

export default function TestDynamicClonePage() {
  const [isOpen, setIsOpen] = useState(true);

  console.log('Testing Dynamic Clone Config:', {
    customerName: dynamicClone.customer.name,
    configName: 'dynamic-clone',
    hasChat: !!dynamicClone.chat,
    chatMode: dynamicClone.chat.mode
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Test Dynamic Clone - {dynamicClone.customer.name}</h1>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Exact Clone of Dynamic Chat AI</h2>
          <p className="text-gray-600 mb-4">
            This should work identically to the original dynamic-ai config and show "Dynamic Corp".
          </p>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-4"
        >
          Launch Dynamic Clone Test
        </button>

        <TaskModeAdvanced
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          workflowConfig={dynamicClone}
          workflowConfigName="dynamic-clone"
          showArtifact={false}
          artifact_visible={true}
          starting_with="ai"
        />
      </div>
    </div>
  );
}