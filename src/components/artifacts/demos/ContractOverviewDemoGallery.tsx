"use client";

import React from 'react';
import { TaskModeModal } from '../workflows/TaskModeAdvanced';
import { contractDemoConfig } from '../workflows/config/configs';

export default function ContractOverviewDemoGallery() {
  return (
    <TaskModeModal
      isOpen={true}
      inline={true}
      workflowConfig={contractDemoConfig}
      workflowConfigName="contract-demo"
      onClose={() => {}}
      showArtifact={false}
      artifact_visible={true}
      starting_with="ai"
    />
  );
}