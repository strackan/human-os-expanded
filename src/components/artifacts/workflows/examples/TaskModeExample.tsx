/**
 * Example usage of TaskModeModal with new artifact control methods
 * 
 * This example demonstrates:
 * - Using showArtifact prop to control initial state
 * - Programmatically controlling artifacts with ref methods
 * - Different ways to trigger artifact visibility
 */

import React, { useRef, useState } from 'react';
import { TaskModeModal, TaskModeModalRef } from '../TaskModeAdvanced';
import { defaultWorkflowConfig } from '../config/WorkflowConfig';

const TaskModeExample: React.FC = () => {
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
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">TaskModeModal Example</h2>
      
      <div className="flex space-x-4">
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Open Task Mode
        </button>
        
        <button
          onClick={handleOpenArtifacts}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Open Artifacts
        </button>
        
        <button
          onClick={handleCloseArtifacts}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Close Artifacts
        </button>
        
        <button
          onClick={handleToggleArtifacts}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Toggle Artifacts
        </button>
      </div>

      <div className="text-sm text-gray-600 space-y-2">
        <p><strong>showArtifact=false:</strong> Chat starts at full width</p>
        <p><strong>openArtifact():</strong> Opens split mode with artifacts</p>
        <p><strong>closeArtifact():</strong> Closes artifacts and exits split</p>
        <p><strong>toggleSplitMode():</strong> Toggles between modes</p>
      </div>

      <TaskModeModal
        ref={taskModeRef}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        showArtifact={false} // Start without artifacts visible
        artifact_visible={true} // Artifacts are available when opened
        workflowConfig={defaultWorkflowConfig}
      />
    </div>
  );
};

export default TaskModeExample;
