import React, { useState } from 'react';
import WorkflowWrapper from './WorkflowWrapper';
import { WorkflowConfig } from './config/WorkflowConfig';

// Import your custom configs here
// Change this import to whatever config you're actively working on
import { bluebirdMemorialPlanningConfig } from './config/configs/BluebirdMemorialConfig-Planning';

// ACTIVE CONFIG - Change this line to point to your current config
const ACTIVE_CONFIG: WorkflowConfig = bluebirdMemorialPlanningConfig;
// Example: const ACTIVE_CONFIG = blueBirdMemorialPlanningConfig;

const TaskModeCustom = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);

  return (
    <>
      <WorkflowWrapper
        config={ACTIVE_CONFIG}
        configName="bluebird-planning"
        startingWith="ai"
        artifactVisible={true}
        autoOpen={isModalOpen}
      />
      {!isModalOpen && (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Custom Task Mode</h2>
            <p className="text-gray-600 mb-4">
              Currently using: {ACTIVE_CONFIG.customer.name}
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