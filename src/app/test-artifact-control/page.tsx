'use client';

import React, { useRef, useState } from 'react';
import { TaskModeModal, TaskModeModalRef } from '../../components/artifacts/workflows/TaskModeAdvanced';
import { dynamicChatExampleConfig } from '../../components/artifacts/workflows/config/configs/DynamicChatExampleConfig';

const TestArtifactControlPage: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const taskModeRef = useRef<TaskModeModalRef>(null);

  const handleOpenArtifacts = () => {
    taskModeRef.current?.openArtifact();
  };

  const handleCloseArtifacts = () => {
    taskModeRef.current?.closeArtifact();
  };

  const handleToggleArtifacts = () => {
    taskModeRef.current?.toggleSplitMode();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Test Artifact Control Functionality
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Control Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setIsOpen(true)}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Open Task Mode
            </button>
            
            <button
              onClick={handleOpenArtifacts}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              Open Artifacts
            </button>
            
            <button
              onClick={handleCloseArtifacts}
              className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
            >
              Close Artifacts
            </button>
            
            <button
              onClick={handleToggleArtifacts}
              className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
            >
              Toggle Artifacts
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">How to Test</h2>
          <div className="space-y-4 text-gray-700">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">1. Initial State</h3>
              <p>Click "Open Task Mode" - the chat should start at full width (no artifacts visible)</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800 mb-2">2. Open Artifacts</h3>
              <p>Click "Open Artifacts" - the split mode should activate and show artifacts on the right</p>
            </div>
            
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <h3 className="font-semibold text-red-800 mb-2">3. Close Artifacts</h3>
              <p>Click "Close Artifacts" - artifacts should disappear and chat should return to full width</p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-800 mb-2">4. Toggle Functionality</h3>
              <p>Click "Toggle Artifacts" - should switch between showing and hiding artifacts</p>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h3 className="font-semibold text-yellow-800 mb-2">5. Exit Split Button</h3>
              <p>When artifacts are visible, click the "Exit Split" button in the chat interface - it should work correctly now</p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Configuration</h2>
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Config File:</strong> DynamicChatExampleConfig.ts</p>
            <p><strong>splitModeDefault:</strong> false (starts without artifacts)</p>
            <p><strong>showArtifact:</strong> true (artifacts are available when opened)</p>
          </div>
        </div>
      </div>

      <TaskModeModal
        ref={taskModeRef}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        showArtifact={true} // Artifacts are available when opened
        artifact_visible={true} // Artifacts are visible when in split mode
        workflowConfig={dynamicChatExampleConfig}
        workflowConfigName="dynamic-chat-example"
      />
    </div>
  );
};

export default TestArtifactControlPage;
