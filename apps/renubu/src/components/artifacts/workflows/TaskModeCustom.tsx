import React, { useState } from 'react';
import { TaskModeModal } from './TaskModeAdvanced';
import { WorkflowConfig } from './config/WorkflowConfig';

// Import your custom configs here
// Change this import to whatever config you're actively working on
import { bluebirdMemorialPlanningConfig } from './config/configs/BluebirdMemorialConfig-Planning';

// ACTIVE CONFIG - Change this line to point to your current config
const ACTIVE_CONFIG: WorkflowConfig = bluebirdMemorialPlanningConfig;
// Example: const ACTIVE_CONFIG = dynamicChatAI;

interface TaskModeCustomProps {
  inline?: boolean;
  isOpen?: boolean;
  workflowConfig?: WorkflowConfig;
  workflowConfigName?: string;
  onClose?: () => void;
}

const TaskModeCustom: React.FC<TaskModeCustomProps> = ({
  inline = false,
  isOpen = true,
  workflowConfig = ACTIVE_CONFIG,
  workflowConfigName = "bluebird-memorial-planning",
  onClose = () => {}
}) => {
  const [isModalOpen, setIsModalOpen] = useState(isOpen);

  // Detect if we're in gallery context
  const isInGallery = typeof window !== 'undefined' &&
    window.location.pathname.includes('/artifacts/gallery');

  return (
    <>
      <TaskModeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          onClose();
        }}
        workflowConfig={workflowConfig}
        workflowConfigName={workflowConfigName}
        showArtifact={false} // Start without artifacts visible
        artifact_visible={true} // Artifacts available when opened
        starting_with="ai"
        inline={inline || isInGallery}
      />
      {!isModalOpen && !inline && !isInGallery && (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Custom Task Mode</h2>
            <p className="text-gray-600 mb-4">
              Currently using: {workflowConfig.customer.name}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Reopen Custom Task Mode
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// Minimal demo wrapper
const Demo = () => {
  return <TaskModeCustom />;
};

export default Demo;