import React from 'react';
import TaskModeStandalone from '../TaskModeStandalone';
import { WorkflowConfig } from '../config/WorkflowConfig';

/**
 * Utility function to create a standalone page component from any WorkflowConfig
 * This provides a consistent way to convert TaskModeAdvanced configs to standalone pages
 */
export const createStandalonePage = (
  config: WorkflowConfig,
  options: {
    configName?: string;
    showArtifact?: boolean;
    startingWith?: "ai" | "user";
    pageTitle?: string;
  } = {}
) => {
  const {
    configName = "standalone",
    showArtifact = false,
    startingWith = "ai",
    pageTitle = config.customer?.name || "Workflow"
  } = options;

  return function StandalonePage() {
    return (
      <div className="min-h-screen bg-gray-50">
        <TaskModeStandalone
          workflowConfig={config}
          workflowConfigName={configName}
          showArtifact={showArtifact}
          startingWith={startingWith}
        />
      </div>
    );
  };
};

/**
 * Higher-order component that wraps any WorkflowConfig in a standalone page
 */
export const withStandalonePage = (
  config: WorkflowConfig,
  options?: {
    configName?: string;
    showArtifact?: boolean;
    startingWith?: "ai" | "user";
    pageTitle?: string;
  }
) => {
  return createStandalonePage(config, options);
};



